import { createContainer, asClass, asValue } from 'awilix';
import { PrismaClient } from '@prisma/client';

// Infrastructure Services
import { DatabaseService } from '../infrastructure/database/database.service';
import { LoggerService } from '../infrastructure/logging/logger.service';
import { JwtService } from '../infrastructure/security/jwt/jwt.service';
import { PasswordService } from '../infrastructure/security/password.service';

// Domain Services (now manually instantiated)
// import { RestaurantService } from '../domains/restaurant/services/restaurant.service';
// import { AuthService } from '../domains/auth/services/auth.service';

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

// Core Repositories - Scoped (1-3 dependencies - SAFE for auto-resolution)
container.register({
  restaurantRepository: asClass(RestaurantRepository).scoped(),
  // userRepository: Created manually in scoped container (see index.ts)
  // Following .cursorrules pattern for complex dependencies
});

// Complex Services - Manual instantiation only (4+ dependencies)
// permissionService: REMOVED - manual instantiation in index.ts
// authService: REMOVED - manual instantiation in index.ts
// restaurantService: REMOVED - manual instantiation in index.ts

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

// UserRepository test removed - now created manually in scoped container
// (following .cursorrules pattern for complex dependencies)
console.log('ℹ️  UserRepository: Created manually in scoped container (see index.ts)');

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

// AuthService test skipped - created manually in scoped container (see index.ts)
console.log('✅ AuthService created manually in scoped container');

export { container };
export type Container = typeof container;
