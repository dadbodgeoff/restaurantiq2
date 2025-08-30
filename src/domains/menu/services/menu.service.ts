import { MenuItemRepository } from '../repositories/menu-item.repository';
import { MenuCategoryRepository } from '../repositories/menu-category.repository';
import { LoggerService } from '../../../infrastructure/logging/logger.service';
import { BusinessRuleError } from '../../../lib/errors/specific-errors';
import {
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
  CreateMenuCategoryRequest,
  UpdateMenuCategoryRequest,
  CreateMenuItemOptionRequest,
  UpdateMenuItemOptionRequest,
  MenuCategoryNotFoundError,
  MenuItemNotFoundError,
  DuplicateMenuItemError,
  ApiResponse,
  MenuCategoriesResponse,
  PaginatedMenuItemsResponse,
  SearchMenuResponse,
  CategoriesWithItemsResponse,
  CategoryImportRequest,
  CategoryImportResponse,
  MenuCategoryWithItems,
  ImportableMenuItem,
  ConflictDetectionResponse,
  ConflictResolution,
  ConflictResolutionResponse,
  ImportConflict
} from '../types';

export class MenuService {
  constructor(
    private menuItemRepository: MenuItemRepository,
    private menuCategoryRepository: MenuCategoryRepository,
    private logger: LoggerService
  ) {}

  // MANDATORY: Error handling pattern
  async createItem(data: CreateMenuItemRequest) {
    try {
      this.logger.info('createItem', 'Creating menu item', {
        name: data.name,
        restaurantId: data.restaurantId
      });

      const validatedData = this.validateCreateMenuItemData(data);

      // Check if category exists
      await this.validateCategoryExists(validatedData.categoryId);

      // Check for duplicate name within restaurant
      await this.checkDuplicateItemName(validatedData.restaurantId, validatedData.name);

      const item = await this.menuItemRepository.create({
        ...validatedData,
        price: validatedData.price ?? 0
      });

      this.logger.info('createItem', 'Menu item created successfully', {
        itemId: item.id,
        name: item.name
      });

      return item;
    } catch (error) {
      this.logger.error('createItem', error, {
        name: data.name,
        restaurantId: data.restaurantId
      });
      throw error;
    }
  }

  async updateItem(id: string, data: UpdateMenuItemRequest) {
    try {
      this.logger.info('updateItem', 'Updating menu item', { id, fields: Object.keys(data) });

      // Check if item exists
      const existingItem = await this.menuItemRepository.findById(id);
      if (!existingItem) {
        throw new MenuItemNotFoundError(id);
      }

      // If name is being updated, check for duplicates
      if (data.name && data.name !== existingItem.name) {
        await this.checkDuplicateItemName(existingItem.restaurantId, data.name);
      }

      const updatedItem = await this.menuItemRepository.update(id, data);

      this.logger.info('updateItem', 'Menu item updated successfully', {
        itemId: id,
        updatedFields: Object.keys(data)
      });

      return updatedItem;
    } catch (error) {
      this.logger.error('updateItem', error, { id, fields: Object.keys(data) });
      throw error;
    }
  }

  async updateItemAvailability(itemId: string, isAvailable: boolean) {
    try {
      this.logger.info('updateItemAvailability', 'Updating item availability', {
        itemId,
        isAvailable
      });

      const item = await this.menuItemRepository.updateAvailability(itemId, isAvailable);

      this.logger.info('updateItemAvailability', 'Item availability updated', {
        itemId,
        name: item.name,
        isAvailable
      });

      return item;
    } catch (error) {
      this.logger.error('updateItemAvailability', error, { itemId, isAvailable });
      throw error;
    }
  }

  async searchItems(restaurantId: string, query: string) {
    try {
      this.logger.info('searchItems', 'Searching menu items', { restaurantId, query });

      return await this.menuItemRepository.searchItems(restaurantId, query);
    } catch (error) {
      this.logger.error('searchItems', error, { restaurantId, query });
      throw error;
    }
  }

  async getItemsByCategory(categoryId: string) {
    try {
      this.logger.info('getItemsByCategory', 'Getting items by category', { categoryId });

      return await this.menuItemRepository.findByCategory(categoryId);
    } catch (error) {
      this.logger.error('getItemsByCategory', error, { categoryId });
      throw error;
    }
  }

