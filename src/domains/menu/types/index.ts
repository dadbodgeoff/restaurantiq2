import { Decimal } from '@prisma/client/runtime/library';

// Menu Category Types
export interface CreateMenuCategoryRequest {
  restaurantId: string;
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

export interface MenuCategoryResponse {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  items?: MenuItemResponse[];
}

// Menu Item Types
export interface CreateMenuItemRequest {
  restaurantId: string;
  categoryId: string;
  name: string;
  // Simplified for brain/logic system - defaults will be set
  description?: string | null;
  price?: number;
  imageUrl?: string | null;
  isAvailable?: boolean;
  prepTimeMinutes?: number;
  prepNotes?: string | null;
  allergens?: string | null;
  nutritionalInfo?: string | null;
}

export interface UpdateMenuItemRequest {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  isAvailable?: boolean;
  prepTimeMinutes?: number;
  prepNotes?: string;
  allergens?: string;
  nutritionalInfo?: string;
}

export interface MenuItemResponse {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: Decimal;
  imageUrl?: string;
  isAvailable: boolean;
  prepTimeMinutes: number;
  prepNotes?: string;
  allergens?: string;
  nutritionalInfo?: string;
  createdAt: Date;
  updatedAt: Date;
  category?: MenuCategoryResponse;
  options?: MenuItemOptionResponse[];
}

// Menu Item Option Types
export interface CreateMenuItemOptionRequest {
  menuItemId: string;
  name: string;
  type: string;
  priceModifier?: number;
  isRequired?: boolean;
  maxSelections?: number;
  displayOrder?: number;
}

export interface UpdateMenuItemOptionRequest {
  name?: string;
  type?: string;
  priceModifier?: number;
  isRequired?: boolean;
  maxSelections?: number;
  displayOrder?: number;
}

export interface MenuItemOptionResponse {
  id: string;
  menuItemId: string;
  name: string;
  type: string;
  priceModifier: Decimal;
  isRequired: boolean;
  maxSelections: number;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Search Types
export interface SearchMenuRequest {
  restaurantId: string;
  query: string;
}

export interface SearchMenuResponse {
  categories: MenuCategoryResponse[];
  items: MenuItemResponse[];
}

// Business Logic Types
export interface MenuServiceDependencies {
  menuItemRepository: any;
  menuCategoryRepository: any;
  logger: any;
  validator: any;
}

// Error Types
export class MenuCategoryNotFoundError extends Error {
  constructor(categoryId: string) {
    super(`Menu category with ID ${categoryId} not found`);
    this.name = 'MenuCategoryNotFoundError';
  }
}

export class MenuItemNotFoundError extends Error {
  constructor(itemId: string) {
    super(`Menu item with ID ${itemId} not found`);
    this.name = 'MenuItemNotFoundError';
  }
}

export class DuplicateMenuItemError extends Error {
  constructor(name: string) {
    super(`Menu item with name "${name}" already exists for this restaurant`);
    this.name = 'DuplicateMenuItemError';
  }
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    correlationId: string;
  };
}

export interface PaginatedMenuItemsResponse {
  items: MenuItemResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MenuCategoriesResponse {
  categories: MenuCategoryResponse[];
}

// Category Import Types
export interface MenuCategoryWithItems {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
  items: ImportableMenuItem[];
}

// Simplified item structure for category import
export interface ImportableMenuItem {
  id: string;
  originalItemId?: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  prepTimeMinutes: number;
  isAvailable: boolean;
  importedAt?: string;
}

export interface CategoriesWithItemsResponse {
  categories: MenuCategoryWithItems[];
}

export interface CategoryImportRequest {
  dayOfWeek: string;
  categoryIds: string[];
}

export interface CategoryImportResponse {
  importedItems: ImportableMenuItem[];
  categoriesProcessed: number;
  itemsImported: number;
  summary: {
    totalCategories: number;
    totalItems: number;
    dayOfWeek: string;
    importTimestamp: string;
  };
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

// Form Data Types (for frontend)
export interface MenuItemFormData {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  isAvailable: boolean;
  prepTimeMinutes: number;
  prepNotes: string;
  allergens: string;
  nutritionalInfo: string;
}

export interface MenuCategoryFormData {
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

export interface MenuItemOptionFormData {
  name: string;
  type: string;
  priceModifier: number;
  isRequired: boolean;
  maxSelections: number;
  displayOrder: number;
}
