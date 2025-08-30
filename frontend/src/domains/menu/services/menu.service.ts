// frontend/src/domains/menu/services/menu.service.ts
// Menu Management Business Service - RestaurantIQ Prep Workflow Focus

import { MenuApiService } from './menu.api.service';
import {
  MenuCategory,
  MenuItem,
  MenuFilters,
  PaginatedMenuItems,
  MenuCategoriesResponse,
  CreateMenuCategoryRequest,
  UpdateMenuCategoryRequest,
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
  MenuPermissions,
  MenuManagementError,
  UserRole
} from '../types';

export class MenuService {
  constructor(
    private readonly menuApiService: MenuApiService,
    private readonly currentUser: { id: string; role: UserRole; restaurantId: string }
  ) {}

  /**
   * Get menu permissions for current user
   * Following existing permission patterns
   */
  getMenuPermissions(): MenuPermissions {
    const role = this.currentUser.role;

    // Define permission matrix based on role hierarchy
    const permissions: Record<UserRole, MenuPermissions> = {
      OWNER: {
        canViewMenu: true,
        canManageMenu: true,
        canManageCategories: true,
        canToggleAvailability: true
      },
      ADMIN: {
        canViewMenu: true,
        canManageMenu: true,
        canManageCategories: true,
        canToggleAvailability: true
      },
      MANAGER: {
        canViewMenu: true,
        canManageMenu: true,
        canManageCategories: true,
        canToggleAvailability: true
      },
      STAFF: {
        canViewMenu: true,
        canManageMenu: false,
        canManageCategories: false,
        canToggleAvailability: true
      },
      GUEST: {
        canViewMenu: false,
        canManageMenu: false,
        canManageCategories: false,
        canToggleAvailability: false
      }
    };

    return permissions[role] || permissions.GUEST;
  }

  /**
   * Check if current user can view menu
   */
  private checkViewMenuPermission(): void {
    const permissions = this.getMenuPermissions();

    if (!permissions.canViewMenu) {
      throw new MenuManagementError(
        'Insufficient permissions to view menu',
        'INSUFFICIENT_PERMISSIONS',
        `user-${this.currentUser.id}`
      );
    }
  }

  /**
   * Check if current user can manage menu
   */
  private checkManageMenuPermission(): void {
    const permissions = this.getMenuPermissions();

    if (!permissions.canManageMenu) {
      throw new MenuManagementError(
        'Insufficient permissions to manage menu',
        'INSUFFICIENT_PERMISSIONS',
        `user-${this.currentUser.id}`
      );
    }
  }

  /**
   * Check if current user can manage categories
   */
  private checkManageCategoriesPermission(): void {
    const permissions = this.getMenuPermissions();

    if (!permissions.canManageCategories) {
      throw new MenuManagementError(
        'Insufficient permissions to manage categories',
        'INSUFFICIENT_PERMISSIONS',
        `user-${this.currentUser.id}`
      );
    }
  }

  /**
   * Check if current user can toggle availability
   */
  private checkToggleAvailabilityPermission(): void {
    const permissions = this.getMenuPermissions();

    if (!permissions.canToggleAvailability) {
      throw new MenuManagementError(
        'Insufficient permissions to toggle availability',
        'INSUFFICIENT_PERMISSIONS',
        `user-${this.currentUser.id}`
      );
    }
  }

  /**
   * Load menu categories
   * Following existing service patterns
   */
  async loadCategories(restaurantId: string): Promise<MenuCategoriesResponse> {
    try {
      console.log(`🔍 MenuService.loadCategories`, { restaurantId });

      this.checkViewMenuPermission();

      const response = await this.menuApiService.getCategories(restaurantId);

      console.log(`✅ MenuService.loadCategories success`, {
        categoryCount: response.categories?.length || 'unknown',
        correlationId: `menu-cat-${Date.now()}`
      });

      return response;
    } catch (error) {
      console.error('❌ MenuService.loadCategories failed:', error);
      throw error;
    }
  }

  /**
   * Create a new menu category
   */
  async createCategory(
    restaurantId: string,
    categoryData: CreateMenuCategoryRequest
  ): Promise<MenuCategory> {
    try {
      console.log(`👤 MenuService.createCategory`, {
        restaurantId,
        name: categoryData.name,
        createdBy: this.currentUser.id
      });

      this.checkManageCategoriesPermission();
      this.validateCategoryData(categoryData);

      const category = await this.menuApiService.createCategory(restaurantId, categoryData);

      console.log(`✅ MenuService.createCategory success`, {
        categoryId: category.id,
        name: category.name,
        correlationId: `menu-create-cat-${Date.now()}`
      });

      return category;
    } catch (error) {
      console.error('❌ MenuService.createCategory failed:', error);
      throw error;
    }
  }

