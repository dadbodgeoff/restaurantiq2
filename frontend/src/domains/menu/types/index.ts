// frontend/src/domains/menu/types/index.ts
// Internal Menu Management Types - RestaurantIQ Prep Workflow Focus

// Core Menu Entities (Internal Use Only)
export interface MenuCategory {
  id: string;
  name: string;           // Appetizers, Mains, Desserts, etc.
  description?: string;   // Prep instructions for category
  displayOrder: number;   // Prep workflow ordering
  isActive: boolean;      // Quick enable/disable category
  itemCount?: number;     // Manager overview
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  name: string;           // What staff sees
  description?: string;   // Prep instructions
  prepTimeMinutes: number; // Critical for prep planning
  categoryId: string;
  category?: MenuCategory;
  allergens?: string;     // Safety compliance
  isAvailable: boolean;   // Operational control
  station?: string;       // Which prep station handles it
  createdAt: Date;
  updatedAt: Date;
}

// Filters for Internal Use
export interface MenuFilters {
  categoryId?: string;
  isAvailable?: boolean;
  station?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// API Response Types (Following existing patterns)
export interface PaginatedMenuItems {
  items: MenuItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MenuCategoriesResponse {
  categories: MenuCategory[];
}

export interface MenuItemsResponse {
  items: MenuItem[];
}

// Create/Update Request Types (Internal focused)
export interface CreateMenuCategoryRequest {
  name: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateMenuCategoryRequest {
  name?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface CreateMenuItemRequest {
  name: string;
  categoryId: string;
}

export interface UpdateMenuItemRequest {
  name?: string;
  categoryId?: string;
}

// API Response Wrapper (Following existing patterns)
export interface MenuApiResponse<T> {
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

// Permission Types (Internal Restaurant Staff)
export interface MenuPermissions {
  canViewMenu: boolean;
  canManageMenu: boolean;
  canManageCategories: boolean;
  canToggleAvailability: boolean;
}

// Component Props Types
export interface MenuOverviewProps {
  restaurantId: string;
}

export interface CategoryManagerProps {
  categories: MenuCategory[];
  onCategoryChange: () => void;
}

export interface ItemManagerProps {
  restaurantId: string;
  items: MenuItem[];
  categories: MenuCategory[];
  onItemChange: () => void;
}

export interface MenuFiltersProps {
  filters: MenuFilters;
  onChange: (filters: MenuFilters) => void;
  categories: MenuCategory[];
}

// Form State Types
export interface MenuCategoryFormData {
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

export interface MenuCategoryFormErrors {
  name?: string;
  description?: string;
  displayOrder?: string;
}

export interface MenuItemFormData {
  name: string;
  categoryId: string;
}

export interface MenuItemFormErrors {
  name?: string;
  categoryId?: string;
}

// Error Types (Following existing patterns)
export class MenuManagementError extends Error {
  constructor(
    message: string,
    public code: string,
    public correlationId?: string
  ) {
    super(message);
    this.name = 'MenuManagementError';
  }
}

// Loading States
export interface MenuLoadingState {
  loadingCategories: boolean;
  loadingItems: boolean;
  creatingCategory: boolean;
  updatingCategory: boolean;
  deletingCategory: boolean;
  creatingItem: boolean;
  updatingItem: boolean;
  deletingItem: boolean;
  togglingAvailability: boolean;
}

// Prep Workflow Integration Types
export interface PrepWorkflowData {
  categoryId: string;
  categoryName: string;
  items: Array<{
    itemId: string;
    itemName: string;
    prepTimeMinutes: number;
    station?: string;
    expectedPrepCount: number;
  }>;
}

// Manager Overview Types
export interface MenuOverviewData {
  totalCategories: number;
  totalItems: number;
  activeItems: number;
  inactiveItems: number;
  averagePrepTime: number;
  categoriesByStation: Record<string, number>;
}

// Category Import Types
export interface MenuCategoryWithItems extends MenuCategory {
  items: ImportableMenuItem[];
  itemCount: number;
}

export interface ImportableMenuItem {
  id: string;
  name: string;
  description: string;
  isAvailable: boolean;
  prepTimeMinutes: number;
}

export interface CategoryImportRequest {
  dayOfWeek: DayOfWeek;
  categoryIds: string[];
}

export interface CategoryImportResponse {
  success: boolean;
  data: {
    importedItems: WeeklyMenuItem[];
    categoriesProcessed: number;
    itemsImported: number;
  };
}

export interface WeeklyMenuItem {
  id: string;
  originalItemId?: string;
  name: string;
  categoryId: string;
  categoryName: string;
  importedAt?: string;
}

// Extend existing interfaces
export interface CategoryImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: MenuCategoryWithItems[];
  onImport: (categoryIds: string[], selectedDays?: DayOfWeek[]) => void;
  isImporting: boolean;
  selectedDay?: DayOfWeek;
  enableMultiDay?: boolean;
}

export interface CategoryPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: MenuCategoryWithItems[];
  selectedCategoryIds: string[];
  onProceedToImport: () => void;
}

// Conflict Resolution Types
export interface ImportConflict {
  itemId: string;
  itemName: string;
  categoryName: string;
  conflictType: 'DUPLICATE_NAME';
  existingItem?: {
    id: string;
    name: string;
    categoryName: string;
  };
}

export type ConflictAction = 'SKIP' | 'REPLACE' | 'RENAME';

export interface ConflictResolution {
  conflictId: string;
  action: ConflictAction;
  newName?: string;
}

export interface ConflictDetectionResponse {
  hasConflicts: boolean;
  conflicts: ImportConflict[];
  safeItems: ImportableMenuItem[];
  summary: {
    totalItems: number;
    conflictCount: number;
    safeCount: number;
  };
}

export interface ConflictResolutionResponse {
  resolvedConflicts: ConflictResolution[];
  importedItems: ImportableMenuItem[];
  skippedItems: ImportConflict[];
  summary: {
    totalResolved: number;
    totalImported: number;
    totalSkipped: number;
  };
}

export interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: ImportConflict[];
  onResolve: (resolutions: ConflictResolution[]) => void;
}

// Bulk Import Types
export type ImportStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

export interface BulkImportOperation {
  dayOfWeek: DayOfWeek;
  categoryIds: string[];
  status: ImportStatus;
  error?: string;
  importedCount?: number;
}

export interface BulkImportProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importOperations: BulkImportOperation[];
  onComplete: () => void;
}

// DayOfWeek type (moved from WeeklyMenuManager for consistency)
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday'
};
