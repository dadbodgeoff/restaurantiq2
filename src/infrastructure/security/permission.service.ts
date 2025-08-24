import { UserRole, Permission, DefaultRolePermissions, RoleAssignmentRules,
         hasPermission, canAssignRole, isHigherRole, getRoleLevel, Permissions } from '../../domains/shared/types/permissions';
import { LoggerService } from '../logging/logger.service';
import { PrismaClient } from '@prisma/client';
import { AuthorizationError, BusinessRuleError } from '../../lib/errors/specific-errors';

export interface UserPermissions {
  userId: string;
  role: UserRole;
  rolePermissions: Permission[];
  userSpecificPermissions: Permission[];
  allPermissions: Permission[];
}

export interface PermissionCheck {
  hasPermission: boolean;
  userPermissions: Permission[];
  missingPermissions: Permission[];
}

export class PermissionService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: LoggerService
  ) {}

  // ==========================================
  // PERMISSION CHECKING
  // ==========================================

  /**
   * Check if a user has a specific permission
   */
  async hasPermission(userId: string, permission: Permission, restaurantId?: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return hasPermission(userPermissions.allPermissions, permission);
  }

  /**
   * Check if a user has any of the specified permissions
   */
  async hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissions.some(permission => userPermissions.allPermissions.includes(permission));
  }

  /**
   * Check if a user has all of the specified permissions
   */
  async hasAllPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissions.every(permission => userPermissions.allPermissions.includes(permission));
  }

  /**
   * Get detailed permission check result
   */
  async checkPermission(userId: string, requiredPermission: Permission): Promise<PermissionCheck> {
    const userPermissions = await this.getUserPermissions(userId);
    const hasPerm = userPermissions.allPermissions.includes(requiredPermission);

    return {
      hasPermission: hasPerm,
      userPermissions: userPermissions.allPermissions,
      missingPermissions: hasPerm ? [] : [requiredPermission]
    };
  }

  // ==========================================
  // USER PERMISSIONS MANAGEMENT
  // ==========================================

  /**
   * Get all permissions for a user (role + user-specific)
   */
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    const prisma = this.prisma;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      throw new AuthorizationError('User not found', 'unknown');
    }

    // Get role-based permissions
    const rolePermissions = DefaultRolePermissions[user.role] || [];

    // Get user-specific permissions from database
    const userSpecificPermissions = await this.getUserSpecificPermissions(userId);

    // Combine all permissions (role + user-specific)
    const permissionSet = new Set([...rolePermissions, ...userSpecificPermissions]);
    const allPermissions = Array.from(permissionSet);

    return {
      userId,
      role: user.role,
      rolePermissions,
      userSpecificPermissions,
      allPermissions
    };
  }

  /**
   * Get user-specific permissions from database
   */
  private async getUserSpecificPermissions(userId: string): Promise<Permission[]> {
    const prisma = this.prisma;

    const userPermissions = await prisma.userPermission.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        permission: true
      }
    });

    return userPermissions.map(up => up.permission.name as Permission);
  }

  // ==========================================
  // ROLE ASSIGNMENT & HIERARCHY
  // ==========================================

  /**
   * Check if a user can assign a role to another user
   */
  async canAssignRole(assignerId: string, targetRole: UserRole): Promise<boolean> {
    const prisma = this.prisma;

    const assigner = await prisma.user.findUnique({
      where: { id: assignerId },
      select: { role: true }
    });

    if (!assigner) {
      return false;
    }

    return canAssignRole(assigner.role, targetRole);
  }

  /**
   * Assign a role to a user (with hierarchy validation)
   */
  async assignRole(assignerId: string, targetUserId: string, newRole: UserRole): Promise<void> {
    const prisma = this.prisma;

    const [assigner, targetUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: assignerId },
        select: { role: true }
      }),
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: { role: true }
      })
    ]);

    if (!assigner || !targetUser) {
      throw new AuthorizationError('User not found', 'unknown');
    }

    // Check if assigner can assign this role
    if (!canAssignRole(assigner.role, newRole)) {
      throw new AuthorizationError(
        `Cannot assign role ${newRole}. Insufficient permissions.`,
        'unknown'
      );
    }

    // Prevent privilege escalation
    if (isHigherRole(newRole, assigner.role)) {
      throw new AuthorizationError(
        'Cannot assign role higher than your own',
        'unknown'
      );
    }

    // Update user role
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        role: newRole,
        assignedById: assignerId
      }
    });

    this.logger.info('Role Assignment', `Role assigned successfully: ${assignerId} assigned ${newRole} to ${targetUserId}`, {
      assignerId,
      assignerRole: assigner.role,
      targetUserId,
      oldRole: targetUser.role,
      newRole,
      correlationId: 'unknown'
    });
  }

  // ==========================================
  // USER-SPECIFIC PERMISSIONS
  // ==========================================

  /**
   * Grant a specific permission to a user
   */
  async grantUserPermission(
    granterId: string,
    targetUserId: string,
    permission: Permission,
    expiresAt?: Date
  ): Promise<void> {
    const prisma = this.prisma;

    const [granter, targetUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: granterId },
        select: { email: true }
      }),
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: { email: true }
      })
    ]);

    if (!granter || !targetUser) {
      throw new AuthorizationError('User not found', 'unknown');
    }

    // Check if granter has permission to grant this permission
    const granterPermissions = await this.getUserPermissions(granterId);
    if (!granterPermissions.allPermissions.includes(permission)) {
      throw new AuthorizationError(
        `Cannot grant permission ${permission}. Insufficient permissions.`,
        'unknown'
      );
    }



    // Check if permission exists in database
    const permissionRecord = await prisma.permission.findUnique({
      where: { name: permission }
    });

    if (!permissionRecord) {
      throw new BusinessRuleError(`Permission ${permission} does not exist`, 'unknown');
    }

    // Grant the permission
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId: targetUserId,
          permissionId: permissionRecord.id
        }
      },
      update: {
        isActive: true,
        expiresAt,
        grantedById: granterId,
        grantedAt: new Date()
      },
      create: {
        userId: targetUserId,
        permissionId: permissionRecord.id,
        grantedById: granterId,
        expiresAt
      }
    });

    this.logger.info('Permission Grant', `Permission granted successfully: ${granterId} granted ${permission} to ${targetUserId}`, {
      granterId,
      targetUserId,
      permission,
      expiresAt,
      correlationId: 'unknown'
    });
  }

  /**
   * Revoke a specific permission from a user
   */
  async revokeUserPermission(revokerId: string, targetUserId: string, permission: Permission): Promise<void> {
    const prisma = this.prisma;

    const [revoker, targetUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: revokerId },
        select: { email: true }
      }),
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: { email: true }
      })
    ]);

    if (!revoker || !targetUser) {
      throw new AuthorizationError('User not found', 'unknown');
    }

    // Check if permission exists
    const permissionRecord = await prisma.permission.findUnique({
      where: { name: permission }
    });

    if (!permissionRecord) {
      throw new BusinessRuleError(`Permission ${permission} does not exist`, 'unknown');
    }

    // Revoke the permission
    await prisma.userPermission.updateMany({
      where: {
        userId: targetUserId,
        permissionId: permissionRecord.id,
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    this.logger.info('Permission Revoke', `Permission revoked successfully: ${revokerId} revoked ${permission} from ${targetUserId}`, {
      revokerId,
      targetUserId,
      permission,
      correlationId: 'unknown'
    });
  }

  // ==========================================
  // ACCOUNT SECURITY
  // ==========================================

  /**
   * Handle failed login attempt with account lockout
   */
  async handleFailedLogin(userId: string): Promise<void> {
    const prisma = this.prisma;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, failedLoginAttempts: true }
    });

    if (!user) return;

    const newAttempts = (user.failedLoginAttempts ?? 0) + 1;

    // Lock account if too many attempts
    if (newAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: new Date(Date.now() + this.LOCKOUT_DURATION)
        }
      });

      this.logger.warn('Account Lock', `Account locked due to failed login attempts: ${userId}`, {
        userId,
        email: user.email,
        correlationId: 'unknown'
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { failedLoginAttempts: newAttempts }
      });
    }
  }

  /**
   * Reset failed login attempts on successful login
   */
  async resetLoginAttempts(userId: string): Promise<void> {
    const prisma = this.prisma;

    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(userId: string): Promise<{ locked: boolean; remainingTime?: number }> {
    const prisma = this.prisma;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lockedUntil: true }
    });

    if (!user || !user.lockedUntil) {
      return { locked: false };
    }

    const now = new Date();
    if (user.lockedUntil > now) {
      const remainingTime = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 1000 / 60);
      return { locked: true, remainingTime };
    }

    // Lock has expired, reset
    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: null,
        failedLoginAttempts: 0
      }
    });

    return { locked: false };
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<Array<{ name: Permission; category: string; action: string; description?: string }>> {
    const prisma = this.prisma;

    const permissions = await prisma.permission.findMany({
      where: { isActive: true },
      orderBy: { category: 'asc' }
    });

    return permissions.map(p => ({
      name: p.name as Permission,
      category: p.category,
      action: p.action,
      description: p.description || undefined
    }));
  }

  /**
   * Get permissions by category
   */
  async getPermissionsByCategory(category: string): Promise<Permission[]> {
    const prisma = this.prisma;

    const permissions = await prisma.permission.findMany({
      where: {
        category,
        isActive: true
      }
    });

    return permissions.map(p => p.name as Permission);
  }

  /**
   * Initialize default permissions in database
   * This should be called during system setup
   */
  async initializeDefaultPermissions(): Promise<void> {
    const prisma = this.prisma;

    const defaultPermissions = Object.values(Permissions).map(permission => {
      const [category, action] = permission.split('.');
      return {
        name: permission,
        category,
        action,
        description: `${action} ${category}` // Basic description
      };
    });

    for (const permission of defaultPermissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: permission,
        create: permission
      });
    }

    this.logger.info('Permission Init', `Default permissions initialized: ${defaultPermissions.length} permissions created`, {
      count: defaultPermissions.length,
      correlationId: 'system'
    });
  }

  /**
   * Sync role permissions in database
   * This ensures database has the correct role-permission mappings
   */
  async syncRolePermissions(): Promise<void> {
    const prisma = this.prisma;

    for (const [role, permissions] of Object.entries(DefaultRolePermissions)) {
      const roleEnum = role as UserRole;

      // Remove existing role permissions
      await prisma.rolePermission.deleteMany({
        where: { role: roleEnum }
      });

      // Add new role permissions
      for (const permission of permissions) {
        const permissionRecord = await prisma.permission.findUnique({
          where: { name: permission }
        });

        if (permissionRecord) {
          await prisma.rolePermission.create({
            data: {
              role: roleEnum,
              permissionId: permissionRecord.id
            }
          });
        }
      }
    }

    this.logger.info('Role Sync', 'Role permissions synchronized successfully', {
      correlationId: 'system'
    });
  }
}
