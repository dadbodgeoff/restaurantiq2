import { Router } from 'express';
import { authenticate, authorizeRestaurantAccess } from '../../../domains/auth/middleware/auth.middleware';

// Import actual route implementations
import authRoutes from './auth';
import userRoutes from './users';

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
        permissions: true
      }
    });
  });

  // Authentication routes (public)
  router.use('/auth', authRoutes);

  // Protected routes
  const protectedRouter = Router();
  protectedRouter.use(authenticate());

  // User management routes
  protectedRouter.use('/', userRoutes);

  // Menu management (placeholder - will be implemented in future phases)
  protectedRouter.get('/restaurants/:restaurantId/menu',
    authorizeRestaurantAccess(),
    (req, res) => {
      res.json({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Menu management endpoints will be implemented in future phases',
          correlationId: req.correlationId,
          availableFeatures: ['authentication', 'userManagement', 'roleHierarchy']
        },
      });
    }
  );

  // PREP management (placeholder - will be implemented in future phases)
  protectedRouter.get('/restaurants/:restaurantId/prep',
    authorizeRestaurantAccess(),
    (req, res) => {
      res.json({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'PREP management endpoints will be implemented in future phases',
          correlationId: req.correlationId,
          availableFeatures: ['authentication', 'userManagement', 'roleHierarchy']
        },
      });
    }
  );

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
          availableFeatures: ['authentication', 'userManagement', 'roleHierarchy']
        },
      });
    }
  );

  router.use(protectedRouter);

  return router;
}
