// frontend/src/domains/user/types/index.ts
// User Management Domain Types - Following RestaurantIQ patterns

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'GUEST';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  failedLoginAttempts?: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export interface PaginatedUsers {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserRoleUpdate {
  userId: string;
  oldRole: UserRole;
  newRole: UserRole;
  assignedBy: string;
  assignedAt: Date;
}

export interface UpdateRoleRequest {
  role: UserRole;
}

export interface UpdateRoleResponse {
  success: boolean;
  data: UserRoleUpdate;
  correlationId: string;
  message?: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface CreateUserResponse {
  user: User;
  temporaryPassword?: string;
}

// API Response types following existing patterns
export interface UserApiResponse<T> {
  success: boolean;
  data: T;
  correlationId: string;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Component Props types
export interface UsersListProps {
  restaurantId: string;
}

export interface UsersTableProps {
  users: User[];
  restaurantId: string;
  onRoleChange: (userId: string, role: UserRole) => Promise<void>;
  loading?: boolean;
}

export interface UserRowProps {
  user: User;
  restaurantId: string;
  onRoleChange: (userId: string, role: UserRole) => Promise<void>;
}

export interface UsersFiltersProps {
  filters: UserFilters;
  onChange: (filters: UserFilters) => void;
}

export interface UsersPaginationProps {
  pagination: PaginatedUsers['pagination'];
  onPageChange: (page: number) => void;
}

export interface RoleBadgeProps {
  role: UserRole;
}

export interface StatusBadgeProps {
  isActive: boolean;
}

// Permission types following existing patterns
export interface UserPermissions {
  canViewUsers: boolean;
  canAssignRoles: boolean;
  canManageUsers: boolean;
  assignableRoles: UserRole[];
}

// Error types following existing patterns
export class UserManagementError extends Error {
  constructor(
    message: string,
    public code: string,
    public correlationId?: string
  ) {
    super(message);
    this.name = 'UserManagementError';
  }
}

// Form state types
export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface UserFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  isActive?: string;
}

// Loading states
export interface UserLoadingState {
  loadingUsers: boolean;
  updatingRole: boolean;
  updatingUser: boolean;
  deletingUser: boolean;
}

// Audit trail types
export interface UserAuditLog {
  id: string;
  userId: string;
  action: 'ROLE_CHANGED' | 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED';
  oldValue?: string | number | boolean;
  newValue?: string | number | boolean;
  performedBy: string;
  performedAt: Date;
  correlationId: string;
}
