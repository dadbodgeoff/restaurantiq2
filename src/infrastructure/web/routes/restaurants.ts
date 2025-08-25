import { Router } from 'express';
import { authenticate, authorizeRestaurantAccess } from '../../../domains/auth/middleware/auth.middleware';
import { UserRole } from '../../../domains/shared/types/permissions';
import { BusinessRuleError } from '../../../lib/errors/specific-errors';
import { RestaurantSettings } from '../../../domains/shared/types/restaurant';

const router = Router();

// ==========================================
// RESTAURANT MANAGEMENT ENDPOINTS
// ==========================================

// GET /api/v1/restaurants
// Get all restaurants (public endpoint for listing)
router.get('/', async (req, res) => {
  try {

    // ✅ Use proper service layer instead of mock data
    const restaurantService = req.container.resolve('restaurantService') as any;
    const restaurants = await restaurantService.getAllRestaurants();

    res.json({
      success: true,
      data: {
        restaurants: restaurants.map((r: any) => ({
          id: r.id,
          name: r.name,
          timezone: r.timezone,
          locale: r.locale,
          currency: r.currency,
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        })),
        count: restaurants.length
      },
      correlationId: req.correlationId
    });
  } catch (error) {
    console.error('❌ Error in restaurants list endpoint:', error);
    throw error;
  }
});

