import { Router } from 'express';
import { MenuService } from '../../../domains/menu/services/menu.service';
import { authenticate, authorizeRestaurantAccess, requirePermission } from '../../../domains/auth/middleware/auth.middleware';
import { BusinessError } from '../../../lib/errors/specific-errors';
import { CategoryImportRequest, ConflictResolution } from '../../../domains/menu/types';

// MANDATORY: mergeParams: true to inherit restaurantId from parent router
const router = Router({ mergeParams: true });

// MANDATORY: Middleware chain
router.use(authenticate());
router.use(authorizeRestaurantAccess());

// GET /api/v1/restaurants/:restaurantId/menu/categories - List categories
router.get('/categories', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const menuService = req.container.resolve('menuService') as MenuService;

    const result = await menuService.getCategories(restaurantId);

    res.json({
      success: true,
      data: result,
      correlationId: req.correlationId
    });
  } catch (error) {
    const statusCode = error instanceof BusinessError ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: error instanceof BusinessError ? error.name : 'MENU_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get menu categories',
        correlationId: req.correlationId
      }
    });
  }
});

// POST /api/v1/restaurants/:restaurantId/menu/categories - Create category
router.post('/categories', requirePermission('menu.create'), async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const menuService = req.container.resolve('menuService') as MenuService;

    // Validate required fields
    const { name, description } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Category name is required and must be a non-empty string',
          correlationId: req.correlationId
        }
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Category name must be 100 characters or less',
          correlationId: req.correlationId
        }
      });
    }

    const categoryData = {
      restaurantId,
      name: name.trim(),
      description: description?.trim() || null
    };

    const category = await menuService.createCategory(categoryData);

    res.status(201).json({
      success: true,
      data: { category },
      correlationId: req.correlationId
    });
  } catch (error) {
    const statusCode = error instanceof BusinessError ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: error instanceof BusinessError ? error.name : 'MENU_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create menu category',
        correlationId: req.correlationId
      }
    });
  }
});

// GET /api/v1/restaurants/:restaurantId/menu/categories/:categoryId - Get category
router.get('/categories/:categoryId', async (req, res) => {
  try {
    const { restaurantId, categoryId } = req.params;
    const menuService = req.container.resolve('menuService') as MenuService;

    // Validate category belongs to restaurant
    const category = await menuService.getCategoryById(categoryId);

    res.json({
      success: true,
      data: { category },
      correlationId: req.correlationId
    });
  } catch (error) {
    const statusCode = error instanceof BusinessError ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: error instanceof BusinessError ? error.name : 'MENU_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get menu category',
        correlationId: req.correlationId
      }
    });
  }
});

// PUT /api/v1/restaurants/:restaurantId/menu/categories/:categoryId - Update category
router.put('/categories/:categoryId', requirePermission('menu.update'), async (req, res) => {
  try {
    const { categoryId } = req.params;
    const menuService = req.container.resolve('menuService') as MenuService;

    const category = await menuService.updateCategory(categoryId, req.body);

    res.json({
      success: true,
      data: { category },
      correlationId: req.correlationId
    });
  } catch (error) {
    const statusCode = error instanceof BusinessError ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: error instanceof BusinessError ? error.name : 'MENU_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update menu category',
        correlationId: req.correlationId
      }
    });
  }
});

// DELETE /api/v1/restaurants/:restaurantId/menu/categories/:categoryId - Delete category
router.delete('/categories/:categoryId', requirePermission('menu.delete'), async (req, res) => {
  try {
    const { categoryId } = req.params;
    const menuCategoryRepository = req.container.resolve('menuCategoryRepository');

    await menuCategoryRepository.delete(categoryId);

    res.json({
      success: true,
      data: { message: 'Menu category deleted successfully' },
      correlationId: req.correlationId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'MENU_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete menu category',
        correlationId: req.correlationId
      }
    });
  }
});

// GET /api/v1/restaurants/:restaurantId/menu/items - List all items with categories
router.get('/items', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const menuService = req.container.resolve('menuService') as MenuService;

    const result = await menuService.getAllItems(
      restaurantId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result,
      correlationId: req.correlationId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'MENU_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get menu items',
        correlationId: req.correlationId
      }
    });
  }
});

// POST /api/v1/restaurants/:restaurantId/menu/items - Create item
router.post('/items', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const menuService = req.container.resolve('menuService') as MenuService;

    // Validate required fields (simplified for brain/logic system)
    const { name, categoryId } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Item name is required and must be a non-empty string',
          correlationId: req.correlationId
        }
      });
    }

    if (!categoryId || typeof categoryId !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Category ID is required and must be a valid string',
          correlationId: req.correlationId
        }
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Item name must be 100 characters or less',
          correlationId: req.correlationId
        }
      });
    }

    const itemData = {
      restaurantId,
      name: name.trim(),
      categoryId: categoryId.trim(),
      // Simplified for brain/logic system - only name and category
      description: null,
      price: 0, // Default for brain system
      imageUrl: null,
      isAvailable: true,
      prepTimeMinutes: 0,
      prepNotes: null,
      allergens: null,
      nutritionalInfo: null
    };

    const item = await menuService.createItem(itemData);

    res.status(201).json({
      success: true,
      data: { item },
      correlationId: req.correlationId
    });
  } catch (error) {
    const statusCode = error instanceof BusinessError ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: error instanceof BusinessError ? error.name : 'MENU_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create menu item',
        correlationId: req.correlationId
      }
    });
  }
});