  /**
   * Update an existing menu category
   */
  async updateCategory(
    restaurantId: string,
    categoryId: string,
    categoryData: UpdateMenuCategoryRequest
  ): Promise<MenuCategory> {
    try {
      console.log(`🔄 MenuService.updateCategory`, {
        restaurantId,
        categoryId,
        fields: Object.keys(categoryData)
      });

      this.checkManageCategoriesPermission();
      this.validateCategoryUpdateData(categoryData);

      const category = await this.menuApiService.updateCategory(restaurantId, categoryId, categoryData);

      console.log(`✅ MenuService.updateCategory success`, {
        categoryId: category.id,
        name: category.name,
        correlationId: `menu-update-cat-${Date.now()}`
      });

      return category;
    } catch (error) {
      console.error('❌ MenuService.updateCategory failed:', error);
      throw error;
    }
  }

  /**
   * Delete a menu category
   */
  async deleteCategory(restaurantId: string, categoryId: string): Promise<void> {
    try {
      console.log(`🗑️ MenuService.deleteCategory`, { restaurantId, categoryId });

      this.checkManageCategoriesPermission();

      await this.menuApiService.deleteCategory(restaurantId, categoryId);

      console.log(`✅ MenuService.deleteCategory success`, {
        categoryId,
        correlationId: `menu-delete-cat-${Date.now()}`
      });
    } catch (error) {
      console.error('❌ MenuService.deleteCategory failed:', error);
      throw error;
    }
  }

  /**
   * Load menu items with filters and pagination
   */
  async loadItems(
    restaurantId: string,
    filters: MenuFilters = {}
  ): Promise<PaginatedMenuItems> {
    try {
      console.log(`🔍 MenuService.loadItems`, { restaurantId, filters });

      this.checkViewMenuPermission();

      // Set default filters
      const defaultFilters: MenuFilters = {
        page: 1,
        limit: 20,
        ...filters
      };

      const response = await this.menuApiService.getItems(restaurantId, defaultFilters);

      console.log(`✅ MenuService.loadItems success`, {
        itemCount: response.items?.length || 'unknown',
        totalItems: response.pagination?.total || 'unknown',
        correlationId: `menu-items-${Date.now()}`
      });

      return response;
    } catch (error) {
      console.error('❌ MenuService.loadItems failed:', error);
      throw error;
    }
  }

  /**
   * Create a new menu item
   */
  async createItem(
    restaurantId: string,
    itemData: CreateMenuItemRequest
  ): Promise<MenuItem> {
    try {
      console.log(`🍽️ MenuService.createItem`, {
        restaurantId,
        name: itemData.name,
        categoryId: itemData.categoryId,
        createdBy: this.currentUser.id
      });

      this.checkManageMenuPermission();
      this.validateItemData(itemData);

      const item = await this.menuApiService.createItem(restaurantId, itemData);

      console.log(`✅ MenuService.createItem success`, {
        itemId: item.id,
        name: item.name,
        correlationId: `menu-create-item-${Date.now()}`
      });

      return item;
    } catch (error) {
      console.error('❌ MenuService.createItem failed:', error);
      throw error;
    }
  }

  /**
   * Update an existing menu item
   */
  async updateItem(
    restaurantId: string,
    itemId: string,
    itemData: UpdateMenuItemRequest
  ): Promise<MenuItem> {
    try {
      console.log(`🔄 MenuService.updateItem`, {
        restaurantId,
        itemId,
        fields: Object.keys(itemData)
      });

      this.checkManageMenuPermission();
      this.validateItemUpdateData(itemData);

      const item = await this.menuApiService.updateItem(restaurantId, itemId, itemData);

      console.log(`✅ MenuService.updateItem success`, {
        itemId: item.id,
        name: item.name,
        correlationId: `menu-update-item-${Date.now()}`
      });

      return item;
    } catch (error) {
      console.error('❌ MenuService.updateItem failed:', error);
      throw error;
    }
  }

  /**
   * Delete a menu item
   */
  async deleteItem(restaurantId: string, itemId: string): Promise<void> {
    try {
      console.log(`🗑️ MenuService.deleteItem`, { restaurantId, itemId });

      this.checkManageMenuPermission();

      await this.menuApiService.deleteItem(restaurantId, itemId);

      console.log(`✅ MenuService.deleteItem success`, {
        itemId,
        correlationId: `menu-delete-item-${Date.now()}`
      });
    } catch (error) {
      console.error('❌ MenuService.deleteItem failed:', error);
      throw error;
    }
  }

