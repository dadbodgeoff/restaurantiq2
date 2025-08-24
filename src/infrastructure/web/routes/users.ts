import { Router } from 'express';
import { authenticate, authorizeRestaurantAccess, requirePermission, canAssignRole } from '../../../domains/auth/middleware/auth.middleware';
import { UserRole, Permissions } from '../../../domains/shared/types/permissions';
import { BusinessRuleError, UserNotFoundError } from '../../../lib/errors/specific-errors';

const router = Router();

// ==========================================
// USER MANAGEMENT ENDPOINTS
// ==========================================

// GET /api/v1/restaurants/:restaurantId/users
// List all users in a restaurant
router.get('/restaurants/:restaurantId/users',
  authenticate(),
  authorizeRestaurantAccess(),
  requirePermission(Permissions.USERS_READ),
  async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const {
        page = '1',
        limit = '20',
        role,
        isActive,
        search
      } = req.query;

      const userRepository = req.container.resolve('userRepository');
      const permissionService = req.container.resolve('permissionService');

      // Build filter
      const filter: any = { restaurantId };
      if (role) filter.role = role;
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      if (search) {
        filter.OR = [
          { email: { contains: search as string, mode: 'insensitive' } },
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      // Get paginated results
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const [users, total] = await Promise.all([
        userRepository.findMany(filter, { skip, take: limitNum }),
        userRepository.count(filter)
      ]);

      // Get permissions for each user
      const usersWithPermissions = await Promise.all(
        users.map(async (user: any) => {
          const userPermissions = await permissionService.getUserPermissions(user.id);
          return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            permissions: userPermissions.allPermissions,
            assignedById: user.assignedById
          };
        })
      );

      res.json({
        success: true,
        data: {
          users: usersWithPermissions,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
          }
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      throw error;
    }
  }
);

// POST /api/v1/restaurants/:restaurantId/users
// Create a new user
router.post('/restaurants/:restaurantId/users',
  authenticate(),
  authorizeRestaurantAccess(),
  requirePermission(Permissions.USERS_CREATE),
  canAssignRole(UserRole.STAFF), // Default check, will be validated with specific role
  async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const {
        email,
        firstName,
        lastName,
        role = UserRole.STAFF,
        password,
        isActive = true
      } = req.body;

      if (!email || !firstName || !lastName || !password) {
        throw new BusinessRuleError(
          'Email, first name, last name, and password are required',
          req.correlationId
        );
      }

      // Check if user can assign the requested role
      const permissionService = req.container.resolve('permissionService');
      const canAssign = await permissionService.canAssignRole(req.user!.id, role as UserRole);

      if (!canAssign) {
        throw new BusinessRuleError(
          `Cannot assign role ${role}. Insufficient permissions.`,
          req.correlationId
        );
      }

      // Create the user
      const authService = req.container.resolve('authService');
      const newUser = await authService.register({
        email,
        firstName,
        lastName,
        password,
        role: role as UserRole,
        restaurantId,
        correlationId: req.correlationId
      });

      // Assign the user role with tracking
      await permissionService.assignRole(req.user!.id, newUser.id, role as UserRole);

      res.status(201).json({
        success: true,
        data: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          isActive: newUser.isActive,
          createdAt: newUser.createdAt
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      throw error;
    }
  }
);

// GET /api/v1/restaurants/:restaurantId/users/:userId
// Get user details
router.get('/restaurants/:restaurantId/users/:userId',
  authenticate(),
  authorizeRestaurantAccess(),
  requirePermission(Permissions.USERS_READ),
  async (req, res) => {
    try {
      const { restaurantId, userId } = req.params;

      // Users can read their own profile, or admins can read any
      if (req.user!.id !== userId && !req.user!.permissions.includes(Permissions.USERS_MANAGE_OWN)) {
        throw new BusinessRuleError('Can only access your own profile', req.correlationId);
      }

      const userRepository = req.container.resolve('userRepository');
      const permissionService = req.container.resolve('permissionService');

      const user = await userRepository.findById(userId);
      if (!user || user.restaurantId !== restaurantId) {
        throw new UserNotFoundError('User not found', req.correlationId);
      }

      const userPermissions = await permissionService.getUserPermissions(userId);

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          failedLoginAttempts: user.failedLoginAttempts,
          lockedUntil: user.lockedUntil,
          permissions: userPermissions.allPermissions,
          assignedById: user.assignedById,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      throw error;
    }
  }
);

// PUT /api/v1/restaurants/:restaurantId/users/:userId
// Update user details
router.put('/restaurants/:restaurantId/users/:userId',
  authenticate(),
  authorizeRestaurantAccess(),
  async (req, res) => {
    try {
      const { restaurantId, userId } = req.params;
      const updates = req.body;

      const userRepository = req.container.resolve('userRepository');
      const permissionService = req.container.resolve('permissionService');

      const user = await userRepository.findById(userId);
      if (!user || user.restaurantId !== restaurantId) {
        throw new UserNotFoundError('User not found', req.correlationId);
      }

      // Check permissions
      const isOwnProfile = req.user!.id === userId;
      const canManageOwn = req.user!.permissions.includes(Permissions.USERS_MANAGE_OWN);
      const canManageUsers = req.user!.permissions.includes(Permissions.USERS_UPDATE);

      if (!isOwnProfile && !canManageUsers) {
        throw new BusinessRuleError('Cannot update this user', req.correlationId);
      }

      // If updating role, check assignment permissions
      if (updates.role && updates.role !== user.role) {
        const canAssignTargetRole = await permissionService.canAssignRole(req.user!.id, updates.role);
        if (!canAssignTargetRole) {
          throw new BusinessRuleError(
            `Cannot assign role ${updates.role}. Insufficient permissions.`,
            req.correlationId
          );
        }

        // Assign role with tracking
        await permissionService.assignRole(req.user!.id, userId, updates.role);
      }

      // Update other fields
      const allowedUpdates = ['firstName', 'lastName', 'isActive'];
      const filteredUpdates: any = {};

      for (const field of allowedUpdates) {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      }

      if (Object.keys(filteredUpdates).length > 0) {
        await userRepository.update(userId, filteredUpdates);
      }

      // Get updated user
      const updatedUser = await userRepository.findById(userId);
      const userPermissions = await permissionService.getUserPermissions(userId);

      res.json({
        success: true,
        data: {
          id: updatedUser!.id,
          email: updatedUser!.email,
          firstName: updatedUser!.firstName,
          lastName: updatedUser!.lastName,
          role: updatedUser!.role,
          isActive: updatedUser!.isActive,
          permissions: userPermissions.allPermissions,
          updatedAt: updatedUser!.updatedAt
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      throw error;
    }
  }
);

// PUT /api/v1/restaurants/:restaurantId/users/:userId/role
// Update user role (separate endpoint for clarity)
router.put('/restaurants/:restaurantId/users/:userId/role',
  authenticate(),
  authorizeRestaurantAccess(),
  requirePermission(Permissions.USERS_ASSIGN_ROLE),
  async (req, res) => {
    try {
      const { restaurantId, userId } = req.params;
      const { role: newRole } = req.body;

      if (!newRole) {
        throw new BusinessRuleError('Role is required', req.correlationId);
      }

      const userRepository = req.container.resolve('userRepository');
      const permissionService = req.container.resolve('permissionService');

      const user = await userRepository.findById(userId);
      if (!user || user.restaurantId !== restaurantId) {
        throw new UserNotFoundError('User not found', req.correlationId);
      }

      // Check if assigner can assign this role
      const canAssignTargetRole = await permissionService.canAssignRole(req.user!.id, newRole);
      if (!canAssignTargetRole) {
        throw new BusinessRuleError(
          `Cannot assign role ${newRole}. Insufficient permissions.`,
          req.correlationId
        );
      }

      // Assign role with tracking
      await permissionService.assignRole(req.user!.id, userId, newRole);

      res.json({
        success: true,
        data: {
          userId,
          oldRole: user.role,
          newRole,
          assignedBy: req.user!.id
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      throw error;
    }
  }
);

// DELETE /api/v1/restaurants/:restaurantId/users/:userId
// Deactivate user (soft delete)
router.delete('/restaurants/:restaurantId/users/:userId',
  authenticate(),
  authorizeRestaurantAccess(),
  requirePermission(Permissions.USERS_DELETE),
  async (req, res) => {
    try {
      const { restaurantId, userId } = req.params;

      const userRepository = req.container.resolve('userRepository');

      const user = await userRepository.findById(userId);
      if (!user || user.restaurantId !== restaurantId) {
        throw new UserNotFoundError('User not found', req.correlationId);
      }

      // Prevent deleting yourself
      if (req.user!.id === userId) {
        throw new BusinessRuleError('Cannot delete your own account', req.correlationId);
      }

      // Soft delete by deactivating
      await userRepository.update(userId, { isActive: false });

      res.json({
        success: true,
        data: {
          userId,
          action: 'deactivated'
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      throw error;
    }
  }
);

// POST /api/v1/restaurants/:restaurantId/users/:userId/reset-password
// Reset user password (admin function)
router.post('/restaurants/:restaurantId/users/:userId/reset-password',
  authenticate(),
  authorizeRestaurantAccess(),
  requirePermission(Permissions.USERS_UPDATE),
  async (req, res) => {
    try {
      const { restaurantId, userId } = req.params;

      const userRepository = req.container.resolve('userRepository');
      const authService = req.container.resolve('authService');

      const user = await userRepository.findById(userId);
      if (!user || user.restaurantId !== restaurantId) {
        throw new UserNotFoundError('User not found', req.correlationId);
      }

      // Generate password reset token
      await authService.initiatePasswordReset(user.email, restaurantId);

      res.json({
        success: true,
        message: 'Password reset email sent to user',
        correlationId: req.correlationId
      });
    } catch (error) {
      throw error;
    }
  }
);

// GET /api/v1/restaurants/:restaurantId/roles
// Get available roles and assignment permissions
router.get('/restaurants/:restaurantId/roles',
  authenticate(),
  authorizeRestaurantAccess(),
  requirePermission(Permissions.USERS_READ),
  async (req, res) => {
    try {
      const permissionService = req.container.resolve('permissionService');

      // Get all available roles
      const allRoles = Object.values(UserRole);

      // Check which roles the current user can assign
      const assignableRoles = await Promise.all(
        allRoles.map(async (role) => {
          const canAssign = await permissionService.canAssignRole(req.user!.id, role);
          return { role, canAssign };
        })
      );

      res.json({
        success: true,
        data: {
          availableRoles: allRoles,
          assignableRoles: assignableRoles.filter(r => r.canAssign).map(r => r.role),
          currentUserRole: req.user!.role
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      throw error;
    }
  }
);

export default router;
