// src/domains/snapshot/services/snapshot-event-handlers.ts
// Event handlers for DailySnapshot domain events

import { DomainEvent, EventHandler, createDomainEvent } from '../../../lib/events/domain-events';
import { DailySnapshotService } from './daily-snapshot.service';
import { DailySnapshotRepository } from '../repositories/daily-snapshot.repository';
import { DomainEventTypes } from '../../../lib/events/domain-events';
import { SnapshotEventTypes } from '../../shared/types/snapshot';
import { BusinessRuleError } from '../../../lib/errors/specific-errors';

// Event handler for PREP day creation
export class PrepDayCreatedHandler implements EventHandler {
  eventType = DomainEventTypes.PREP_DAY_CREATED;

  constructor(
    private snapshotService: DailySnapshotService,
    private snapshotRepository: DailySnapshotRepository
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    console.log(`🔄 Handling PREP day creation event:`, {
      eventId: event.id,
      aggregateId: event.aggregateId,
      correlationId: event.metadata.correlationId
    });

    try {
      // Extract PREP data from event
      const prepData = event.data.prepData;
      const restaurantId = event.data.restaurantId;
      const snapshotDate = new Date(event.data.date);

      // Create snapshot from PREP data
      const userId = event.metadata.userId || 'system'; // Default to system if no user
      const snapshot = await this.snapshotService.createDailySnapshot(
        restaurantId,
        snapshotDate,
        prepData,
        userId,
        event.metadata.correlationId
      );

      console.log(`✅ Snapshot created from PREP event:`, {
        snapshotId: snapshot.id,
        restaurantId,
        date: snapshotDate.toISOString(),
        correlationId: event.metadata.correlationId
      });

    } catch (error) {
      console.error(`❌ Failed to create snapshot from PREP event:`, {
        eventId: event.id,
        error: error instanceof Error ? error.message : String(error),
        correlationId: event.metadata.correlationId
      });

      // Publish error event for monitoring
      // (In a full implementation, you might want to publish a snapshot creation failed event)
    }
  }
}

// Event handler for PREP day finalization
export class PrepDayFinalizedHandler implements EventHandler {
  eventType = DomainEventTypes.PREP_DAY_FINALIZED;

  constructor(
    private snapshotService: DailySnapshotService
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    console.log(`🔄 Handling PREP day finalization event:`, {
      eventId: event.id,
      aggregateId: event.aggregateId,
      correlationId: event.metadata.correlationId
    });

    try {
      // Get the snapshot for this PREP day
      const restaurantId = event.data.restaurantId;
      const snapshotDate = new Date(event.data.date);
      const finalPrepData = event.data.finalPrepData;

      // Get existing snapshot
      const snapshot = await this.snapshotService.getSnapshotForDate(
        restaurantId,
        snapshotDate,
        event.metadata.correlationId
      );

      if (!snapshot) {
        console.error(`❌ No snapshot found for finalized PREP day:`, {
          restaurantId,
          date: snapshotDate.toISOString(),
          eventId: event.id
        });
        return;
      }

      // Finalize the snapshot with final PREP data
      const userId = event.metadata.userId || 'system'; // Default to system if no user
      const finalizedSnapshot = await this.snapshotService.finalizeSnapshot(
        snapshot.id,
        userId,
        event.metadata.correlationId,
        finalPrepData
      );

      console.log(`✅ Snapshot finalized from PREP finalization:`, {
        snapshotId: finalizedSnapshot.id,
        restaurantId,
        date: snapshotDate.toISOString(),
        finalHash: finalizedSnapshot.sha256,
        correlationId: event.metadata.correlationId
      });

    } catch (error) {
      console.error(`❌ Failed to finalize snapshot from PREP event:`, {
        eventId: event.id,
        error: error instanceof Error ? error.message : String(error),
        correlationId: event.metadata.correlationId
      });
    }
  }
}

// Factory function to create event handlers with dependencies
export function createSnapshotEventHandlers(
  snapshotService: DailySnapshotService,
  snapshotRepository: DailySnapshotRepository
): EventHandler[] {
  return [
    new PrepDayCreatedHandler(snapshotService, snapshotRepository),
    new PrepDayFinalizedHandler(snapshotService)
  ];
}

// Helper function to register snapshot event handlers
export function registerSnapshotEventHandlers(
  eventBus: any,
  snapshotService: DailySnapshotService,
  snapshotRepository: DailySnapshotRepository
): void {
  const handlers = createSnapshotEventHandlers(snapshotService, snapshotRepository);

  handlers.forEach(handler => {
    eventBus.subscribe(handler.eventType, handler);
    console.log(`📝 Registered snapshot event handler: ${handler.eventType}`);
  });

  console.log(`✅ Registered ${handlers.length} snapshot event handlers`);
}