// POST /api/v1/restaurants/setup
// Create initial restaurant (public endpoint for first-time setup)
router.post('/setup', async (req, res) => {
  try {
    const {
      name,
      timezone = 'America/New_York',
      locale = 'en-US',
      currency = 'USD',
      settings
    } = req.body;

    if (!name || name.trim().length === 0) {
      throw new BusinessRuleError(
        'Restaurant name is required',
        req.correlationId
      );
    }

    // Create default settings if not provided
    const defaultSettings: RestaurantSettings = {
      prepFinalizationTime: '23:30',
      gracePeriodHours: 1,
      snapshotRetentionDays: 90,
      enableAutoSync: true,
      workingHours: {
        start: '06:00',
        end: '23:00'
      }
    };

    const finalSettings = { ...defaultSettings, ...settings };

    const restaurantService = req.container.resolve('restaurantService') as any;
    const restaurant = await restaurantService.createRestaurant({
      name: name.trim(),
      timezone,
      locale,
      currency,
      settings: finalSettings
    });

    res.status(201).json({
      success: true,
      data: {
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          timezone: restaurant.timezone,
          locale: restaurant.locale,
          currency: restaurant.currency,
          isActive: restaurant.isActive,
          createdAt: restaurant.createdAt
        },
        message: 'Restaurant created successfully. Use the restaurantId for user registration.',
        nextStep: 'Register your first user with role: OWNER'
      },
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/restaurants/:restaurantId
// Get restaurant details
router.get('/:restaurantId',
  authenticate(),
  authorizeRestaurantAccess(),
  async (req, res) => {
    try {
      const { restaurantId } = req.params;

      const restaurantService = req.container.resolve('restaurantService') as any;
      const restaurant = await restaurantService.getRestaurantById(restaurantId);

      res.json({
        success: true,
        data: {
          id: restaurant.id,
          name: restaurant.name,
          timezone: restaurant.timezone,
          locale: restaurant.locale,
          currency: restaurant.currency,
          isActive: restaurant.isActive,
          settings: restaurant.settings,
          createdAt: restaurant.createdAt,
          updatedAt: restaurant.updatedAt
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      throw error;
    }
  }
);

// PUT /api/v1/restaurants/:restaurantId
// Update restaurant details
router.put('/:restaurantId',
  authenticate(),
  authorizeRestaurantAccess(),
  async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const updates = req.body;

      // Only restaurant owners can update restaurant settings
      if (req.user!.role !== UserRole.OWNER) {
        throw new BusinessRuleError(
          'Only restaurant owners can update restaurant settings',
          req.correlationId
        );
      }

      const restaurantService = req.container.resolve('restaurantService') as any;
      const updatedRestaurant = await restaurantService.updateRestaurant(restaurantId, updates);

      res.json({
        success: true,
        data: {
          id: updatedRestaurant.id,
          name: updatedRestaurant.name,
          timezone: updatedRestaurant.timezone,
          locale: updatedRestaurant.locale,
          currency: updatedRestaurant.currency,
          isActive: updatedRestaurant.isActive,
          settings: updatedRestaurant.settings,
          updatedAt: updatedRestaurant.updatedAt
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      throw error;
    }
  }
);

// GET /api/v1/restaurants/:restaurantId/users
// Get all users in a restaurant
router.get('/:restaurantId/users',
  authenticate(),
  authorizeRestaurantAccess(),
  async (req, res) => {
    try {
      const { restaurantId } = req.params;

      const restaurantService = req.container.resolve('restaurantService') as any;
      const users = await restaurantService.getRestaurantUsers(restaurantId);

      res.json({
        success: true,
        data: {
          users: users.map((user: any) => ({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt
          })),
          count: users.length
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      throw error;
    }
  }
);

// POST /api/v1/restaurants/setup-complete
// Complete restaurant setup: create restaurant + owner user in one transaction
router.post('/setup-complete', async (req, res) => {
  try {
    const {
      restaurant: restaurantData,
      user: userData
    } = req.body;

    if (!restaurantData || !userData) {
      throw new BusinessRuleError(
        'Both restaurant and user data are required',
        req.correlationId
      );
    }

    const { name: restaurantName, timezone, locale, currency, settings } = restaurantData;
    const { email, password, firstName, lastName } = userData;

    if (!restaurantName || !email || !password || !firstName || !lastName) {
      throw new BusinessRuleError(
        'Required fields: restaurant.name, user.email, user.password, user.firstName, user.lastName',
        req.correlationId
      );
    }

    // Create default settings if not provided
    const defaultSettings: RestaurantSettings = {
      prepFinalizationTime: '23:30',
      gracePeriodHours: 1,
      snapshotRetentionDays: 90,
      enableAutoSync: true,
      workingHours: {
        start: '06:00',
        end: '23:00'
      }
    };

    const finalSettings = { ...defaultSettings, ...settings };

    // Use database transaction to ensure both operations succeed or fail together
    const prisma = req.container.resolve('prisma') as any;
    const result = await prisma.$transaction(async (tx: any) => {
      // Create restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          name: restaurantName.trim(),
          timezone: timezone || 'America/New_York',
          locale: locale || 'en-US',
          currency: currency || 'USD',
          settings: finalSettings
        }
      });

      // Create owner user
      const passwordService = req.container.resolve('passwordService') as any;
      const hashedPassword = await passwordService.hashPassword(password);

      const owner = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          password: hashedPassword,
          role: UserRole.OWNER,
          restaurantId: restaurant.id,
          isActive: true,
          failedLoginAttempts: 0
        }
      });

      return { restaurant, owner };
    });

    res.status(201).json({
      success: true,
      data: {
        restaurant: {
          id: result.restaurant.id,
          name: result.restaurant.name,
          timezone: result.restaurant.timezone,
          locale: result.restaurant.locale,
          currency: result.restaurant.currency,
          createdAt: result.restaurant.createdAt
        },
        user: {
          id: result.owner.id,
          email: result.owner.email,
          firstName: result.owner.firstName,
          lastName: result.owner.lastName,
          role: result.owner.role,
          createdAt: result.owner.createdAt
        },
        message: 'Restaurant and owner account created successfully!',
        nextStep: 'Use /api/v1/auth/login to authenticate and start using the system'
      },
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/restaurants/:restaurantId/setup-owner
// Create the first owner user for a restaurant
router.post('/:restaurantId/setup-owner', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const {
      email,
      password,
      firstName,
      lastName
    } = req.body;

    if (!email || !password || !firstName || !lastName) {
      throw new BusinessRuleError(
        'All fields are required: email, password, firstName, lastName',
        req.correlationId
      );
    }

    // Verify restaurant exists
    const restaurantService = req.container.resolve('restaurantService') as any;
    const restaurant = await restaurantService.getRestaurantById(restaurantId);

    // Check if owner already exists
    const existingUsers = await restaurantService.getRestaurantUsers(restaurantId);
    const existingOwner = existingUsers.find((user: any) => user.role === UserRole.OWNER);

    if (existingOwner) {
      throw new BusinessRuleError(
        'Restaurant already has an owner. Use regular registration instead.',
        req.correlationId
      );
    }

    // Create the owner user
    const authService = req.container.resolve('authService') as any;
    const owner = await authService.register({
      email,
      password,
      firstName,
      lastName,
      role: UserRole.OWNER,
      restaurantId,
      correlationId: req.correlationId
    });

    // Assign owner role with full permissions
    const permissionService = req.container.resolve('permissionService') as any;
    await permissionService.assignRole(owner.id, owner.id, UserRole.OWNER);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: owner.id,
          email: owner.email,
          firstName: owner.firstName,
          lastName: owner.lastName,
          role: owner.role,
          createdAt: owner.createdAt
        },
        restaurant: {
          id: restaurant.id,
          name: restaurant.name
        },
        message: 'Owner account created successfully. You can now log in.',
        nextStep: 'Use /api/v1/auth/login to authenticate'
      },
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
});

export default router;
