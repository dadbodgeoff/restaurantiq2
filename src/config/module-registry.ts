import { Router } from 'express';
import { asClass, AwilixContainer } from 'awilix';

// Container type for DI container - compatible with Awilix
export interface Container {
  register: (name: string | symbol, registration: unknown) => void;
  resolve: <T>(name: string) => T;
  createScope?: () => Container;
}

// Module Interface - Every module must implement this
export interface RestaurantModule {
  name: string;
  version: string;
  description: string;

  // Services to register in DI container
  services?: Record<string, new (...args: never[]) => unknown>;

  // Repositories to register
  repositories?: Record<string, new (...args: never[]) => unknown>;

  // Routes to mount
  routes?: (container: Container) => Router;

  // Middleware to apply globally
  middleware?: unknown[];

  // Database migrations (optional)
  migrations?: string[];

  // Module-specific configuration
  config?: Record<string, unknown>;

  // Initialize the module
  initialize?: (container: Container) => Promise<void>;

  // Cleanup when shutting down
  cleanup?: () => Promise<void>;
}

// Module Registry - Manages all modules
export class ModuleRegistry {
  private modules = new Map<string, RestaurantModule>();
  private initialized = false;

  // Register a new module
  register(module: RestaurantModule): this {
    if (this.modules.has(module.name)) {
      throw new Error(`Module ${module.name} is already registered`);
    }

    this.modules.set(module.name, module);
    return this;
  }

  // Get a registered module
  getModule(name: string): RestaurantModule | undefined {
    return this.modules.get(name);
  }

  // Get all registered modules
  getAllModules(): RestaurantModule[] {
    return Array.from(this.modules.values());
  }

  // Check if a module exists
  hasModule(name: string): boolean {
    return this.modules.has(name);
  }

  // Initialize all modules
  async initializeModules(container: Container): Promise<void> {
    if (this.initialized) return;

    for (const module of this.modules.values()) {
      if (module.initialize) {
        await module.initialize(container);
      }
    }

    this.initialized = true;
  }

  // Cleanup all modules
  async cleanupModules(): Promise<void> {
    for (const module of this.modules.values()) {
      if (module.cleanup) {
        await module.cleanup();
      }
    }
  }

  // Get all routes from modules
  getAllRoutes(container: Container): Router[] {
    const routes: Router[] = [];

    for (const module of this.modules.values()) {
      if (module.routes) {
        routes.push(module.routes(container));
      }
    }

    return routes;
  }

  // Get all middleware from modules
  getAllMiddleware(): unknown[] {
    const middleware: unknown[] = [];

    for (const module of this.modules.values()) {
      if (module.middleware) {
        middleware.push(...module.middleware);
      }
    }

    return middleware;
  }

  // Register all services and repositories in container
  registerInContainer(container: Container): void {
    for (const module of this.modules.values()) {
      // Register services
      if (module.services) {
        Object.entries(module.services).forEach(([key, ServiceClass]) => {
          container.register(key, asClass(ServiceClass).scoped());
        });
      }

      // Register repositories
      if (module.repositories) {
        Object.entries(module.repositories).forEach(([key, RepositoryClass]) => {
          container.register(key, asClass(RepositoryClass).scoped());
        });
      }
    }
  }
}

// Global module registry instance
export const moduleRegistry = new ModuleRegistry();
