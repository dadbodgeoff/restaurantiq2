import { Router } from 'express';
import { authenticate, authorizeRestaurantAccess } from '../../../domains/auth/middleware/auth.middleware';
import { Permissions } from '../../../domains/shared/types/permissions';
import { requirePermission } from '../../../domains/auth/middleware/auth.middleware';
import { MenuService } from '../../../domains/menu/services/menu.service';

const router = Router();

// ==========================================
// MENU MANAGEMENT ENDPOINTS - REAL DATABASE INTEGRATION
// ==========================================

// GET /api/v1/restaurants/:restaurantId/menu
// Get all menu items for a restaurant
router.get('/restaurants/:restaurantId/menu',
  authenticate(),
  authorizeRestaurantAccess(),
  requirePermission(Permissions.MENU_READ),
  async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const { category, isActive = 'true' } = req.query;

      // ✅ REAL SERVICE CALL - Following your menu.module.ts pattern
      const menuService = req.container.resolve('menuService') as MenuService;

      const result = await menuService.getMenuItems(restaurantId, {
        category: category as string,
        isActive: isActive === 'true'
      });

      res.json({
        success: true,
        data: {
          menuItems: result.items,
          count: result.items.length,
          pagination: result.pagination,
          filters: {
            category: category || null,
            isActive: isActive === 'true'
          }
        },
        message: 'Menu items retrieved successfully from database',
        correlationId: req.correlationId
      });
    } catch (error) {
      throw error;
    }
  }
);

// POST /api/v1/restaurants/:restaurantId/menu
// Create a new menu item
router.post('/restaurants/:restaurantId/menu',
  authenticate(),
  authorizeRestaurantAccess(),
  requirePermission(Permissions.MENU_CREATE),
  async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const {
        name,
        description,
        category,
        unit = 'each',
        unitCost,
        sellingPrice,
        isActive = true
      } = req.body;

      if (!name || !category || sellingPrice === undefined) {
        throw new Error('Name, category, and selling price are required');
      }

      // ✅ REAL SERVICE CALL - No more mock data
      const menuService = req.container.resolve('menuService') as MenuService;

      const menuItem = await menuService.createMenuItem(restaurantId, {
        name,
        description,
        category,
        unit,
        unitCost,
        sellingPrice,
        isActive
      });

      res.status(201).json({
        success: true,
        data: {
          menuItem
        },
        message: 'Menu item created successfully in database',
        correlationId: req.correlationId
      });
    } catch (error) {
      throw error;
    }
  }
);

// GET /api/v1/restaurants/:restaurantId/menu/:menuItemId
// Get specific menu item
router.get('/restaurants/:restaurantId/menu/:menuItemId',
  authenticate(),
  authorizeRestaurantAccess(),
  requirePermission(Permissions.MENU_READ),
  async (req, res) => {
    try {
      const { restaurantId, menuItemId } = req.params;

      // ✅ REAL SERVICE CALL
      const menuService = req.container.resolve('menuService') as MenuService;

      const menuItem = await menuService.getMenuItemById(restaurantId, menuItemId);

      if (!menuItem) {
        throw new Error('Menu item not found');
      }

      res.json({
        success: true,
        data: {
          menuItem
        },
        message: 'Menu item retrieved successfully from database',
        correlationId: req.correlationId
      });
    } catch (error) {
      throw error;
    }
  }
);

// PUT /api/v1/restaurants/:restaurantId/menu/:menuItemId
// Update menu item
router.put('/restaurants/:restaurantId/menu/:menuItemId',
  authenticate(),
  authorizeRestaurantAccess(),
  requirePermission(Permissions.MENU_UPDATE),
  async (req, res) => {
    try {
      const { restaurantId, menuItemId } = req.params;
      const updates = req.body;

      // ✅ REAL SERVICE CALL
      const menuService = req.container.resolve('menuService') as MenuService;

      const menuItem = await menuService.updateMenuItem(restaurantId, menuItemId, updates);

      res.json({
        success: true,
        data: {
          menuItem
        },
        message: 'Menu item updated successfully in database',
        correlationId: req.correlationId
      });
    } catch (error) {
      throw error;
    }
  }
);

// DELETE /api/v1/restaurants/:restaurantId/menu/:menuItemId
// Delete menu item
router.delete('/restaurants/:restaurantId/menu/:menuItemId',
  authenticate(),
  authorizeRestaurantAccess(),
  requirePermission(Permissions.MENU_DELETE),
  async (req, res) => {
    try {
      const { restaurantId, menuItemId } = req.params;

      // ✅ REAL SERVICE CALL
      const menuService = req.container.resolve('menuService') as MenuService;

      await menuService.deleteMenuItem(restaurantId, menuItemId);

      res.json({
        success: true,
        data: {
          deletedId: menuItemId
        },
        message: 'Menu item deleted successfully from database',
        correlationId: req.correlationId
      });
    } catch (error) {
      throw error;
    }
  }
);

// GET /api/v1/restaurants/:restaurantId/menu/categories
// Get menu categories
router.get('/restaurants/:restaurantId/menu/categories',
  authenticate(),
  authorizeRestaurantAccess(),
  requirePermission(Permissions.MENU_READ),
  async (req, res) => {
    try {
      const { restaurantId } = req.params;

      // ✅ REAL SERVICE CALL
      const menuService = req.container.resolve('menuService') as MenuService;

      const categories = await menuService.getMenuCategories(restaurantId);

      res.json({
        success: true,
        data: {
          categories
        },
        message: 'Menu categories retrieved successfully from database',
        correlationId: req.correlationId
      });
    } catch (error) {
      throw error;
    }
  }
);

export default router;
