// ==========================================
// HIERARCHICAL ROLE & PERMISSION SYSTEM
// ==========================================
// Enterprise-grade permission system with 5-level hierarchy
// Supports granular permissions and hierarchical role assignment

export const UserRole = {
  OWNER: 'OWNER',           // Can manage everything including roles
  ADMIN: 'ADMIN',           // Can manage users, settings, all modules
  MANAGER: 'MANAGER',       // Can manage staff, daily operations
  STAFF: 'STAFF',           // Can perform daily tasks
  GUEST: 'GUEST'            // Read-only access
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// Numerical hierarchy levels for comparison
export const RoleHierarchy = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  STAFF: 2,
  GUEST: 1,
} as const;

// ==========================================
// PERMISSION CATEGORIES
// ==========================================
// Organized by functional areas for scalability

export const PermissionCategories = {
  AUTH: 'auth',           // Login, logout, authentication
  USERS: 'users',         // User management, role assignment
  RESTAURANT: 'restaurant', // Restaurant settings, configuration
  MENU: 'menu',           // Menu items, categories, pricing
  PREP: 'prep',           // Prep planning, execution, finalization
  REVENUE: 'revenue',     // Sales data, financial reports
  INVENTORY: 'inventory', // Stock management (future module)
  REPORTS: 'reports',     // All reporting functions
  SETTINGS: 'settings',   // System and restaurant settings
  SYSTEM: 'system'        // System-level operations
} as const;

export type PermissionCategory = typeof PermissionCategories[keyof typeof PermissionCategories];

// ==========================================
// PERMISSION ACTIONS
// ==========================================
// Standard actions that can be performed on resources

export const PermissionActions = {
  CREATE: 'create',       // Can create new items
  READ: 'read',           // Can view/read data
  UPDATE: 'update',       // Can modify existing items
  DELETE: 'delete',       // Can remove items
  MANAGE: 'manage',       // Full control including role assignment
  ASSIGN: 'assign',       // Can assign to others (roles, tasks)
  APPROVE: 'approve',     // Can approve workflows
  FINALIZE: 'finalize',   // Can finalize/prevent changes
  EXPORT: 'export',       // Can export data
  IMPORT: 'import',       // Can import data
  CONFIGURE: 'configure'  // Can configure settings
} as const;

export type PermissionAction = typeof PermissionActions[keyof typeof PermissionActions];

// ==========================================
// SPECIFIC PERMISSIONS
// ==========================================
// Granular permissions for each module and action

export const Permissions = {
  // Authentication
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_RESET_PASSWORD: 'auth.reset_password',

  // User Management
  USERS_CREATE: 'users.create',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_ASSIGN_ROLE: 'users.assign_role',
  USERS_MANAGE_OWN: 'users.manage_own',

  // Restaurant Management
  RESTAURANT_READ: 'restaurant.read',
  RESTAURANT_UPDATE: 'restaurant.update',
  RESTAURANT_CONFIGURE: 'restaurant.configure',

  // Menu Management
  MENU_CREATE: 'menu.create',
  MENU_READ: 'menu.read',
  MENU_UPDATE: 'menu.update',
  MENU_DELETE: 'menu.delete',
  MENU_MANAGE: 'menu.manage',

  // PREP Management
  PREP_CREATE: 'prep.create',
  PREP_READ: 'prep.read',
  PREP_UPDATE: 'prep.update',
  PREP_DELETE: 'prep.delete',
  PREP_FINALIZE: 'prep.finalize',
  PREP_MANAGE: 'prep.manage',
  PREP_SYNC: 'prep.sync',

  // Revenue Management
  REVENUE_READ: 'revenue.read',
  REVENUE_EXPORT: 'revenue.export',

  // Reporting
  REPORTS_READ: 'reports.read',
  REPORTS_EXPORT: 'reports.export',

  // Inventory Management (Future Module)
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_READ: 'inventory.read',
  INVENTORY_UPDATE: 'inventory.update',
  INVENTORY_MANAGE: 'inventory.manage',
  INVENTORY_ASSIGN: 'inventory.assign',

  // Settings
  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',

  // System (Owner Only)
  SYSTEM_READ: 'system.read',
  SYSTEM_MANAGE: 'system.manage',
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];

// ==========================================
// ROLE ASSIGNMENT RULES
// ==========================================
// Defines which roles can assign which other roles
// Implements hierarchical restrictions

export const RoleAssignmentRules: Record<UserRole, UserRole[]> = {
  OWNER: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.GUEST],
  ADMIN: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.GUEST],
  MANAGER: [UserRole.STAFF, UserRole.GUEST],
  STAFF: [],
  GUEST: []
};

// ==========================================
// DEFAULT ROLE PERMISSIONS
// ==========================================
// Predefined permission sets for each role
// Can be customized per restaurant if needed

