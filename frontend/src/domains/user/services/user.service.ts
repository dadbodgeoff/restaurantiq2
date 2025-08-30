// frontend/src/domains/user/services/user.service.ts
// User Management Business Service - Following RestaurantIQ patterns

import { UserApiService } from './user.api.service';
import {
  User,
  UserFilters,
  PaginatedUsers,
  UserRoleUpdate,
  CreateUserRequest,
  CreateUserResponse,
  UserPermissions,
  UserRole,
  UserManagementError
} from '../types';

export class UserService {
  constructor(
    private readonly userApiService: UserApiService,
    private readonly currentUser: { id: string; role: UserRole; restaurantId: string }
  ) {}

  /**
   * Load users with filters and pagination
   * Following existing service patterns from auth.service.ts
   */
  async loadUsers(restaurantId: string, filters: UserFilters = {}): Promise<PaginatedUsers> {
    try {
      console.log(`🔍 UserService.loadUsers`, { restaurantId, filters });

      // Check permissions
      this.checkViewUsersPermission();

      // Set default filters
      const defaultFilters: UserFilters = {
        page: 1,
        limit: 20,
        ...filters
      };

      const response = await this.userApiService.getUsers(restaurantId, defaultFilters);

      if (!response.success) {
        throw new UserManagementError(
          response.error?.message || 'Failed to load users',
          response.error?.code || 'LOAD_USERS_FAILED',
          response.correlationId
        );
      }

      console.log(`✅ UserService.loadUsers success`, {
        userCount: response.data?.users?.length || 'unknown',
        totalItems: response.data?.pagination?.total || 'unknown',
        correlationId: response.correlationId
      });

      return response.data;
    } catch (error) {
      console.error('❌ UserService.loadUsers failed:', error);
      throw error;
    }
  }

  /**
   * Assign role to user with permission validation
   * Following existing service patterns
   */
  async assignRole(
    restaurantId: string,
    userId: string,
    newRole: UserRole
  ): Promise<UserRoleUpdate> {
    try {
      console.log(`🔄 UserService.assignRole`, {
        restaurantId,
        userId,
        newRole,
        assignedBy: this.currentUser.id
      });

      // Validate permission to assign this role
      this.checkAssignRolePermission(newRole);

      // Validate role assignment rules
      this.validateRoleAssignment(newRole, userId);

      const response = await this.userApiService.updateUserRole(restaurantId, userId, newRole);

      if (!response.success) {
        throw new UserManagementError(
          response.error?.message || 'Failed to update user role',
          response.error?.code || 'ROLE_UPDATE_FAILED',
          response.correlationId
        );
      }

      console.log(`✅ UserService.assignRole success`, {
        userId,
        oldRole: response.data.oldRole,
        newRole: response.data.newRole,
        correlationId: response.correlationId
      });

      return response.data;
    } catch (error) {
      console.error('❌ UserService.assignRole failed:', error);
      throw error;
    }
  }

  /**
   * Get user permissions for current user
   * Following existing permission patterns
   */
  getUserPermissions(): UserPermissions {
    const role = this.currentUser.role;

    // Define permission matrix based on role hierarchy
    const permissions: Record<UserRole, UserPermissions> = {
      OWNER: {
        canViewUsers: true,
        canAssignRoles: true,
        canManageUsers: true,
        assignableRoles: ['ADMIN', 'MANAGER', 'STAFF']
      },
      ADMIN: {
        canViewUsers: true,
        canAssignRoles: true,
        canManageUsers: true,
        assignableRoles: ['MANAGER', 'STAFF']
      },
      MANAGER: {
        canViewUsers: true,
        canAssignRoles: true,
        canManageUsers: false,
        assignableRoles: ['STAFF']
      },
      STAFF: {
        canViewUsers: false,
        canAssignRoles: false,
        canManageUsers: false,
        assignableRoles: []
      },
      GUEST: {
        canViewUsers: false,
        canAssignRoles: false,
        canManageUsers: false,
        assignableRoles: []
      }
    };

    return permissions[role] || permissions.GUEST;
  }

