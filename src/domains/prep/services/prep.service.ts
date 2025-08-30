import { PrepItemRepository } from '../repositories/prep-item.repository';
import { MenuItemRepository } from '../../menu/repositories/menu-item.repository';
import { LoggerService } from '../../../../src/infrastructure/logging/logger.service';

// Minimal PrepService scaffold following the 4+ dependency pattern
export class PrepService {
  constructor(
    private readonly prepItemRepository: PrepItemRepository,
    private readonly menuItemRepository: MenuItemRepository,
    private readonly logger: LoggerService
  ) {}

  async getPrepForDate(restaurantId: string, date: Date) {
    // Basic orchestration example
    this.logger.info('PrepService', 'getPrepForDate called', { restaurantId, date: date.toISOString() });
    const items = await this.prepItemRepository.findByRestaurantAndDate(restaurantId, date);
    return items;
  }

  // Sync prep data from Menu items for a given date
  async syncFromMenu(restaurantId: string, date: Date) {
    this.logger.info('PrepService', 'syncFromMenu called', { restaurantId, date: date.toISOString() });

    try {
      // Get all menu items for this restaurant
      const menuItems = await this.menuItemRepository.findByRestaurantId(restaurantId);
      this.logger.info('PrepService', 'Found menu items', { count: menuItems.length });

      // Get existing prep items for this date
      const existingPrepItems = await this.prepItemRepository.findByRestaurantAndDate(restaurantId, date);
      this.logger.info('PrepService', 'Found existing prep items', { count: existingPrepItems.length });

      // Get previous day's prep items to carry forward PAR values
      const previousDay = new Date(date);
      previousDay.setDate(previousDay.getDate() - 1);
      const previousPrepItems = await this.prepItemRepository.findByRestaurantAndDate(restaurantId, previousDay);
      this.logger.info('PrepService', 'Found previous day prep items for PAR carry-forward', { count: previousPrepItems.length });

      // Create maps for quick lookup
      const existingPrepMap = new Map(existingPrepItems.map(item => [item.menuItemId, item]));
      const previousPrepMap = new Map(previousPrepItems.map(item => [item.menuItemId, item]));

      const createdItems = [];
      const skippedItems = [];

      // Process each menu item
      for (const menuItem of menuItems) {
        if (!existingPrepMap.has(menuItem.id)) {
          // Create new prep item for this menu item
          try {
            // Carry forward PAR value from previous day, or use default
            const previousPrep = previousPrepMap.get(menuItem.id);
            const parValue = previousPrep ? previousPrep.par : 0;
            
            const newPrepItem = await this.prepItemRepository.createPrepItem({
              restaurantId,
              menuItemId: menuItem.id,
              businessDate: date,
              par: parValue, // Carry forward from previous day or default to 0
              onHand: 0, // Always reset to 0 (daily inventory count)
              amountToPrep: 0, // Will be calculated based on PAR and on-hand
              unit: previousPrep ? previousPrep.unit : (menuItem.prepTimeMinutes ? 'portions' : 'each'), // Use previous unit or smart detection
              notes: previousPrep ? 
                `Carried forward from ${previousDay.toISOString().split('T')[0]} (PAR: ${previousPrep.par})` :
                `Auto-created from menu item: ${menuItem.name}`
            });
            createdItems.push({
              id: newPrepItem.id,
              menuItemName: menuItem.name,
              par: newPrepItem.par,
              unit: newPrepItem.unit
            });
            this.logger.info('PrepService', 'Created prep item', { menuItemId: menuItem.id, prepItemId: newPrepItem.id });
          } catch (error) {
            this.logger.error('PrepService', error instanceof Error ? error : new Error(String(error)), { menuItemId: menuItem.id });
          }
        } else {
          // Prep item already exists
          const existingPrep = existingPrepMap.get(menuItem.id);
          skippedItems.push({
            id: existingPrep!.id,
            menuItemName: menuItem.name,
            par: existingPrep!.par
          });
        }
      }

      const result = {
        syncedDate: date.toISOString(),
        restaurantId,
        summary: {
          totalMenuItems: menuItems.length,
          existingPrepItems: existingPrepItems.length,
          createdPrepItems: createdItems.length,
          skippedPrepItems: skippedItems.length
        },
        created: createdItems,
        skipped: skippedItems,
        success: true
      };

      this.logger.info('PrepService', 'Sync completed successfully', {
        created: createdItems.length,
        skipped: skippedItems.length
      });

      return result;

    } catch (error) {
      this.logger.error('PrepService', error instanceof Error ? error : new Error(String(error)), { restaurantId, date: date.toISOString() });
      throw new Error(`Failed to sync prep data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Update prep item with restaurant ownership verification
  async updatePrepItem(restaurantId: string, itemId: string, data: any) {
    this.logger.info('PrepService', 'updatePrepItem called', { restaurantId, itemId, fields: Object.keys(data) });

    // First verify the prep item belongs to the restaurant
    const existingItem = await this.prepItemRepository.findById(itemId);
    if (!existingItem) {
      throw new Error('Prep item not found');
    }
    if (existingItem.restaurantId !== restaurantId) {
      throw new Error('Access denied: Prep item does not belong to this restaurant');
    }

    // Proceed with update
    return this.prepItemRepository.updatePrepItem(restaurantId, itemId, data);
  }
}