export const DefaultRolePermissions: Record<UserRole, Permission[]> = {
  // OWNER - Full System Access
  OWNER: [
    Permissions.AUTH_LOGIN, Permissions.AUTH_LOGOUT, Permissions.AUTH_RESET_PASSWORD,
    Permissions.USERS_CREATE, Permissions.USERS_READ, Permissions.USERS_UPDATE, Permissions.USERS_DELETE,
    Permissions.USERS_ASSIGN_ROLE, Permissions.USERS_MANAGE_OWN,
    Permissions.RESTAURANT_READ, Permissions.RESTAURANT_UPDATE, Permissions.RESTAURANT_CONFIGURE,
    Permissions.MENU_CREATE, Permissions.MENU_READ, Permissions.MENU_UPDATE, Permissions.MENU_DELETE, Permissions.MENU_MANAGE,
    Permissions.PREP_CREATE, Permissions.PREP_READ, Permissions.PREP_UPDATE, Permissions.PREP_FINALIZE, Permissions.PREP_MANAGE, Permissions.PREP_SYNC,
    Permissions.REVENUE_READ, Permissions.REVENUE_EXPORT,
    Permissions.REPORTS_READ, Permissions.REPORTS_EXPORT,
    Permissions.INVENTORY_CREATE, Permissions.INVENTORY_READ, Permissions.INVENTORY_UPDATE, Permissions.INVENTORY_MANAGE,
    Permissions.SETTINGS_READ, Permissions.SETTINGS_UPDATE,
    Permissions.SYSTEM_READ, Permissions.SYSTEM_MANAGE
  ],

  // ADMIN - Management Access (No System, No Role Assignment)
  ADMIN: [
    Permissions.AUTH_LOGIN, Permissions.AUTH_LOGOUT, Permissions.AUTH_RESET_PASSWORD,
    Permissions.USERS_CREATE, Permissions.USERS_READ, Permissions.USERS_UPDATE, Permissions.USERS_DELETE,
    Permissions.USERS_MANAGE_OWN,
    Permissions.RESTAURANT_READ, Permissions.RESTAURANT_UPDATE, Permissions.RESTAURANT_CONFIGURE,
    Permissions.MENU_CREATE, Permissions.MENU_READ, Permissions.MENU_UPDATE, Permissions.MENU_DELETE, Permissions.MENU_MANAGE,
    Permissions.PREP_CREATE, Permissions.PREP_READ, Permissions.PREP_UPDATE, Permissions.PREP_FINALIZE, Permissions.PREP_MANAGE, Permissions.PREP_SYNC,
    Permissions.REVENUE_READ, Permissions.REVENUE_EXPORT,
    Permissions.REPORTS_READ, Permissions.REPORTS_EXPORT,
    Permissions.INVENTORY_CREATE, Permissions.INVENTORY_READ, Permissions.INVENTORY_UPDATE, Permissions.INVENTORY_MANAGE,
    Permissions.SETTINGS_READ, Permissions.SETTINGS_UPDATE
    // NOTE: No USERS_ASSIGN_ROLE, no SYSTEM permissions
  ],

  // MANAGER - Operational Management
  MANAGER: [
    Permissions.AUTH_LOGIN, Permissions.AUTH_LOGOUT,
    Permissions.USERS_READ, Permissions.USERS_UPDATE, Permissions.USERS_MANAGE_OWN,
    Permissions.RESTAURANT_READ,
    Permissions.MENU_CREATE, Permissions.MENU_READ, Permissions.MENU_UPDATE, Permissions.MENU_DELETE,
    Permissions.PREP_CREATE, Permissions.PREP_READ, Permissions.PREP_UPDATE, Permissions.PREP_FINALIZE, Permissions.PREP_MANAGE, Permissions.PREP_SYNC,
    Permissions.REVENUE_READ, Permissions.REPORTS_READ, Permissions.REPORTS_EXPORT,
    Permissions.INVENTORY_READ, Permissions.INVENTORY_UPDATE,
    Permissions.SETTINGS_READ
    // NOTE: Can manage operations but not users or roles
  ],

  // STAFF - Daily Operations
  STAFF: [
    Permissions.AUTH_LOGIN, Permissions.AUTH_LOGOUT,
    Permissions.USERS_READ, Permissions.USERS_MANAGE_OWN,
    Permissions.MENU_READ,
    Permissions.PREP_READ, Permissions.PREP_UPDATE, Permissions.PREP_SYNC,
    Permissions.REVENUE_READ,
    Permissions.INVENTORY_READ
    // NOTE: Can perform daily tasks but not manage others
  ],

  // GUEST - Read-Only
  GUEST: [
    Permissions.AUTH_LOGIN,
    Permissions.USERS_READ,
    Permissions.MENU_READ,
    Permissions.PREP_READ,
    Permissions.REVENUE_READ,
    Permissions.INVENTORY_READ
    // NOTE: Can only view data, no modifications
  ]
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
// Helper functions for permission management

export function hasPermission(userPermissions: Permission[], requiredPermission: Permission): boolean {
  return userPermissions.includes(requiredPermission);
}

export function hasAnyPermission(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

export function hasAllPermissions(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}

export function canAssignRole(assignerRole: UserRole, targetRole: UserRole): boolean {
  return RoleAssignmentRules[assignerRole]?.includes(targetRole) ?? false;
}

export function isHigherRole(role1: UserRole, role2: UserRole): boolean {
  return RoleHierarchy[role1] > RoleHierarchy[role2];
}

export function isLowerOrEqualRole(role1: UserRole, role2: UserRole): boolean {
  return RoleHierarchy[role1] <= RoleHierarchy[role2];
}

export function getRoleLevel(role: UserRole): number {
  return RoleHierarchy[role];
}

export function getPermissionCategory(permission: Permission): PermissionCategory {
  return permission.split('.')[0] as PermissionCategory;
}

export function getPermissionAction(permission: Permission): PermissionAction {
  return permission.split('.')[1] as PermissionAction;
}

// ==========================================
// FUTURE MODULE INTEGRATION
// ==========================================
// Template for adding new modules with permissions

export interface ModulePermissions {
  category: PermissionCategory;
  permissions: Record<string, Permission>;
  rolePermissions: Partial<Record<UserRole, Permission[]>>;
}

export function registerModulePermissions(module: ModulePermissions): void {
  // This function would be used to dynamically register new module permissions
  // Implementation would integrate with the permission service
  console.log(`Registering permissions for module: ${module.category}`);
  // Add to permission registry, update database, etc.
}