  async getAllItems(restaurantId: string, page: number = 1, limit: number = 20) {
    try {
      this.logger.info('getAllItems', 'Getting all menu items', { restaurantId, page, limit });

      const offset = (page - 1) * limit;
      const items = await this.menuItemRepository.findByRestaurantId(restaurantId);
      const total = items.length;
      const paginatedItems = items.slice(offset, offset + limit);
      const totalPages = Math.ceil(total / limit);

      return {
        items: paginatedItems,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      this.logger.error('getAllItems', error, { restaurantId, page, limit });
      throw error;
    }
  }

  // Menu Category Methods
  async createCategory(data: CreateMenuCategoryRequest) {
    try {
      this.logger.info('createCategory', 'Creating menu category', {
        name: data.name,
        restaurantId: data.restaurantId
      });

      const validatedData = this.validateCreateMenuCategoryData(data);

      // Check if category name already exists for this restaurant
      await this.checkDuplicateCategoryName(validatedData.restaurantId, validatedData.name);

      const category = await this.menuCategoryRepository.create(validatedData);

      this.logger.info('createCategory', 'Menu category created successfully', {
        categoryId: category.id,
        name: category.name
      });

      return category;
    } catch (error) {
      this.logger.error('createCategory', error, {
        name: data.name,
        restaurantId: data.restaurantId
      });
      throw error;
    }
  }

  async getCategoryById(categoryId: string) {
    try {
      this.logger.info('getCategoryById', 'Getting menu category by ID', { categoryId });

      const category = await this.menuCategoryRepository.findById(categoryId);
      if (!category) {
        throw new MenuCategoryNotFoundError(categoryId);
      }

      return category;
    } catch (error) {
      this.logger.error('getCategoryById', error, { categoryId });
      throw error;
    }
  }

  async getCategories(restaurantId: string) {
    try {
      this.logger.info('getCategories', 'Getting menu categories', { restaurantId });

      const categories = await this.menuCategoryRepository.findByRestaurantId(restaurantId);

      return { categories };
    } catch (error) {
      this.logger.error('getCategories', error, { restaurantId });
      throw error;
    }
  }

  async updateCategory(id: string, data: UpdateMenuCategoryRequest) {
    try {
      this.logger.info('updateCategory', 'Updating menu category', { id, fields: Object.keys(data) });

      const category = await this.menuCategoryRepository.update(id, data);

      this.logger.info('updateCategory', 'Menu category updated successfully', {
        categoryId: id,
        updatedFields: Object.keys(data)
      });

      return category;
    } catch (error) {
      this.logger.error('updateCategory', error, { id, fields: Object.keys(data) });
      throw error;
    }
  }

  // Menu Item Options Methods
  async getItemOptions(itemId: string) {
    try {
      this.logger.info('getItemOptions', 'Getting item options', { itemId });

      return await this.menuItemRepository.findItemOptions(itemId);
    } catch (error) {
      this.logger.error('getItemOptions', error, { itemId });
      throw error;
    }
  }

  async createItemOption(data: CreateMenuItemOptionRequest) {
    try {
      this.logger.info('createItemOption', 'Creating menu item option', {
        menuItemId: data.menuItemId,
        name: data.name
      });

      const validatedData = this.validateCreateMenuItemOptionData(data);
      const option = await this.menuItemRepository.createItemOption(validatedData);

      this.logger.info('createItemOption', 'Menu item option created successfully', {
        optionId: option.id,
        name: option.name
      });

      return option;
    } catch (error) {
      this.logger.error('createItemOption', error, {
        menuItemId: data.menuItemId,
        name: data.name
      });
      throw error;
    }
  }

  // Private validation methods
  private validateCreateMenuItemData(data: CreateMenuItemRequest) {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Menu item name is required');
    }

    if (!data.categoryId || data.categoryId.trim().length === 0) {
      throw new Error('Category ID is required');
    }

    return {
      ...data,
      name: data.name.trim(),
      categoryId: data.categoryId.trim()
    };
  }

  private validateCreateMenuCategoryData(data: CreateMenuCategoryRequest) {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Menu category name is required');
    }

