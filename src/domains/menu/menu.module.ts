import { Router } from 'express';
import { BaseRestaurantModule } from '../shared/base-module';
import { DomainEventTypes } from '../../lib/events/domain-events';

// Example Menu Module - Shows how easy it is to add new modules
export class MenuModule extends BaseRestaurantModule {
  name = 'menu';
  version = '1.0.0';
  description = 'Menu management module for restaurant items and categories';

  constructor(container: any) {
    super(container);

    // Register services for this module
    this.moduleServices = {
      menuService: this.createMenuService(),
      categoryService: this.createCategoryService(),
    };

    // Register repositories for this module
    this.moduleRepositories = {
      menuRepository: this.createMenuRepository(),
      categoryRepository: this.createCategoryRepository(),
    };

    // Module-specific configuration
    this.moduleConfig = {
      defaultCategory: 'Uncategorized',
      maxItemsPerPage: 50,
      enableCategories: true,
    };
  }

  // Create routes for this module
  protected createRoutes(container: any): Router {
    const router = Router();
    const menuService = container.resolve('menuService');
    const { authenticate, authorizeRestaurantAccess } = container.resolve('authMiddleware');

    // GET /api/v1/restaurants/:restaurantId/menu/items
    router.get('/restaurants/:restaurantId/menu/items',
      authenticate(),
      authorizeRestaurantAccess(),
      async (req, res) => {
        try {
          const { restaurantId } = req.params;
          const { page = 1, limit = 50, category } = req.query;

          const result = await menuService.getMenuItems(restaurantId, {
            page: Number(page),
            limit: Number(limit),
            category: category as string,
          });

          res.json({
            success: true,
            data: result.items,
            pagination: result.pagination,
            correlationId: req.correlationId,
          });
        } catch (error) {
          // Error will be handled by global error handler
          throw error;
        }
      }
    );

    // POST /api/v1/restaurants/:restaurantId/menu/items
    router.post('/restaurants/:restaurantId/menu/items',
      authenticate(),
      authorizeRestaurantAccess(),
      async (req, res) => {
        try {
          const { restaurantId } = req.params;
          const menuItemData = req.body;

          const menuItem = await menuService.createMenuItem(restaurantId, menuItemData);

          // Publish domain event
          await this.publishEvent({
            type: DomainEventTypes.MENU_ITEM_CREATED,
            aggregateId: menuItem.id,
            aggregateType: 'MenuItem',
            data: { menuItem, restaurantId },
            metadata: {
              correlationId: req.correlationId,
              userId: req.user?.id,
              restaurantId,
            },
          });

          res.status(201).json({
            success: true,
            data: menuItem,
            correlationId: req.correlationId,
          });
        } catch (error) {
          throw error;
        }
      }
    );

    // PUT /api/v1/restaurants/:restaurantId/menu/items/:itemId
    router.put('/restaurants/:restaurantId/menu/items/:itemId',
      authenticate(),
      authorizeRestaurantAccess(),
      async (req, res) => {
        try {
          const { restaurantId, itemId } = req.params;
          const updateData = req.body;

          const menuItem = await menuService.updateMenuItem(restaurantId, itemId, updateData);

          await this.publishEvent({
            type: DomainEventTypes.MENU_ITEM_UPDATED,
            aggregateId: itemId,
            aggregateType: 'MenuItem',
            data: { menuItem, restaurantId, updates: updateData },
            metadata: {
              correlationId: req.correlationId,
              userId: req.user?.id,
              restaurantId,
            },
          });

          res.json({
            success: true,
            data: menuItem,
            correlationId: req.correlationId,
          });
        } catch (error) {
          throw error;
        }
      }
    );

    // DELETE /api/v1/restaurants/:restaurantId/menu/items/:itemId
    router.delete('/restaurants/:restaurantId/menu/items/:itemId',
      authenticate(),
      authorizeRestaurantAccess(),
      async (req, res) => {
        try {
          const { restaurantId, itemId } = req.params;

          await menuService.deleteMenuItem(restaurantId, itemId);

          await this.publishEvent({
            type: DomainEventTypes.MENU_ITEM_DELETED,
            aggregateId: itemId,
            aggregateType: 'MenuItem',
            data: { restaurantId, itemId },
            metadata: {
              correlationId: req.correlationId,
              userId: req.user?.id,
              restaurantId,
            },
          });

          res.json({
            success: true,
            message: 'Menu item deleted successfully',
            correlationId: req.correlationId,
          });
        } catch (error) {
          throw error;
        }
      }
    );

    return router;
  }

  // Register event handlers for cross-module communication
  protected registerEventHandlers(): void {
    // Listen for restaurant deletion to clean up menu items
    // TODO: Implement when event types are properly defined
    // this.subscribeToEvent(DomainEventTypes.RESTAURANT_DELETED, async (event) => {
    //   const menuService = this.getService('menuService');
    //   await menuService.handleRestaurantDeletion(event.data.restaurantId);
    // });
  }

  // Service factory methods (implement these in actual services)
  private createMenuService() {
    // Return the actual MenuService class
    return class MenuService {
      async getMenuItems(restaurantId: string, options: any) {
        // Implementation here
        return { items: [], pagination: {} };
      }

      async createMenuItem(restaurantId: string, data: any) {
        // Implementation here
        return { id: 'menu-item-id', ...data };
      }

      async updateMenuItem(restaurantId: string, itemId: string, data: any) {
        // Implementation here
        return { id: itemId, ...data };
      }

      async deleteMenuItem(restaurantId: string, itemId: string) {
        // Implementation here
      }

      async handleRestaurantDeletion(restaurantId: string) {
        // Implementation here
      }
    };
  }

  private createCategoryService() {
    // Return the actual CategoryService class
    return class CategoryService {
      // Implementation here
    };
  }

  private createMenuRepository() {
    // Return the actual MenuRepository class
    return class MenuRepository {
      // Implementation here
    };
  }

  private createCategoryRepository() {
    // Return the actual CategoryRepository class
    return class CategoryRepository {
      // Implementation here
    };
  }
}

// Export the module instance factory
export const createMenuModule = (container: any) => new MenuModule(container);