// GET /api/v1/restaurants/:restaurantId/menu/items/:itemId - Get specific item with options
router.get('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const menuItemRepository = req.container.resolve('menuItemRepository');

    const item = await menuItemRepository.findById(itemId);

    res.json({
      success: true,
      data: { item },
      correlationId: req.correlationId
    });
  } catch (error) {
    const statusCode = error instanceof BusinessError ? 400 : 404;
    res.status(statusCode).json({
      success: false,
      error: {
        code: error instanceof BusinessError ? error.name : 'ITEM_NOT_FOUND',
        message: error instanceof Error ? error.message : 'Menu item not found',
        correlationId: req.correlationId
      }
    });
  }
});

// PUT /api/v1/restaurants/:restaurantId/menu/items/:itemId - Update item
router.put('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const menuService = req.container.resolve('menuService') as MenuService;

    // Validate input if provided
    const updates: any = {};
    if (req.body.name !== undefined) {
      if (!req.body.name || typeof req.body.name !== 'string' || req.body.name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Item name must be a non-empty string',
            correlationId: req.correlationId
          }
        });
      }
      if (req.body.name.length > 100) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Item name must be 100 characters or less',
            correlationId: req.correlationId
          }
        });
      }
      updates.name = req.body.name.trim();
    }

    if (req.body.price !== undefined) {
      if (typeof req.body.price !== 'number' || req.body.price <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Item price must be a positive number',
            correlationId: req.correlationId
          }
        });
      }
      updates.price = Number(req.body.price);
    }

    // Copy other optional fields with validation
    if (req.body.description !== undefined) {
      updates.description = req.body.description?.trim() || null;
    }
    if (req.body.imageUrl !== undefined) {
      updates.imageUrl = req.body.imageUrl?.trim() || null;
    }
    if (req.body.isAvailable !== undefined) {
      updates.isAvailable = Boolean(req.body.isAvailable);
    }
    if (req.body.prepTimeMinutes !== undefined) {
      updates.prepTimeMinutes = Number(req.body.prepTimeMinutes) || 0;
    }
    if (req.body.prepNotes !== undefined) {
      updates.prepNotes = req.body.prepNotes?.trim() || null;
    }
    if (req.body.allergens !== undefined) {
      updates.allergens = req.body.allergens?.trim() || null;
    }
    if (req.body.nutritionalInfo !== undefined) {
      updates.nutritionalInfo = req.body.nutritionalInfo?.trim() || null;
    }

    const item = await menuService.updateItem(itemId, updates);

    res.json({
      success: true,
      data: { item },
      correlationId: req.correlationId
    });
  } catch (error) {
    const statusCode = error instanceof BusinessError ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: error instanceof BusinessError ? error.name : 'MENU_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update menu item',
        correlationId: req.correlationId
      }
    });
  }
});

// DELETE /api/v1/restaurants/:restaurantId/menu/items/:itemId - Delete item
router.delete('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const menuItemRepository = req.container.resolve('menuItemRepository');

    await menuItemRepository.delete(itemId);

    res.json({
      success: true,
      data: { message: 'Menu item deleted successfully' },
      correlationId: req.correlationId
    });
  } catch (error) {
    const statusCode = error instanceof BusinessError ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: error instanceof BusinessError ? error.name : 'MENU_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete menu item',
        correlationId: req.correlationId
      }
    });
  }
});

// PUT /api/v1/restaurants/:restaurantId/menu/items/:itemId/availability - Toggle availability
router.put('/items/:itemId/availability', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { isAvailable } = req.body;
    const menuService = req.container.resolve('menuService') as MenuService;

    // Validate isAvailable
    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'isAvailable must be a boolean value',
          correlationId: req.correlationId
        }
      });
    }

    const item = await menuService.updateItemAvailability(itemId, isAvailable);

    res.json({
      success: true,
      data: { item },
      correlationId: req.correlationId
    });
  } catch (error) {
    const statusCode = error instanceof BusinessError ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: error instanceof BusinessError ? error.name : 'MENU_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update item availability',
        correlationId: req.correlationId
      }
    });
  }
});

// GET /api/v1/restaurants/:restaurantId/menu/items/:itemId/options - List item options
router.get('/items/:itemId/options', async (req, res) => {
  try {
    const { itemId } = req.params;
    const menuService = req.container.resolve('menuService') as MenuService;

    const options = await menuService.getItemOptions(itemId);

    res.json({
      success: true,
      data: { options },
      correlationId: req.correlationId
    });
  } catch (error) {
    const statusCode = error instanceof BusinessError ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: error instanceof BusinessError ? error.name : 'MENU_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get item options',
        correlationId: req.correlationId
      }
    });
  }
});

