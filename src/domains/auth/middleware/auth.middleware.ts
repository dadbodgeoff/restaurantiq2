import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../../../infrastructure/security/jwt/jwt.service';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../../../infrastructure/security/permission.service';
import { AuthenticationError, AuthorizationError } from '../../../lib/errors/specific-errors';
import { Permission, UserRole } from '../../shared/types/permissions';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        restaurantId: string;
        role: UserRole;
        permissions: Permission[];
        email?: string;
        firstName?: string;
        lastName?: string;
      };
      correlationId: string;
      container: any;
    }
  }
}

export function authenticate() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthenticationError(
          'Missing or invalid authorization header',
          req.correlationId
        );
      }

      const token = authHeader.substring(7);
      const jwtService = req.container.resolve('jwtService') as JwtService;
      const payload = jwtService.verifyAccessToken(token);

      if (!payload || payload.type !== 'access') {
        throw new AuthenticationError(
          'Invalid or expired token',
          req.correlationId
        );
      }

      // Get user permissions (either from token or fetch from database)
      let permissions = payload.permissions as Permission[];
      if (!permissions) {
        const permissionService = req.container.resolve('permissionService') as PermissionService;
        const userPermissions = await permissionService.getUserPermissions(payload.userId);
        permissions = userPermissions.allPermissions;
      }

      req.user = {
        id: payload.userId,
        restaurantId: payload.restaurantId,
        role: payload.role as UserRole,
        permissions: permissions,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function authorizeRestaurantAccess() {
  return (req: Request, res: Response, next: NextFunction) => {
    const restaurantId = req.params.restaurantId || req.query.restaurantId;

    if (!restaurantId) {
      throw new AuthorizationError(
        'Restaurant ID required',
        req.correlationId
      );
    }

    if (req.user?.restaurantId !== restaurantId) {
      throw new AuthorizationError(
        'Access denied to this restaurant',
        req.correlationId,
        {
          userRestaurantId: req.user?.restaurantId,
          requestedRestaurantId: restaurantId,
        }
      );
    }

    next();
  };
}

// ==========================================
// PERMISSION-BASED AUTHORIZATION MIDDLEWARE
// ==========================================

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthenticationError(
        'Authentication required',
        req.correlationId
      );
    }

    if (!req.user.permissions.includes(permission)) {
      throw new AuthorizationError(
        `Missing permission: ${permission}`,
        req.correlationId,
        {
          userId: req.user.id,
          userRole: req.user.role,
          requiredPermission: permission,
          userPermissions: req.user.permissions
        }
      );
    }

    next();
  };
}

export function requireAnyPermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthenticationError(
        'Authentication required',
        req.correlationId
      );
    }

    const hasAnyPermission = permissions.some(permission => req.user!.permissions.includes(permission));

    if (!hasAnyPermission) {
      throw new AuthorizationError(
        `Missing any of required permissions: ${permissions.join(', ')}`,
        req.correlationId,
        {
          userId: req.user.id,
          userRole: req.user.role,
          requiredPermissions: permissions,
          userPermissions: req.user.permissions
        }
      );
    }

    next();
  };
}

export function requireAllPermissions(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthenticationError(
        'Authentication required',
        req.correlationId
      );
    }

    const hasAllPermissions = permissions.every(permission => req.user!.permissions.includes(permission));

    if (!hasAllPermissions) {
      throw new AuthorizationError(
        `Missing all required permissions: ${permissions.join(', ')}`,
        req.correlationId,
        {
          userId: req.user.id,
          userRole: req.user.role,
          requiredPermissions: permissions,
          userPermissions: req.user.permissions
        }
      );
    }

    next();
  };
}

// ==========================================
// ROLE-BASED AUTHORIZATION (BACKWARD COMPATIBILITY)
// ==========================================

export function requireRole(requiredRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthenticationError(
        'Authentication required',
        req.correlationId
      );
    }

    // Define role hierarchy levels
    const roleHierarchy = {
      OWNER: 5,
      ADMIN: 4,
      MANAGER: 3,
      STAFF: 2,
      GUEST: 1,
    };

    const userRoleLevel = roleHierarchy[req.user.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      throw new AuthorizationError(
        `Insufficient role level. Required: ${requiredRole}`,
        req.correlationId,
        {
          userRole: req.user.role,
          requiredRole,
          userRoleLevel,
          requiredRoleLevel,
        }
      );
    }

    next();
  };
}

// ==========================================
// ROLE ASSIGNMENT AUTHORIZATION
// ==========================================

export function canAssignRole(targetRole: UserRole) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthenticationError(
        'Authentication required',
        req.correlationId
      );
    }

    const permissionService = req.container.resolve('permissionService') as PermissionService;
    const canAssign = await permissionService.canAssignRole(req.user.id, targetRole);

    if (!canAssign) {
      throw new AuthorizationError(
        `Cannot assign role ${targetRole}. Insufficient permissions.`,
        req.correlationId,
        {
          userId: req.user.id,
          userRole: req.user.role,
          targetRole,
        }
      );
    }

    next();
  };
}
