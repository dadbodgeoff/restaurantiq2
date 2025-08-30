import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../../shared/base-repository';

// Prep domain repository - follows .cursorrules patterns (4+ deps in service, simple repo)
export class PrepItemRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  // Find prep item by ID
  async findById(id: string) {
    this.validateId(id, 'PrepItem');
    return this.executeQuery(async () => {
      this.logOperation('findById', { id });
      return await this.prisma.prepItem.findUnique({
        where: { id },
        include: {
          menuItem: true,
          restaurant: true
        }
      });
    }, 'findById');
  }

  // Example: Find prep items for a given restaurant and business date
  async findByRestaurantAndDate(restaurantId: string, businessDate: Date) {
    this.validateId(restaurantId, 'Restaurant');
    return this.executeQuery(async () => {
      this.logOperation('findByRestaurantAndDate', {
        restaurantId,
        businessDate: businessDate.toISOString()
      });
      const items = await this.prisma.prepItem.findMany({
        where: {
          restaurantId,
          businessDate
        },
        include: {
          menuItem: {
            include: {
              category: true
            }
          }
        }
      });
      return items;
    }, 'findByRestaurantAndDate');
  }

  // Create a new prep item
  async createPrepItem(data: {
    restaurantId: string;
    menuItemId: string;
    businessDate: Date;
    par: number;
    onHand: number;
    amountToPrep: number;
    unit: string;
    notes?: string;
  }) {
    this.validateId(data.restaurantId, 'Restaurant');
    this.validateId(data.menuItemId, 'MenuItem');
    return this.executeQuery(async () => {
      this.logOperation('createPrepItem', {
        restaurantId: data.restaurantId,
        menuItemId: data.menuItemId,
        businessDate: data.businessDate.toISOString()
      });
      return await this.prisma.prepItem.create({
        data: {
          ...data,
          notes: data.notes || null
        }
      });
    }, 'createPrepItem');
  }

  // Update a prep item partially
  async updatePrepItem(restaurantId: string, itemId: string, data: any) {
    this.validateId(restaurantId, 'Restaurant');
    this.validateId(itemId, 'PrepItem');
    return this.executeQuery(async () => {
      this.logOperation('updatePrepItem', { restaurantId, itemId, fields: Object.keys(data) });
      const updated = await this.prisma.prepItem.update({
        where: { id: itemId },
        data,
        include: {
          menuItem: {
            include: {
              category: true
            }
          }
        }
      });
      return updated;
    }, 'updatePrepItem');
  }
}


