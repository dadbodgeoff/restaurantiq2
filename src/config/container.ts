import { createContainer, asClass, asValue } from 'awilix';
import { PrismaClient } from '@prisma/client';

// Infrastructure Services
import { DatabaseService } from '../infrastructure/database/database.service';
import { LoggerService } from '../infrastructure/logging/logger.service';
import { JwtService } from '../infrastructure/security/jwt/jwt.service';
import { PermissionService } from '../infrastructure/security/permission.service';
import { PasswordService } from '../infrastructure/security/password.service';

// Domain Services
import { RestaurantService } from '../domains/restaurant/services/restaurant.service';
import { AuthService } from '../domains/auth/services/auth.service';

// Repositories
import { RestaurantRepository } from '../domains/restaurant/repositories/restaurant.repository';
import { UserRepository } from '../domains/restaurant/repositories/user.repository';

// Configuration
import { getEnvConfig } from './env';
import { eventBus } from '../lib/events/domain-events';

// Auth Middleware
import * as authMiddleware from '../domains/auth/middleware/auth.middleware';

const container = createContainer();

// Configuration - Singleton
container.register({
  envConfig: asValue(getEnvConfig()),
  prisma: asValue(new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  })),
  eventBus: asValue(eventBus),
  authMiddleware: asValue(authMiddleware),
});

// Infrastructure Services - Singletons
container.register({
  databaseService: asClass(DatabaseService).singleton(),
  loggerService: asClass(LoggerService).singleton(),
  jwtService: asClass(JwtService).singleton(),
  passwordService: asClass(PasswordService).singleton(),
});

// Permission Service - Scoped (needs prisma dependency)
container.register({
  permissionService: asClass(PermissionService).scoped(),
});

// Core Domain Services - Scoped (one per request)
container.register({
  restaurantService: asClass(RestaurantService).scoped(),
  authService: asClass(AuthService).scoped(),
  // Note: AuthService dependencies will be resolved automatically by awilix
});

// Core Repositories - Scoped (one per request)
container.register({
  restaurantRepository: asClass(RestaurantRepository).scoped(),
  userRepository: asClass(UserRepository).scoped(),
});

// Register all module services and repositories
// moduleRegistry.registerInContainer(container);

export { container };
export type Container = typeof container;