    return {
      ...data,
      name: data.name.trim(),
      description: data.description?.trim() || null
    };
  }

  private validateCreateMenuItemOptionData(data: CreateMenuItemOptionRequest) {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Menu item option name is required');
    }

    return {
      ...data,
      name: data.name.trim()
    };
  }

  private async validateCategoryExists(categoryId: string) {
    const category = await this.menuCategoryRepository.findById(categoryId);
    if (!category) {
      throw new MenuCategoryNotFoundError(categoryId);
    }
  }

  private async checkDuplicateItemName(restaurantId: string, name: string) {
    // This would require a custom query to check uniqueness
    // For now, we'll let the database constraint handle it
    return true;
  }

  private async checkDuplicateCategoryName(restaurantId: string, name: string) {
    // Check if category name already exists for this restaurant
    const existingCategories = await this.menuCategoryRepository.findByRestaurantId(restaurantId);
    const duplicate = existingCategories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      throw new BusinessRuleError(`Category name "${name}" already exists for this restaurant`, 'DUPLICATE_CATEGORY_NAME');
    }
  }

  // Regular Categories Method (with item counts)
  async getCategories(restaurantId: string) {
    try {
      this.logger.info('getCategories', 'Fetching categories for restaurant', {
        restaurantId
      });

      const categories = await this.menuCategoryRepository.findByRestaurantId(restaurantId);

      // Transform to include item count for UI display
      const categoriesWithCounts = categories.map(category => ({
        ...category,
        itemCount: category.items?.length || 0
      }));

      this.logger.info('getCategories', 'Categories fetched successfully', {
        restaurantId,
        categoryCount: categoriesWithCounts.length,
        totalItems: categoriesWithCounts.reduce((sum, cat) => sum + cat.itemCount, 0)
      });

      return { categories: categoriesWithCounts };
    } catch (error) {
      this.logger.error('getCategories', error, { restaurantId });
      throw error;
    }
  }

  // Category Import Methods
  async getCategoriesWithItems(restaurantId: string): Promise<CategoriesWithItemsResponse> {
    try {
      this.logger.info('getCategoriesWithItems', 'Fetching categories with items', {
        restaurantId
      });

      const categories = await this.menuCategoryRepository.findWithItems(restaurantId);

      // Transform to include item count
      const categoriesWithItems: MenuCategoryWithItems[] = categories.map(category => ({
        ...category,
        itemCount: category.items?.length || 0,
        items: category.items as ImportableMenuItem[]
      }));

      this.logger.info('getCategoriesWithItems', 'Categories with items fetched successfully', {
        restaurantId,
        categoryCount: categoriesWithItems.length
      });

      return { categories: categoriesWithItems };
    } catch (error) {
      this.logger.error('getCategoriesWithItems', error, { restaurantId });
      throw error;
    }
  }

  async importCategoriesWithItems(
    restaurantId: string,
    request: CategoryImportRequest
  ): Promise<CategoryImportResponse> {
    try {
      this.logger.info('importCategoriesWithItems', 'Importing categories with items', {
        restaurantId,
        dayOfWeek: request.dayOfWeek,
        categoryCount: request.categoryIds.length
      });

      // Validate dayOfWeek
      const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
      if (!validDays.includes(request.dayOfWeek)) {
        throw new BusinessRuleError(`Invalid dayOfWeek: ${request.dayOfWeek}`, 'INVALID_DAY_OF_WEEK');
      }

      // Get categories with their items
      const categories = await this.menuCategoryRepository.findManyWithItems(restaurantId, request.categoryIds);

      // Transform items for weekly menu format
      const importedItems: ImportableMenuItem[] = [];

      categories.forEach(category => {
        category.items.forEach(item => {
          importedItems.push({
            id: `imported-${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            originalItemId: item.id,
            name: item.name,
            description: item.description,
            categoryId: category.id,
            categoryName: category.name,
            prepTimeMinutes: item.prepTimeMinutes,
            isAvailable: item.isAvailable,
            importedAt: new Date().toISOString()
          });
        });
      });

      this.logger.info('importCategoriesWithItems', 'Categories imported successfully', {
        restaurantId,
        dayOfWeek: request.dayOfWeek,
        categoriesProcessed: categories.length,
        itemsImported: importedItems.length
      });

      return {
        importedItems,
        categoriesProcessed: categories.length,
        itemsImported: importedItems.length,
        summary: {
          totalCategories: categories.length,
          totalItems: importedItems.length,
          dayOfWeek: request.dayOfWeek,
          importTimestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('importCategoriesWithItems', error, {
        restaurantId,
        dayOfWeek: request.dayOfWeek
      });
      throw error;
    }
  }

  // Conflict Resolution Methods
  async detectImportConflicts(
    restaurantId: string,
    dayOfWeek: string,
    categoryIds: string[]
  ): Promise<ConflictDetectionResponse> {
    try {
      this.logger.info('detectImportConflicts', 'Detecting import conflicts', {
        restaurantId,
        dayOfWeek,
        categoryCount: categoryIds.length
      });

      // Get categories with items to be imported
      const categories = await this.menuCategoryRepository.findManyWithItems(restaurantId, categoryIds);

      // For now, we'll simulate existing weekly menu items
      // In a full implementation, this would query the weekly menu table
      const existingWeeklyMenu: { name: string; categoryName: string }[] = [];

      const conflicts: ImportConflict[] = [];
      const safeItems: ImportableMenuItem[] = [];

      categories.forEach(category => {
        category.items.forEach(item => {
          const existingItem = existingWeeklyMenu.find(
            existing => existing.name.toLowerCase() === item.name.toLowerCase()
          );

          if (existingItem) {
            conflicts.push({
              itemId: item.id,
              itemName: item.name,
              categoryName: category.name,
              conflictType: 'DUPLICATE_NAME',
              existingItem: {
                id: 'existing-' + item.id, // Placeholder
                name: existingItem.name,
                categoryName: existingItem.categoryName
              }
            });
          } else {
            safeItems.push({
              id: `safe-${item.id}`,
              originalItemId: item.id,
              name: item.name,
              description: item.description,
              categoryId: category.id,
              categoryName: category.name,
              prepTimeMinutes: item.prepTimeMinutes,
              isAvailable: item.isAvailable
            });
          }
        });
      });

      const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);

      this.logger.info('detectImportConflicts', 'Conflict detection completed', {
        restaurantId,
        dayOfWeek,
        totalItems,
        conflictCount: conflicts.length,
        safeCount: safeItems.length
      });

      return {
        hasConflicts: conflicts.length > 0,
        conflicts,
        safeItems,
        summary: {
          totalItems,
          conflictCount: conflicts.length,
          safeCount: safeItems.length
        }
      };
    } catch (error) {
      this.logger.error('detectImportConflicts', error as Error, { restaurantId, dayOfWeek });
      throw error;
    }
  }

  async resolveImportConflicts(
    restaurantId: string,
    dayOfWeek: string,
    conflictResolutions: ConflictResolution[]
  ): Promise<ConflictResolutionResponse> {
    try {
      this.logger.info('resolveImportConflicts', 'Resolving import conflicts', {
        restaurantId,
        dayOfWeek,
        resolutionCount: conflictResolutions.length
      });

      const resolvedConflicts: ConflictResolution[] = [];
      const importedItems: ImportableMenuItem[] = [];
      const skippedItems: ImportConflict[] = [];

      for (const resolution of conflictResolutions) {
        resolvedConflicts.push(resolution);

        if (resolution.action === 'SKIP') {
          // Add to skipped items (we'd need to track original conflict data)
          skippedItems.push({
            itemId: resolution.conflictId,
            itemName: 'Unknown', // Would need original conflict data
            categoryName: 'Unknown',
            conflictType: 'DUPLICATE_NAME'
          });
        } else if (resolution.action === 'REPLACE' || resolution.action === 'RENAME') {
          // Create importable item based on resolution
          const itemName = resolution.action === 'RENAME' && resolution.newName
            ? resolution.newName
            : 'Unknown'; // Would need original item data

          importedItems.push({
            id: `resolved-${resolution.conflictId}-${Date.now()}`,
            originalItemId: resolution.conflictId,
            name: itemName,
            categoryId: 'resolved-category', // Would need original data
            categoryName: 'Resolved Category',
            prepTimeMinutes: 0,
            isAvailable: true,
            importedAt: new Date().toISOString()
          });
        }
      }

      this.logger.info('resolveImportConflicts', 'Conflict resolution completed', {
        restaurantId,
        dayOfWeek,
        totalResolved: resolvedConflicts.length,
        totalImported: importedItems.length,
        totalSkipped: skippedItems.length
      });

      return {
        resolvedConflicts,
        importedItems,
        skippedItems,
        summary: {
          totalResolved: resolvedConflicts.length,
          totalImported: importedItems.length,
          totalSkipped: skippedItems.length
        }
      };
    } catch (error) {
      this.logger.error('resolveImportConflicts', error as Error, {
        restaurantId,
        dayOfWeek
      });
      throw error;
    }
  }
}