  /**
   * Get assignable roles for current user
   * Following existing permission patterns
   */
  getAssignableRoles(): UserRole[] {
    return this.getUserPermissions().assignableRoles;
  }

  /**
   * Check if current user can view users
   * Following existing permission patterns
   */
  private checkViewUsersPermission(): void {
    const permissions = this.getUserPermissions();

    if (!permissions.canViewUsers) {
      throw new UserManagementError(
        'Insufficient permissions to view users',
        'INSUFFICIENT_PERMISSIONS',
        `user-${this.currentUser.id}`
      );
    }
  }

  /**
   * Check if current user can assign a specific role
   * Following existing permission patterns
   */
  private checkAssignRolePermission(targetRole: UserRole): void {
    const permissions = this.getUserPermissions();

    if (!permissions.canAssignRoles) {
      throw new UserManagementError(
        'Insufficient permissions to assign roles',
        'INSUFFICIENT_PERMISSIONS',
        `user-${this.currentUser.id}`
      );
    }

    if (!permissions.assignableRoles.includes(targetRole)) {
      throw new UserManagementError(
        `Cannot assign role: ${targetRole}. Maximum assignable role: ${permissions.assignableRoles[0] || 'None'}`,
        'ROLE_ASSIGNMENT_NOT_ALLOWED',
        `user-${this.currentUser.id}`
      );
    }
  }

  /**
   * Validate role assignment business rules
   * Following existing validation patterns
   */
  private validateRoleAssignment(targetRole: UserRole, userId: string): void {
    // Prevent self-demotion
    if (userId === this.currentUser.id) {
      // Allow self-demotion only if there will be another user with higher privileges
      // This is a business rule to prevent lockout
      console.warn('⚠️ Self-role assignment detected - additional validation may be needed');
    }

    // Validate role hierarchy
    const roleHierarchy: Record<UserRole, number> = {
      OWNER: 5,
      ADMIN: 4,
      MANAGER: 3,
      STAFF: 2,
      GUEST: 1
    };

    const currentUserLevel = roleHierarchy[this.currentUser.role];
    const targetRoleLevel = roleHierarchy[targetRole];

    if (targetRoleLevel >= currentUserLevel) {
      throw new UserManagementError(
        `Cannot assign role '${targetRole}' - target role has equal or higher privilege level`,
        'ROLE_HIERARCHY_VIOLATION',
        `user-${this.currentUser.id}`
      );
    }
  }

  /**
   * Get user by ID with permission check
   * Following existing service patterns
   */
  async getUser(restaurantId: string, userId: string): Promise<User> {
    try {
      console.log(`🔍 UserService.getUser`, { restaurantId, userId });

      this.checkViewUsersPermission();

      const response = await this.userApiService.getUser(restaurantId, userId);

      if (!response.success) {
        throw new UserManagementError(
          response.error?.message || 'Failed to get user',
          response.error?.code || 'GET_USER_FAILED',
          response.correlationId
        );
      }

      return response.data;
    } catch (error) {
      console.error('❌ UserService.getUser failed:', error);
      throw error;
    }
  }

  /**
   * Update user details
   * Following existing service patterns
   */
  async updateUser(
    restaurantId: string,
    userId: string,
    userData: Partial<User>
  ): Promise<User> {
    try {
      console.log(`🔄 UserService.updateUser`, {
        restaurantId,
        userId,
        fields: Object.keys(userData)
      });

      const permissions = this.getUserPermissions();

      if (!permissions.canManageUsers) {
        throw new UserManagementError(
          'Insufficient permissions to manage users',
          'INSUFFICIENT_PERMISSIONS',
          `user-${this.currentUser.id}`
        );
      }

      const response = await this.userApiService.updateUser(restaurantId, userId, userData);

      if (!response.success) {
        throw new UserManagementError(
          response.error?.message || 'Failed to update user',
          response.error?.code || 'UPDATE_USER_FAILED',
          response.correlationId
        );
      }

      return response.data;
    } catch (error) {
      console.error('❌ UserService.updateUser failed:', error);
      throw error;
    }
  }

