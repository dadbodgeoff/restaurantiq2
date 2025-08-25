import { createContainer, asClass, asValue } from 'awilix';

// Import infrastructure first (these exist)
import { LoggerService } from '../infrastructure/logging/logger.service';
import { StorageService } from '../infrastructure/storage/storage.service';
import { ApiService } from '../domains/shared/services/api.service';

const container = createContainer();

// Infrastructure Services - Singletons (following your pattern)
container.register({
  loggerService: asClass(LoggerService).singleton(),
  storageService: asClass(StorageService).singleton(),
  apiService: asClass(ApiService).singleton(),
});

// Configuration - Values
container.register({
  apiBaseUrl: asValue(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'),
  jwtSecret: asValue(process.env.JWT_SECRET || 'your-jwt-secret'),
});

// Domain services will be registered as needed
// This prevents circular dependencies during build

export { container };
export type Container = typeof container;
