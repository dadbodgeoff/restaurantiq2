// src/domains/snapshot/services/daily-snapshot.service.ts
// DailySnapshot Service - Business Logic Layer for Source of Truth

import { DailySnapshotRepository } from '../repositories/daily-snapshot.repository';
import { RestaurantRepository } from '../../restaurant/repositories/restaurant.repository';
import { UserRepository } from '../../restaurant/repositories/user.repository';
import {
  DailySnapshot,
  CreateSnapshotData,
  FinalizeSnapshotData,
  SnapshotQuery,
  SnapshotValidationResult,
  PrePData,
  SnapshotConflict,
  SnapshotCreatedEventData,
  SnapshotFinalizedEventData,
  SnapshotEventTypes
} from '../../shared/types/snapshot';
import { DomainEventBus, createDomainEvent } from '../../../lib/events/domain-events';
import { BusinessRuleError } from '../../../lib/errors/specific-errors';

export class DailySnapshotService {
  constructor(
    private snapshotRepository: DailySnapshotRepository,
    private restaurantRepository: RestaurantRepository,
    private userRepository: UserRepository,
    private eventBus: DomainEventBus
  ) {}

  /**
   * Create a new daily snapshot from PREP data
   */
  async createDailySnapshot(
    restaurantId: string,
    snapshotDate: Date,
    prepData: PrePData,
    userId: string,
    correlationId: string
  ): Promise<DailySnapshot> {
    // Validate inputs
    this.validateSnapshotCreation(restaurantId, snapshotDate, prepData, userId);

    // Get restaurant details for timezone and settings
    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      throw new BusinessRuleError(
        `Restaurant not found: ${restaurantId}`,
        correlationId,
        { restaurantId }
      );
    }

    // Check business rules
    await this.validateBusinessRules(restaurantId, snapshotDate, correlationId);

    // Prepare snapshot data
    const snapshotData: CreateSnapshotData = {
      restaurantId,
      snapshotDate,
      prepData,
      createdBy: userId,
      correlationId,
      businessDate: snapshotDate,
      timezone: restaurant.timezone,
    };

    // Create snapshot
    const snapshot = await this.snapshotRepository.createSnapshot(snapshotData);

    // Publish domain event with consistent structure
    await this.eventBus.publish(createDomainEvent(
      SnapshotEventTypes.SNAPSHOT_CREATED,
      snapshot.id,
      'DailySnapshot',
      {
        snapshotId: snapshot.id,
        restaurantId,
        snapshotDate,
        status: snapshot.status,
        createdBy: userId,
        version: snapshot.version,
      },
      {
        timestamp: new Date(),
        correlationId,
        userId,
        restaurantId,
        version: snapshot.version,
      }
    ));