  /**
   * Toggle item availability (quick operational control)
   */
  async toggleAvailability(
    restaurantId: string,
    itemId: string,
    isAvailable: boolean
  ): Promise<MenuItem> {
    try {
      console.log(`🔄 MenuService.toggleAvailability`, {
        restaurantId,
        itemId,
        isAvailable,
        toggledBy: this.currentUser.id
      });

      this.checkToggleAvailabilityPermission();

      const item = await this.menuApiService.toggleAvailability(restaurantId, itemId, isAvailable);

      console.log(`✅ MenuService.toggleAvailability success`, {
        itemId: item.id,
        name: item.name,
        isAvailable: item.isAvailable,
        correlationId: `menu-toggle-${Date.now()}`
      });

      return item;
    } catch (error) {
      console.error('❌ MenuService.toggleAvailability failed:', error);
      throw error;
    }
  }

  /**
   * Search menu items (for prep workflow quick lookup)
   */
  async searchItems(restaurantId: string, query: string): Promise<MenuItem[]> {
    try {
      console.log(`🔍 MenuService.searchItems`, { restaurantId, query });

      this.checkViewMenuPermission();

      if (!query || query.trim().length === 0) {
        throw new MenuManagementError(
          'Search query cannot be empty',
          'INVALID_SEARCH_QUERY',
          `user-${this.currentUser.id}`
        );
      }

      const items = await this.menuApiService.searchItems(restaurantId, query.trim());

      console.log(`✅ MenuService.searchItems success`, {
        query: query.trim(),
        resultCount: items.length,
        correlationId: `menu-search-${Date.now()}`
      });

      return items;
    } catch (error) {
      console.error('❌ MenuService.searchItems failed:', error);
      throw error;
    }
  }

  /**
   * Validate category creation/update data
   */
  private validateCategoryData(data: CreateMenuCategoryRequest): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new MenuManagementError(
        'Category name is required',
        'INVALID_CATEGORY_DATA',
        `user-${this.currentUser.id}`
      );
    }

    if (data.name.length > 50) {
      throw new MenuManagementError(
        'Category name must be 50 characters or less',
        'INVALID_CATEGORY_DATA',
        `user-${this.currentUser.id}`
      );
    }
  }

  /**
   * Validate category update data
   */
  private validateCategoryUpdateData(data: UpdateMenuCategoryRequest): void {
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new MenuManagementError(
          'Category name cannot be empty',
          'INVALID_CATEGORY_DATA',
          `user-${this.currentUser.id}`
        );
      }

      if (data.name.length > 50) {
        throw new MenuManagementError(
          'Category name must be 50 characters or less',
          'INVALID_CATEGORY_DATA',
          `user-${this.currentUser.id}`
        );
      }
    }
  }

  /**
   * Validate item creation/update data
   */
  private validateItemData(data: CreateMenuItemRequest): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new MenuManagementError(
        'Item name is required',
        'INVALID_ITEM_DATA',
        `user-${this.currentUser.id}`
      );
    }

    if (!data.categoryId || data.categoryId.trim().length === 0) {
      throw new MenuManagementError(
        'Category ID is required',
        'INVALID_ITEM_DATA',
        `user-${this.currentUser.id}`
      );
    }

    if (data.name.length > 100) {
      throw new MenuManagementError(
        'Item name must be 100 characters or less',
        'INVALID_ITEM_DATA',
        `user-${this.currentUser.id}`
      );
    }

    if (data.prepTimeMinutes < 0 || data.prepTimeMinutes > 120) {
      throw new MenuManagementError(
        'Prep time must be between 0 and 120 minutes',
        'INVALID_ITEM_DATA',
        `user-${this.currentUser.id}`
      );
    }
  }

  /**
   * Validate item update data
   */
  private validateItemUpdateData(data: UpdateMenuItemRequest): void {
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new MenuManagementError(
          'Item name cannot be empty',
          'INVALID_ITEM_DATA',
          `user-${this.currentUser.id}`
        );
      }

      if (data.name.length > 100) {
        throw new MenuManagementError(
          'Item name must be 100 characters or less',
          'INVALID_ITEM_DATA',
          `user-${this.currentUser.id}`
        );
      }
    }

    if (data.prepTimeMinutes !== undefined) {
      if (data.prepTimeMinutes < 0 || data.prepTimeMinutes > 120) {
        throw new MenuManagementError(
          'Prep time must be between 0 and 120 minutes',
          'INVALID_ITEM_DATA',
          `user-${this.currentUser.id}`
        );
      }
    }
  }
}
