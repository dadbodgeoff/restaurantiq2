import { Router } from 'express';
import { RestaurantModule } from '../../config/module-registry';
import { DomainEventBus } from '../../lib/events/domain-events';

// Base class for all restaurant modules
export abstract class BaseRestaurantModule implements Omit<RestaurantModule, 'services' | 'repositories' | 'middleware' | 'config'> {
  abstract name: string;
  abstract version: string;
  abstract description: string;

  // Services provided by this module
  protected moduleServices: Record<string, new (...args: never[]) => unknown> = {};

  // Repositories provided by this module
  protected moduleRepositories: Record<string, new (...args: never[]) => unknown> = {};

  // Routes for this module
  protected router: Router | null = null;

  // Middleware for this module
  protected moduleMiddleware: unknown[] = [];

  // Module-specific configuration
  protected moduleConfig: Record<string, unknown> = {};

  // Event bus for cross-module communication
  protected eventBus?: DomainEventBus;

  constructor(protected container: any) {
    this.eventBus = container?.resolve('eventBus');
  }

  // Get services provided by this module
  get services(): Record<string, new (...args: never[]) => unknown> | undefined {
    return Object.keys(this.moduleServices).length > 0 ? this.moduleServices : undefined;
  }

  // Get repositories provided by this module
  get repositories(): Record<string, new (...args: never[]) => unknown> | undefined {
    return Object.keys(this.moduleRepositories).length > 0 ? this.moduleRepositories : undefined;
  }

  // Get routes for this module
  get routes(): ((container: any) => Router) | undefined {
    return this.createRoutes.bind(this);
  }

  // Get middleware for this module
  get middleware(): unknown[] | undefined {
    return this.moduleMiddleware.length > 0 ? this.moduleMiddleware : undefined;
  }

  // Get module configuration
  get config(): Record<string, unknown> | undefined {
    return Object.keys(this.moduleConfig).length > 0 ? this.moduleConfig : undefined;
  }

  // Initialize the module
  async initialize(container: any): Promise<void> {
    this.container = container;
    this.eventBus = container.resolve('eventBus');

    // Register event handlers
    this.registerEventHandlers();

    // Perform any module-specific initialization
    await this.onInitialize();
  }

  // Cleanup the module
  async cleanup(): Promise<void> {
    await this.onCleanup();
  }

  // Template method for module-specific initialization
  protected async onInitialize(): Promise<void> {
    // Override in subclasses
  }

  // Template method for module-specific cleanup
  protected async onCleanup(): Promise<void> {
    // Override in subclasses
  }

  // Template method for creating routes
  protected createRoutes(container: any): Router {
    // Override in subclasses to define module routes
    const router = Router();
    return router;
  }

  // Template method for registering event handlers
  protected registerEventHandlers(): void {
    // Override in subclasses to register event handlers
  }

  // Helper method to publish domain events
  protected async publishEvent(event: any): Promise<void> {
    if (this.eventBus) {
      await this.eventBus.publish(event);
    }
  }

  // Helper method to subscribe to domain events
  protected subscribeToEvent(
    eventType: string,
    handler: (event: any) => Promise<void>
  ): void {
    if (this.eventBus) {
      this.eventBus.subscribe(eventType, {
        eventType,
        handle: handler,
      });
    }
  }

  // Helper method to get a service from the container
  protected getService<T>(serviceName: string): T {
    return this.container.resolve(serviceName);
  }

  // Helper method to get a repository from the container
  protected getRepository<T>(repositoryName: string): T {
    return this.container.resolve(repositoryName);
  }
}
