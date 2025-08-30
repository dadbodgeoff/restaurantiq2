import { Router } from 'express';
import { authenticate, authorizeRestaurantAccess } from '../../../domains/auth/middleware/auth.middleware';

// Import actual route implementations
import authRoutes from './auth';
import userRoutes from './users';
import restaurantRoutes from './restaurants';
import prepRoutes from './prep';
import snapshotRoutes from './snapshots';
import menuRoutes from './menu';
import pricingRoutes from './pricing';
import invoiceImportRoutes from './invoice-import';

// Import route modules (to be created in future phases)
export function setupRoutes(): Router {
  const router = Router();

  // Health check (public)
  router.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'RestaurantIQ API is running with Hierarchical Permission System',
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
      features: {
        authentication: true,
        userManagement: true,
        roleHierarchy: true,
        permissions: true,
        dailySnapshots: true,
        sourceOfTruth: true
      }
    });
  });

  // Database status check (public)
  router.get('/database/status', async (req, res) => {
    try {
      const databaseService = req.container.resolve('databaseService') as any;

      if (!databaseService) {
        throw new Error('Database service not available');
      }

      const status = await databaseService.getHealthStatus();

      res.json({
        success: true,
        data: {
          status: status.isHealthy ? 'healthy' : 'unhealthy',
          connection: status.connection,
          database: status.database,
          tables: status.tables,
          timestamp: new Date().toISOString()
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database connection failed',
          details: error instanceof Error ? error.message : String(error),
          correlationId: req.correlationId
        }
      });
    }
  });

  // Authentication routes (public)
  router.use('/auth', authRoutes);

  // Restaurant routes (some public, some protected)
  router.use('/restaurants', restaurantRoutes);
  // Prep routes for restaurants
  router.use('/restaurants/:restaurantId/prep', prepRoutes);

  // Protected routes
  const protectedRouter = Router();
  protectedRouter.use(authenticate());

  // User management routes
  protectedRouter.use('/', userRoutes);

  // Daily Snapshot routes (Source of Truth)
  protectedRouter.use('/snapshots', snapshotRoutes);

  // Price Intelligence routes (4 trackers)
  protectedRouter.use('/pricing', pricingRoutes);

  // Invoice Import routes (CSV, PDF, TXT)
  protectedRouter.use('/invoice-import', invoiceImportRoutes);

  // Revenue Ready management (placeholder - will be implemented in future phases)
  protectedRouter.get('/restaurants/:restaurantId/revenue',
    authorizeRestaurantAccess(),
    (req, res) => {
      res.json({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Revenue Ready management endpoints will be implemented in future phases',
          correlationId: req.correlationId,
          availableFeatures: ['authentication', 'userManagement', 'roleHierarchy', 'menuManagement', 'prepManagement', 'dailySnapshots']
        },
      });
    }
  );

  router.use(protectedRouter);

  return router;
}
