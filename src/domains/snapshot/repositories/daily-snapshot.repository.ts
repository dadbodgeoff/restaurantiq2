// src/domains/snapshot/repositories/daily-snapshot.repository.ts
// DailySnapshot Repository - Source of Truth implementation following .cursorrules

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { DailySnapshot, SnapshotStatus, CreateSnapshotData, FinalizeSnapshotData, SnapshotQuery } from '../../shared/types/snapshot';
import { BaseRepository } from '../../shared/base-repository';

export class DailySnapshotRepository extends BaseRepository {
  private prismaClient: PrismaClient;

  constructor(prisma: PrismaClient) {
    super(prisma);
    // Store direct reference to avoid Awilix interception issues
    this.prismaClient = prisma;
  }

  /**
   * Create a new daily snapshot
   */
  async createSnapshot(data: CreateSnapshotData): Promise<DailySnapshot> {
    this.validateRequiredString(data.restaurantId, 'Restaurant ID');
    this.validateId(data.restaurantId, 'Restaurant');

    return this.executeQuery(async () => {
      this.logOperation('createSnapshot', {
        restaurantId: data.restaurantId,
        snapshotDate: data.snapshotDate.toISOString(),
        createdBy: data.createdBy
      });

      // Check for existing snapshot for this date
      const existingSnapshot = await this.prismaClient.dailySnapshot.findFirst({
        where: {
          restaurantId: data.restaurantId,
          snapshotDate: data.snapshotDate,
        },
      });

      if (existingSnapshot) {
        // If exists and is DRAFT, update it; if FINALIZED, throw error
        if (existingSnapshot.status === 'FINALIZED') {
          throw new Error(`Snapshot already exists and is finalized for date ${data.snapshotDate.toISOString()}`);
        }

        // Update existing DRAFT snapshot
        const updatedSnapshot = await this.prismaClient.dailySnapshot.update({
          where: { id: existingSnapshot.id },
          data: {
            data: data.prepData,
            metadata: {
              createdBy: data.createdBy,
              prepFinalizationTime: '23:30', // Default from restaurant settings
              menuVersion: data.prepData.version,
              totalItems: data.prepData.summary.totalItems,
              totalValue: data.prepData.summary.totalValue,
              integrityHash: this.generateIntegrityHash(data.prepData),
              businessDate: data.businessDate,
              timezone: data.timezone,
              correlationId: data.correlationId,
            },
            version: existingSnapshot.version + 1,
            updatedAt: new Date(),
          },
        });

        return this.mapPrismaToDomain(updatedSnapshot);
      }

      // Create new snapshot
      const newSnapshot = await this.prismaClient.dailySnapshot.create({
        data: {
          snapshotDate: data.snapshotDate,
          status: 'DRAFT',
          version: 1,
          data: data.prepData,
          metadata: {
            createdBy: data.createdBy,
            prepFinalizationTime: '23:30', // Default from restaurant settings
            menuVersion: data.prepData.version,
            totalItems: data.prepData.summary.totalItems,
            totalValue: data.prepData.summary.totalValue,
            integrityHash: this.generateIntegrityHash(data.prepData),
            businessDate: data.businessDate,
            timezone: data.timezone,
            correlationId: data.correlationId,
          },
          restaurantId: data.restaurantId,
        },
      });

      return this.mapPrismaToDomain(newSnapshot);
    }, 'createSnapshot');
  }

  /**
   * Finalize a snapshot (make it immutable)
   */
  async finalizeSnapshot(data: FinalizeSnapshotData): Promise<DailySnapshot> {
    this.validateId(data.snapshotId, 'Snapshot');

    return this.executeQuery(async () => {
      this.logOperation('finalizeSnapshot', {
        snapshotId: data.snapshotId,
        finalizedBy: data.finalizedBy
      });

      // Get current snapshot
      const currentSnapshot = await this.prismaClient.dailySnapshot.findUnique({
        where: { id: data.snapshotId },
      });

      if (!currentSnapshot) {
        throw new Error(`Snapshot not found: ${data.snapshotId}`);
      }

      if (currentSnapshot.status === 'FINALIZED') {
        throw new Error(`Snapshot is already finalized: ${data.snapshotId}`);
      }

      // Calculate final integrity hash
      const finalData = data.finalData || currentSnapshot.data as any;
      const finalHash = this.generateSHA256(finalData);

      // Update to FINALIZED status
      const finalizedSnapshot = await this.prismaClient.dailySnapshot.update({
        where: { id: data.snapshotId },
        data: {
          status: 'FINALIZED',
          sha256: finalHash,
          finalizedAt: new Date(),
          data: finalData,
          metadata: {
            ...(currentSnapshot.metadata as any),
            finalizedBy: data.finalizedBy,
            integrityHash: finalHash,
          },
          version: currentSnapshot.version + 1,
        },
      });

      return this.mapPrismaToDomain(finalizedSnapshot);
    }, 'finalizeSnapshot');
  }

  /**
   * Get snapshot by ID
   */
  async findById(snapshotId: string): Promise<DailySnapshot | null> {
    this.validateId(snapshotId, 'Snapshot');

    return this.executeQuery(async () => {
      this.logOperation('findById', { snapshotId });

      const snapshot = await this.prismaClient.dailySnapshot.findUnique({
        where: { id: snapshotId },
      });

      if (!snapshot) return null;

      return this.mapPrismaToDomain(snapshot);
    }, 'findById');
  }

