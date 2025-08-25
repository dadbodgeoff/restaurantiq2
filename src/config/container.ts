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
import { moduleRegistry } from './module-registry';
import { registerAllModules } from './module-registration';

// Auth Middleware
import * as authMiddleware from '../domains/auth/middleware/auth.middleware';

const container = createContainer();

// Configuration - Singleton
const prismaClient = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Connect to database
prismaClient.$connect().then(() => {
  console.log('✅ Prisma client connected to database');
}).catch((error) => {
  console.error('❌ Failed to connect Prisma client:', error);
});

container.register({
  envConfig: asValue(getEnvConfig()),
  prisma: asValue(prismaClient),
  eventBus: asValue(eventBus),
  authMiddleware: asValue(authMiddleware),
});

// Infrastructure Services - Singletons (Initialize first)
container.register({
  databaseService: asClass(DatabaseService).singleton(),
  loggerService: asClass(LoggerService).singleton(),
  jwtService: asClass(JwtService).singleton(),
  passwordService: asClass(PasswordService).singleton(),
});

// Core Repositories - Scoped (one per request, needed by AuthService)
container.register({
  restaurantRepository: asClass(RestaurantRepository).scoped(),
  userRepository: asClass(UserRepository).scoped(),
});

// Permission Service - Scoped (depends on repositories)
container.register({
  permissionService: asClass(PermissionService).scoped().inject(() => ({
    prisma: container.resolve('prisma'),
    loggerService: container.resolve('loggerService')
  })),
});

// Core Domain Services - Scoped (one per request, depend on repositories)
container.register({
  restaurantService: asClass(RestaurantService).scoped(),
});

// AuthService - Scoped (one per request)
container.register({
  authService: asClass(AuthService).scoped(),
});

// Register all module services and repositories
registerAllModules(container);

// DEBUG: Test container registrations
console.log('🔧 Testing container registrations...');

try {
  console.log('🔍 Attempting to resolve LoggerService...');
  const loggerTest = container.resolve('loggerService');
  console.log('✅ LoggerService resolved:', !!loggerTest);
  if (loggerTest) {
    console.log('✅ LoggerService type:', typeof loggerTest);
    console.log('✅ LoggerService constructor:', loggerTest.constructor.name);
  }
} catch (error) {
  console.error('❌ LoggerService failed:', error instanceof Error ? error.message : String(error));
  console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
}

try {
  const prismaTest = container.resolve('prisma');
  console.log('✅ Prisma resolved:', !!prismaTest);
  if (prismaTest) {
    console.log('✅ Prisma type:', typeof prismaTest);
    console.log('✅ Prisma constructor:', prismaTest.constructor.name);
    console.log('✅ Prisma.user type:', typeof prismaTest.user);
    console.log('✅ Prisma.user constructor:', prismaTest.user?.constructor?.name);
  }
} catch (error) {
  console.error('❌ Prisma failed:', error instanceof Error ? error.message : String(error));
}

try {
  const userRepoTest = container.resolve('userRepository');
  console.log('✅ UserRepository resolved:', !!userRepoTest);
  if (userRepoTest) {
    console.log('✅ UserRepository type:', typeof userRepoTest);
    console.log('✅ UserRepository constructor:', userRepoTest.constructor.name);
    console.log('✅ UserRepository.prisma type:', typeof userRepoTest.prisma);
    console.log('✅ UserRepository.prisma constructor:', userRepoTest.prisma?.constructor?.name);
  }
} catch (error) {
  console.error('❌ UserRepository failed:', error instanceof Error ? error.message : String(error));
}

try {
  const jwtTest = container.resolve('jwtService');
  console.log('✅ JwtService resolved:', !!jwtTest);
} catch (error) {
  console.error('❌ JwtService failed:', error instanceof Error ? error.message : String(error));
}

try {
  const permissionTest = container.resolve('permissionService');
  console.log('✅ PermissionService resolved:', !!permissionTest);
} catch (error) {
  console.error('❌ PermissionService failed:', error instanceof Error ? error.message : String(error));
}

try {
  const passwordTest = container.resolve('passwordService');
  console.log('✅ PasswordService resolved:', !!passwordTest);
} catch (error) {
  console.error('❌ PasswordService failed:', error instanceof Error ? error.message : String(error));
}

try {
  const dbTest = container.resolve('databaseService');
  console.log('✅ DatabaseService resolved:', !!dbTest);
} catch (error) {
  console.error('❌ DatabaseService failed:', error instanceof Error ? error.message : String(error));
}

try {
  const authTest = container.resolve('authService');
  console.log('✅ AuthService resolved:', !!authTest);
} catch (error) {
  console.error('❌ AuthService failed:', error instanceof Error ? error.message : String(error));
}

export { container };
export type Container = typeof container;