    return snapshot;
  }

  /**
   * Finalize a snapshot (make it immutable source of truth)
   */
  async finalizeSnapshot(
    snapshotId: string,
    userId: string,
    correlationId: string,
    finalData?: PrePData
  ): Promise<DailySnapshot> {
    // Validate user permissions (should be MANAGER or OWNER)
    await this.validateFinalizationPermissions(snapshotId, userId, correlationId);

    // Check if finalization is within allowed time window
    await this.validateFinalizationTimeWindow(snapshotId, correlationId);

    // Prepare finalization data
    const finalizeData: FinalizeSnapshotData = {
      snapshotId,
      finalizedBy: userId,
      correlationId,
      finalData,
    };

    // Finalize snapshot
    const finalizedSnapshot = await this.snapshotRepository.finalizeSnapshot(finalizeData);

    // Publish domain event with consistent structure
    await this.eventBus.publish(createDomainEvent(
      SnapshotEventTypes.SNAPSHOT_FINALIZED,
      finalizedSnapshot.id,
      'DailySnapshot',
      {
        snapshotId: finalizedSnapshot.id,
        restaurantId: finalizedSnapshot.restaurantId,
        finalizedBy: userId,
        finalHash: finalizedSnapshot.sha256!,
        finalizedAt: finalizedSnapshot.finalizedAt!,
        version: finalizedSnapshot.version,
      },
      {
        timestamp: new Date(),
        correlationId,
        userId,
        restaurantId: finalizedSnapshot.restaurantId,
        version: finalizedSnapshot.version,
      }
    ));

    return finalizedSnapshot;
  }

  /**
   * Get snapshot for specific date (D-1 sourcing)
   */
  async getSnapshotForDate(
    restaurantId: string,
    date: Date,
    correlationId: string
  ): Promise<DailySnapshot | null> {
    // Validate restaurant exists
    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      throw new BusinessRuleError(
        `Restaurant not found: ${restaurantId}`,
        correlationId,
        { restaurantId }
      );
    }

    // Get snapshot for the date
    const snapshot = await this.snapshotRepository.findByDateAndRestaurant(restaurantId, date);

    if (!snapshot) {
      throw new BusinessRuleError(
        `No finalized snapshot found for date ${date.toISOString().split('T')[0]}`,
        correlationId,
        { restaurantId, date: date.toISOString() }
      );
    }

    // Validate snapshot integrity
    const isValid = await this.snapshotRepository.validateSnapshotIntegrity(snapshot.id);
    if (!isValid) {
      throw new BusinessRuleError(
        `Snapshot data integrity check failed: ${snapshot.id}`,
        correlationId,
        { snapshotId: snapshot.id }
      );
    }

    // Must be FINALIZED to be source of truth
    if (snapshot.status !== 'FINALIZED') {
      throw new BusinessRuleError(
        `Snapshot is not finalized and cannot be used as source of truth`,
        correlationId,
        { snapshotId: snapshot.id, status: snapshot.status }
      );
    }

    return snapshot;
  }

  /**
   * Get D-1 snapshot for revenue calculations
   */
  async getD1SnapshotForRevenue(
    restaurantId: string,
    targetDate: Date,
    correlationId: string
  ): Promise<DailySnapshot> {
    // Calculate D-1 date (previous day)
    const d1Date = new Date(targetDate);
    d1Date.setDate(d1Date.getDate() - 1);

    const snapshot = await this.getSnapshotForDate(restaurantId, d1Date, correlationId);

    if (!snapshot) {
      throw new BusinessRuleError(
        `No D-1 snapshot available for revenue calculations on ${targetDate.toISOString().split('T')[0]}`,
        correlationId,
        { restaurantId, targetDate: targetDate.toISOString(), d1Date: d1Date.toISOString() }
      );
    }

    return snapshot;
  }

  /**
   * Query snapshots with filtering
   */
  async querySnapshots(query: SnapshotQuery, correlationId: string): Promise<DailySnapshot[]> {
    // Validate restaurant exists
    const restaurant = await this.restaurantRepository.findById(query.restaurantId);
    if (!restaurant) {
      throw new BusinessRuleError(
        `Restaurant not found: ${query.restaurantId}`,
        correlationId,
        { restaurantId: query.restaurantId }
      );
    }

    return await this.snapshotRepository.findMany(query);
  }

  /**
   * Get snapshot history for audit trail
   */
  async getSnapshotHistory(
    restaurantId: string,
    limit: number = 30,
    correlationId: string
  ): Promise<DailySnapshot[]> {
    // Validate restaurant exists
    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      throw new BusinessRuleError(
        `Restaurant not found: ${restaurantId}`,
        correlationId,
        { restaurantId }
      );
    }

    return await this.snapshotRepository.getHistory(restaurantId, limit);
  }

  /**
   * Update snapshot data (only for DRAFT status)
   */
  async updateSnapshotData(
    snapshotId: string,
    data: PrePData,
    userId: string,
    correlationId: string
  ): Promise<DailySnapshot> {
    // Get current snapshot to validate ownership
    const currentSnapshot = await this.snapshotRepository.findById(snapshotId);
    if (!currentSnapshot) {
      throw new BusinessRuleError(
        `Snapshot not found: ${snapshotId}`,
        correlationId,
        { snapshotId }
      );
    }

    // Validate user has access to restaurant
    if (currentSnapshot.restaurantId !== await this.getUserRestaurantId(userId)) {
      throw new BusinessRuleError(
        'Access denied: User does not belong to restaurant',
        correlationId,
        { snapshotId, userId, restaurantId: currentSnapshot.restaurantId }
      );
    }

    // Update snapshot data
    const updatedSnapshot = await this.snapshotRepository.updateSnapshotData(
      snapshotId,
      data,
      userId
    );

    return updatedSnapshot;
  }

  /**
   * Validate snapshot data integrity
   */
  async validateSnapshot(snapshotId: string, correlationId: string): Promise<SnapshotValidationResult> {
    const snapshot = await this.snapshotRepository.findById(snapshotId);
    if (!snapshot) {
      return {
        isValid: false,
        errors: [`Snapshot not found: ${snapshotId}`],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if finalized snapshot has SHA256 hash
    if (snapshot.status === 'FINALIZED' && !snapshot.sha256) {
      errors.push('Finalized snapshot missing integrity hash');
    }

    // Validate data structure
    if (!snapshot.data || typeof snapshot.data !== 'object') {
      errors.push('Invalid snapshot data structure');
    }

    // Check metadata completeness
    if (!snapshot.metadata) {
      errors.push('Missing snapshot metadata');
    } else {
      if (!snapshot.metadata.createdBy) {
        warnings.push('Missing createdBy in metadata');
      }
      if (!snapshot.metadata.businessDate) {
        warnings.push('Missing businessDate in metadata');
      }
    }

    // Integrity hash validation
    if (snapshot.sha256) {
      const isValidHash = await this.snapshotRepository.validateSnapshotIntegrity(snapshotId);
      if (!isValidHash) {
        errors.push('Snapshot data integrity check failed');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      hash: snapshot.sha256,
    };
  }

  // ==========================================
  // PRIVATE VALIDATION METHODS
  // ==========================================

  private validateSnapshotCreation(
    restaurantId: string,
    snapshotDate: Date,
    prepData: PrePData,
    userId: string
  ): void {
    if (!restaurantId || restaurantId.trim().length === 0) {
      throw new BusinessRuleError('Restaurant ID is required', '', { restaurantId });
    }

    if (!snapshotDate) {
      throw new BusinessRuleError('Snapshot date is required', '', { snapshotDate });
    }

    if (!prepData || !prepData.items || !Array.isArray(prepData.items)) {
      throw new BusinessRuleError('Valid PREP data is required', '', {
        hasPrepData: !!prepData,
        hasItems: prepData?.items && Array.isArray(prepData.items)
      });
    }

    if (!userId || userId.trim().length === 0) {
      throw new BusinessRuleError('User ID is required', '', { userId });
    }

    // Validate PREP data structure
    if (prepData.items.length === 0) {
      throw new BusinessRuleError('PREP data must contain at least one item', '', {
        itemCount: prepData.items.length
      });
    }

    // Validate each PREP item
    prepData.items.forEach((item, index) => {
      if (!item.menuItemId || !item.name) {
        throw new BusinessRuleError(
          `PREP item at index ${index} missing required fields`,
          '',
          { itemIndex: index, hasMenuItemId: !!item.menuItemId, hasName: !!item.name }
        );
      }
    });
  }

  private async validateBusinessRules(
    restaurantId: string,
    snapshotDate: Date,
    correlationId: string
  ): Promise<void> {
    // Check if snapshot already exists for this date
    const existingSnapshot = await this.snapshotRepository.findByDateAndRestaurant(
      restaurantId,
      snapshotDate
    );

    if (existingSnapshot && existingSnapshot.status === 'FINALIZED') {
      throw new BusinessRuleError(
        `Snapshot already finalized for date ${snapshotDate.toISOString().split('T')[0]}`,
        correlationId,
        {
          restaurantId,
          snapshotDate: snapshotDate.toISOString(),
          existingSnapshotId: existingSnapshot.id
        }
      );
    }

    // Validate date is not in future (business rule)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (snapshotDate > today) {
      throw new BusinessRuleError(
        'Cannot create snapshot for future date',
        correlationId,
        { snapshotDate: snapshotDate.toISOString(), today: today.toISOString() }
      );
    }
  }

  private async validateFinalizationPermissions(
    snapshotId: string,
    userId: string,
    correlationId: string
  ): Promise<void> {
    // Get snapshot to check restaurant ownership
    const snapshot = await this.snapshotRepository.findById(snapshotId);
    if (!snapshot) {
      throw new BusinessRuleError(
        `Snapshot not found: ${snapshotId}`,
        correlationId,
        { snapshotId }
      );
    }

    // Validate user belongs to restaurant
    const userRestaurantId = await this.getUserRestaurantId(userId);
    if (snapshot.restaurantId !== userRestaurantId) {
      throw new BusinessRuleError(
        'Access denied: User does not belong to restaurant',
        correlationId,
        { snapshotId, userId, restaurantId: snapshot.restaurantId }
      );
    }

    // Additional permission checks could be added here based on user roles
    // For now, any user in the restaurant can finalize (per business rules)
  }

  private async validateFinalizationTimeWindow(
    snapshotId: string,
    correlationId: string
  ): Promise<void> {
    const snapshot = await this.snapshotRepository.findById(snapshotId);
    if (!snapshot) return; // Already validated in permissions check

    // Get restaurant settings for finalization time window
    const restaurant = await this.restaurantRepository.findById(snapshot.restaurantId);
    if (!restaurant || !restaurant.settings) return;

    const settings = restaurant.settings as any;
    const finalizationTime = settings.prepFinalizationTime || '23:30';
    const gracePeriodHours = settings.gracePeriodHours || 1;

    // Parse finalization time
    const [hours, minutes] = finalizationTime.split(':').map(Number);
    const finalizationDateTime = new Date(snapshot.snapshotDate);
    finalizationDateTime.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const gracePeriodEnd = new Date(finalizationDateTime.getTime() + (gracePeriodHours * 60 * 60 * 1000));

    // Check if within grace period
    if (now > gracePeriodEnd) {
      // Allow finalization but log warning
      console.warn(`Finalizing snapshot outside grace period: ${snapshotId}`, {
        finalizationTime,
        gracePeriodHours,
        now: now.toISOString(),
        gracePeriodEnd: gracePeriodEnd.toISOString(),
        correlationId
      });
    }
  }

  private async getUserRestaurantId(userId: string): Promise<string> {
    // Get user from UserRepository to validate access and get restaurant ID
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new BusinessRuleError(
        `User not found: ${userId}`,
        'unknown',
        { userId }
      );
    }

    if (!user.isActive) {
      throw new BusinessRuleError(
        `User is inactive: ${userId}`,
        'unknown',
        { userId }
      );
    }

    return user.restaurantId;
  }
}