  /**
   * Delete/inactivate user
   * Following existing service patterns
   */
  async deleteUser(restaurantId: string, userId: string): Promise<{ userId: string; deleted: boolean }> {
    try {
      console.log(`🗑️ UserService.deleteUser`, { restaurantId, userId });

      const permissions = this.getUserPermissions();

      if (!permissions.canManageUsers) {
        throw new UserManagementError(
          'Insufficient permissions to manage users',
          'INSUFFICIENT_PERMISSIONS',
          `user-${this.currentUser.id}`
        );
      }

      // Prevent self-deletion
      if (userId === this.currentUser.id) {
        throw new UserManagementError(
          'Cannot delete your own account',
          'SELF_DELETION_NOT_ALLOWED',
          `user-${this.currentUser.id}`
        );
      }

      const response = await this.userApiService.deleteUser(restaurantId, userId);

      if (!response.success) {
        throw new UserManagementError(
          response.error?.message || 'Failed to delete user',
          response.error?.code || 'DELETE_USER_FAILED',
          response.correlationId
        );
      }

      return response.data;
    } catch (error) {
      console.error('❌ UserService.deleteUser failed:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   * Following existing service patterns
   */
  async createUser(
    restaurantId: string,
    userData: CreateUserRequest
  ): Promise<CreateUserResponse> {
    try {
      console.log(`👤 UserService.createUser`, {
        restaurantId,
        email: userData.email,
        role: userData.role,
        assignedBy: this.currentUser.id
      });

      // Validate permission to create users
      this.checkCreateUserPermission();

      // Validate role assignment rules
      this.validateCreateUserData(userData);

      const response = await this.userApiService.createUser(restaurantId, userData);

      if (!response.success) {
        throw new UserManagementError(
          response.error?.message || 'Failed to create user',
          response.error?.code || 'CREATE_USER_FAILED',
          response.correlationId
        );
      }

      console.log(`✅ UserService.createUser success`, {
        userId: response.data.user.id,
        email: response.data.user.email,
        role: response.data.user.role,
        correlationId: response.correlationId
      });

      return response.data;
    } catch (error) {
      console.error('❌ UserService.createUser failed:', error);
      throw error;
    }
  }

  /**
   * Check if current user can create users
   * Following existing permission patterns
   */
  private checkCreateUserPermission(): void {
    const permissions = this.getUserPermissions();

    if (!permissions.canManageUsers) {
      throw new UserManagementError(
        'Insufficient permissions to create users',
        'INSUFFICIENT_PERMISSIONS',
        `user-${this.currentUser.id}`
      );
    }
  }

  /**
   * Validate user creation data
   * Following existing validation patterns
   */
  private validateCreateUserData(userData: CreateUserRequest): void {
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new UserManagementError(
        'Invalid email format',
        'INVALID_EMAIL_FORMAT',
        `user-${this.currentUser.id}`
      );
    }

    // Password strength validation
    if (userData.password.length < 8) {
      throw new UserManagementError(
        'Password must be at least 8 characters long',
        'PASSWORD_TOO_SHORT',
        `user-${this.currentUser.id}`
      );
    }

    // Validate role is assignable
    const permissions = this.getUserPermissions();
    if (!permissions.assignableRoles.includes(userData.role)) {
      throw new UserManagementError(
        `Cannot create user with role: ${userData.role}. Maximum assignable role: ${permissions.assignableRoles[0] || 'None'}`,
        'ROLE_ASSIGNMENT_NOT_ALLOWED',
        `user-${this.currentUser.id}`
      );
    }
  }
}