// POST /api/v1/restaurants/:restaurantId/menu/items/:itemId/options - Create item option
router.post('/items/:itemId/options', async (req, res) => {
  try {
    const { itemId } = req.params;
    const menuService = req.container.resolve('menuService') as MenuService;

    // Validate required fields
    const { name, type } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Option name is required and must be a non-empty string',
          correlationId: req.correlationId
        }
      });
    }

    if (!type || typeof type !== 'string' || !['size', 'topping', 'side'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Option type is required and must be one of: size, topping, side',
          correlationId: req.correlationId
        }
      });
    }

    if (name.length > 50) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Option name must be 50 characters or less',
          correlationId: req.correlationId
        }
      });
    }

    const optionData = {
      menuItemId: itemId,
      name: name.trim(),
      type: type.trim(),
      priceModifier: req.body.priceModifier ?? 0,
      isRequired: req.body.isRequired ?? false,
      maxSelections: req.body.maxSelections ?? 1,
      displayOrder: req.body.displayOrder ?? 0
    };

    const option = await menuService.createItemOption(optionData);

    res.status(201).json({
      success: true,
      data: { option },
      correlationId: req.correlationId
    });
  } catch (error) {
    const statusCode = error instanceof BusinessError ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: error instanceof BusinessError ? error.name : 'MENU_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create item option',
        correlationId: req.correlationId
      }
    });
  }
});

// GET /api/v1/restaurants/:restaurantId/menu/search?query=:term - Search items and categories
router.get('/search', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { query } = req.query;
    const menuService = req.container.resolve('menuService') as MenuService;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Search query is required and must be a string',
          correlationId: req.correlationId
        }
      });
    }

    if (query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Search query cannot be empty',
          correlationId: req.correlationId
        }
      });
    }

    if (query.length > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Search query must be 100 characters or less',
          correlationId: req.correlationId
        }
      });
    }

    const items = await menuService.searchItems(restaurantId, query.trim());

    res.json({
      success: true,
      data: { items },
      correlationId: req.correlationId
    });
  } catch (error) {
    const statusCode = error instanceof BusinessError ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: error instanceof BusinessError ? error.name : 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to search menu',
        correlationId: req.correlationId
      }
    });
  }
});





// POST /api/v1/restaurants/:restaurantId/menu/weekly-menus/detect-conflicts - Detect import conflicts
router.post('/weekly-menus/detect-conflicts', authenticate(), authorizeRestaurantAccess(), async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { dayOfWeek, categoryIds } = req.body as { dayOfWeek: string; categoryIds: string[] };
    const menuService = req.container.resolve<MenuService>('menuService');

    // Validate required fields
    if (!dayOfWeek || typeof dayOfWeek !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'dayOfWeek is required and must be a string',
          correlationId: req.correlationId
        }
      });
    }

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'categoryIds must be a non-empty array',
          correlationId: req.correlationId
        }
      });
    }

    const result = await menuService.detectImportConflicts(restaurantId, dayOfWeek, categoryIds);

    res.json({
      success: true,
      data: result,
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/restaurants/:restaurantId/menu/weekly-menus/resolve-conflicts - Resolve import conflicts
router.post('/weekly-menus/resolve-conflicts', authenticate(), authorizeRestaurantAccess(), async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { dayOfWeek, conflictResolutions } = req.body as { dayOfWeek: string; conflictResolutions: ConflictResolution[] };
    const menuService = req.container.resolve<MenuService>('menuService');

    // Validate required fields
    if (!dayOfWeek || typeof dayOfWeek !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'dayOfWeek is required and must be a string',
          correlationId: req.correlationId
        }
      });
    }

    if (!conflictResolutions || !Array.isArray(conflictResolutions)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'conflictResolutions must be an array',
          correlationId: req.correlationId
        }
      });
    }

    const result = await menuService.resolveImportConflicts(restaurantId, dayOfWeek, conflictResolutions);

    res.json({
      success: true,
      data: result,
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/restaurants/:restaurantId/menu/categories/with-items - Get categories with items for import
router.get('/categories/with-items', authenticate(), authorizeRestaurantAccess(), async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const menuService = req.container.resolve<MenuService>('menuService');
    
    const result = await menuService.getCategoriesWithItems(restaurantId);
    
    res.json({
      success: true,
      data: result,
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/restaurants/:restaurantId/menu/weekly-menus/import-categories - Import categories to weekly menu
router.post('/weekly-menus/import-categories', authenticate(), authorizeRestaurantAccess(), async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { dayOfWeek, categoryIds } = req.body as CategoryImportRequest;
    
    // Validation
    if (!dayOfWeek || typeof dayOfWeek !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'dayOfWeek is required and must be a string',
          correlationId: req.correlationId
        }
      });
    }

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'categoryIds must be a non-empty array',
          correlationId: req.correlationId
        }
      });
    }

    const menuService = req.container.resolve<MenuService>('menuService');
    const result = await menuService.importCategoriesWithItems(restaurantId, { dayOfWeek, categoryIds });
    
    res.json({
      success: true,
      data: result,
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
});

export default router;
