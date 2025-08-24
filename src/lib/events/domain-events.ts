import { v4 as uuidv4 } from 'uuid';

// Base domain event interface
export interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  data: Record<string, any>;
  metadata: {
    timestamp: Date;
    correlationId: string;
    causationId?: string;
    userId?: string;
    restaurantId?: string;
    version: number;
  };
  occurredAt: Date;
}

// Event handler interface
export interface EventHandler<T extends DomainEvent = DomainEvent> {
  eventType: string;
  handle(event: T): Promise<void>;
}

// Domain event bus
export class DomainEventBus {
  private handlers = new Map<string, EventHandler[]>();
  private events: DomainEvent[] = [];

  // Register an event handler
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler as EventHandler);
  }

  // Unregister an event handler
  unsubscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Publish an event
  async publish(event: DomainEvent): Promise<void> {
    // Store event for persistence if needed
    this.events.push(event);

    // Notify all handlers
    const handlers = this.handlers.get(event.type) || [];
    const promises = handlers.map(handler => handler.handle(event));

    await Promise.all(promises);
  }

  // Publish multiple events
  async publishAll(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map(event => this.publish(event)));
  }

  // Get all published events
  getPublishedEvents(): DomainEvent[] {
    return [...this.events];
  }

  // Clear published events (useful for testing)
  clearEvents(): void {
    this.events = [];
  }
}

// Global event bus instance
export const eventBus = new DomainEventBus();

// Helper function to create domain events
export function createDomainEvent(
  type: string,
  aggregateId: string,
  aggregateType: string,
  data: Record<string, any>,
  metadata: Partial<DomainEvent['metadata']> = {}
): DomainEvent {
  return {
    id: uuidv4(),
    type,
    aggregateId,
    aggregateType,
    data,
    metadata: {
      timestamp: new Date(),
      correlationId: metadata.correlationId || uuidv4(),
      causationId: metadata.causationId,
      userId: metadata.userId,
      restaurantId: metadata.restaurantId,
      version: metadata.version || 1,
    },
    occurredAt: new Date(),
  };
}

// Common domain events
export const DomainEventTypes = {
  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',

  // Restaurant events
  RESTAURANT_CREATED: 'restaurant.created',
  RESTAURANT_UPDATED: 'restaurant.updated',
  RESTAURANT_DELETED: 'restaurant.deleted',

  // Menu events
  MENU_ITEM_CREATED: 'menu.item.created',
  MENU_ITEM_UPDATED: 'menu.item.updated',
  MENU_ITEM_DELETED: 'menu.item.deleted',

  // PREP events
  PREP_DAY_CREATED: 'prep.day.created',
  PREP_DAY_FINALIZED: 'prep.day.finalized',
  PREP_ITEM_UPDATED: 'prep.item.updated',

  // Revenue events
  REVENUE_SNAPSHOT_CREATED: 'revenue.snapshot.created',
  REVENUE_DRAFT_UPDATED: 'revenue.draft.updated',
} as const;