  /**
   * Get snapshot for specific date and restaurant
   */
  async findByDateAndRestaurant(restaurantId: string, date: Date): Promise<DailySnapshot | null> {
    this.validateId(restaurantId, 'Restaurant');

    return this.executeQuery(async () => {
      this.logOperation('findByDateAndRestaurant', {
        restaurantId,
        date: date.toISOString()
      });

      const snapshot = await this.prismaClient.dailySnapshot.findFirst({
        where: {
          restaurantId,
          snapshotDate: date,
        },
      });

      if (!snapshot) return null;

      return this.mapPrismaToDomain(snapshot);
    }, 'findByDateAndRestaurant');
  }

  /**
   * Query snapshots with filters
   */
  async findMany(query: SnapshotQuery): Promise<DailySnapshot[]> {
    this.validateId(query.restaurantId, 'Restaurant');

    return this.executeQuery(async () => {
      this.logOperation('findMany', {
        restaurantId: query.restaurantId,
        date: query.date?.toISOString(),
        status: query.status,
        limit: query.limit,
        offset: query.offset
      });

      const where: any = {
        restaurantId: query.restaurantId,
      };

      if (query.date) {
        where.snapshotDate = query.date;
      }

      if (query.status) {
        where.status = query.status;
      }

      const snapshots = await this.prismaClient.dailySnapshot.findMany({
        where,
        orderBy: { snapshotDate: 'desc' },
        take: query.limit || 50,
        skip: query.offset || 0,
      });

      return snapshots.map(snapshot => this.mapPrismaToDomain(snapshot));
    }, 'findMany');
  }

  /**
   * Get snapshot history for restaurant
   */
  async getHistory(restaurantId: string, limit: number = 30): Promise<DailySnapshot[]> {
    this.validateId(restaurantId, 'Restaurant');

    return this.executeQuery(async () => {
      this.logOperation('getHistory', { restaurantId, limit });

      const snapshots = await this.prismaClient.dailySnapshot.findMany({
        where: {
          restaurantId,
          status: 'FINALIZED',
        },
        orderBy: { snapshotDate: 'desc' },
        take: limit,
      });

      return snapshots.map(snapshot => this.mapPrismaToDomain(snapshot));
    }, 'getHistory');
  }

  /**
   * Update snapshot data (only for DRAFT status)
   */
  async updateSnapshotData(snapshotId: string, data: any, userId: string): Promise<DailySnapshot> {
    this.validateId(snapshotId, 'Snapshot');

    return this.executeQuery(async () => {
      this.logOperation('updateSnapshotData', {
        snapshotId,
        userId,
        dataKeys: Object.keys(data)
      });

      const currentSnapshot = await this.prismaClient.dailySnapshot.findUnique({
        where: { id: snapshotId },
      });

      if (!currentSnapshot) {
        throw new Error(`Snapshot not found: ${snapshotId}`);
      }

      if (currentSnapshot.status === 'FINALIZED') {
        throw new Error(`Cannot update finalized snapshot: ${snapshotId}`);
      }

      const updatedSnapshot = await this.prismaClient.dailySnapshot.update({
        where: { id: snapshotId },
        data: {
          data,
          metadata: {
            ...(currentSnapshot.metadata as any),
            integrityHash: this.generateIntegrityHash(data),
          },
          version: currentSnapshot.version + 1,
          updatedAt: new Date(),
        },
      });

      return this.mapPrismaToDomain(updatedSnapshot);
    }, 'updateSnapshotData');
  }

  /**
   * Delete snapshot (only for DRAFT status)
   */
  async deleteSnapshot(snapshotId: string): Promise<void> {
    this.validateId(snapshotId, 'Snapshot');

    return this.executeQuery(async () => {
      this.logOperation('deleteSnapshot', { snapshotId });

      const snapshot = await this.prismaClient.dailySnapshot.findUnique({
        where: { id: snapshotId },
      });

      if (!snapshot) {
        throw new Error(`Snapshot not found: ${snapshotId}`);
      }

      if (snapshot.status === 'FINALIZED') {
        throw new Error(`Cannot delete finalized snapshot: ${snapshotId}`);
      }

      await this.prismaClient.dailySnapshot.delete({
        where: { id: snapshotId },
      });
    }, 'deleteSnapshot');
  }

  /**
   * Validate snapshot data integrity
   */
  async validateSnapshotIntegrity(snapshotId: string): Promise<boolean> {
    this.validateId(snapshotId, 'Snapshot');

    return this.executeQuery(async () => {
      this.logOperation('validateSnapshotIntegrity', { snapshotId });

      const snapshot = await this.prismaClient.dailySnapshot.findUnique({
        where: { id: snapshotId },
      });

      if (!snapshot) return false;
      if (!snapshot.sha256) return false; // No hash to validate

      const currentHash = this.generateSHA256(snapshot.data);
      return currentHash === snapshot.sha256;
    }, 'validateSnapshotIntegrity');
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  private mapPrismaToDomain(prismaSnapshot: any): DailySnapshot {
    return {
      id: prismaSnapshot.id,
      snapshotDate: prismaSnapshot.snapshotDate,
      status: prismaSnapshot.status,
      version: prismaSnapshot.version,
      sha256: prismaSnapshot.sha256,
      metadata: prismaSnapshot.metadata,
      data: prismaSnapshot.data,
      finalizedAt: prismaSnapshot.finalizedAt,
      restaurantId: prismaSnapshot.restaurantId,
      createdAt: prismaSnapshot.createdAt,
      updatedAt: prismaSnapshot.updatedAt,
    };
  }

  private generateIntegrityHash(data: any): string {
    // Simple hash for integrity checking (not cryptographic)
    const dataString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private generateSHA256(data: any): string {
    // Use static crypto import for security and performance
    const dataString = JSON.stringify(data);
    return createHash('sha256').update(dataString).digest('hex');
  }
}
