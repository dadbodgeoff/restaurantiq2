import 'reflect-metadata';
import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Configuration
import { getEnvConfig } from './config/env';
import { container } from './config/container';

// Infrastructure
import { DatabaseService } from './infrastructure/database/database.service';
import { LoggerService } from './infrastructure/logging/logger.service';

// Middleware
import { errorHandler } from './infrastructure/web/middleware/error-handler';
import { requestLogger } from './infrastructure/web/middleware/request-logger';

// Routes & Modules
import { setupRoutes } from './infrastructure/web/routes';
import { moduleRegistry } from './config/module-registry';

// Extend Express Request interface globally
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      container: {
        resolve: (service: string) => unknown;
      };
      user?: {
        id: string;
        restaurantId: string;
        role: string;
        permissions: string[];
        email?: string;
        firstName?: string;
        lastName?: string;
      };
    }
  }
}

async function bootstrap() {
  try {
    const config = getEnvConfig();
    const logger = container.resolve<LoggerService>('loggerService');
    const database = container.resolve<DatabaseService>('databaseService');

    // Connect to database
    await database.connect();
    logger.info('Database', 'Connected to database successfully');

    // Initialize all modules
    await moduleRegistry.initializeModules(container as any);
    logger.info('Modules', `Initialized ${moduleRegistry.getAllModules().length} modules`);

    // Create Express app
    const app = express();

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    app.use(cors({
      origin: config.CORS_ORIGINS.split(','),
      credentials: true,
    }));

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request correlation ID and container scope
    app.use((req, res, next) => {
      req.correlationId = req.headers['x-correlation-id'] as string || uuidv4();
      req.container = container.createScope();  // Create proper request scope
      next();
    });

    // Request logging
    app.use(requestLogger());

    // Core API routes (includes health check at /api/v1/health)
    app.use(`/api/${config.API_VERSION}`, setupRoutes());

    // Module routes (now enabled!)
    const moduleRoutes = moduleRegistry.getAllRoutes(container as any);
    moduleRoutes.forEach(router => {
      app.use(`/api/${config.API_VERSION}`, router);
    });

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found',
          correlationId: req.correlationId,
        },
      });
    });

    // Error handling (must be last)
    app.use(errorHandler);

    // Start server
    app.listen(config.PORT, () => {
      logger.info('Server', `Server started on port ${config.PORT}`);
      logger.info('Server', `API available at /api/${config.API_VERSION}`);
      logger.info('Server', `Environment: ${config.NODE_ENV}`);
    });

  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Log to monitoring system instead of crashing
  // Allow graceful shutdown
  setTimeout(() => {
    console.error('Force exiting due to uncaught exception');
    process.exit(1);
  }, 5000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Log error but don't crash the server
  // This allows the application to continue running
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  const database = container.resolve<DatabaseService>('databaseService');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  const database = container.resolve<DatabaseService>('databaseService');
  await database.disconnect();
  process.exit(0);
});

bootstrap();
