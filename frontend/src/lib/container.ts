import { createContainer, asClass, asValue } from 'awilix';

// Import infrastructure first (these exist)
import { LoggerService } from '../infrastructure/logging/logger.service';
import { StorageService } from '../infrastructure/storage/storage.service';

const container = createContainer();

// Infrastructure Services - Singletons (following your pattern)
container.register({
  loggerService: asClass(LoggerService).singleton(),
  storageService: asClass(StorageService).singleton(),
});

// Configuration - Values (keep minimal; ApiService now constructed per caller)
container.register({
  jwtSecret: asValue(process.env.JWT_SECRET || 'your-jwt-secret'),
});

// Domain services will be registered as needed
// This prevents circular dependencies during build

export { container };
export type Container = typeof container;
