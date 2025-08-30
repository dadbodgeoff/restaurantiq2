import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../../shared/base-repository';

export class VendorItemRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma); // MANDATORY
  }

  async findById(id: string) {
    this.validateId(id, 'VendorItem'); // MANDATORY
    return this.executeQuery(async () => { // MANDATORY
      this.logOperation('findById', { id }); // MANDATORY
      return await this.prisma.vendorItem.findUnique({
        where: { id },
        include: {
          vendor: true,
          restaurant: true,
          itemMaster: true,
          stats: true,
          daily: {
            orderBy: { businessDate: 'desc' },
            take: 30 // Last 30 days
          }
        }
      });
    }, 'findById'); // MANDATORY
  }

  async findByVendorAndItem(restaurantId: string, vendorId: string, itemNumber: string) {
    this.validateId(restaurantId, 'Restaurant');
    this.validateId(vendorId, 'Vendor');
    this.validateRequiredString(itemNumber, 'Item number');
    return this.executeQuery(async () => {
      this.logOperation('findByVendorAndItem', { restaurantId, vendorId, itemNumber });
      return await this.prisma.vendorItem.findUnique({
        where: {
          restaurantId_vendorId_itemNumber: {
            restaurantId,
            vendorId,
            itemNumber
          }
        },
        include: {
          vendor: true,
          itemMaster: true,
          stats: true
        }
      });
    }, 'findByVendorAndItem');
  }

  async findByVendorId(vendorId: string) {
    this.validateId(vendorId, 'Vendor');
    return this.executeQuery(async () => {
      this.logOperation('findByVendorId', { vendorId });
      return await this.prisma.vendorItem.findMany({
        where: { vendorId },
        include: {
          vendor: true,
          itemMaster: true,
          stats: true
        },
        orderBy: [
          { lastSeenAt: 'desc' },
          { lastSeenName: 'asc' }
        ]
      });
    }, 'findByVendorId');
  }

  async findByRestaurantId(restaurantId: string) {
    this.validateId(restaurantId, 'Restaurant');
    return this.executeQuery(async () => {
      this.logOperation('findByRestaurantId', { restaurantId });
      return await this.prisma.vendorItem.findMany({
        where: { restaurantId },
        include: {
          vendor: true,
          itemMaster: true,
          stats: true
        },
        orderBy: [
          { vendor: { name: 'asc' } },
          { lastSeenName: 'asc' }
        ]
      });
    }, 'findByRestaurantId');
  }

  async findByItemMaster(itemMasterId: string) {
    this.validateId(itemMasterId, 'ItemMaster');
    return this.executeQuery(async () => {
      this.logOperation('findByItemMaster', { itemMasterId });
      return await this.prisma.vendorItem.findMany({
        where: { itemMasterId },
        include: {
          vendor: true,
          stats: true
        },
        orderBy: [
          { vendor: { name: 'asc' } },
          { lastSeenAt: 'desc' }
        ]
      });
    }, 'findByItemMaster');
  }

  async searchByName(restaurantId: string, searchTerm: string) {
    this.validateId(restaurantId, 'Restaurant');
    this.validateRequiredString(searchTerm, 'Search term');
    return this.executeQuery(async () => {
      this.logOperation('searchByName', { restaurantId, searchTerm });
      return await this.prisma.vendorItem.findMany({
        where: {
          restaurantId,
          lastSeenName: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        include: {
          vendor: true,
          itemMaster: true,
          stats: true
        },
        orderBy: { lastSeenName: 'asc' }
      });
    }, 'searchByName');
  }

  async upsert(data: {
    restaurantId: string;
    vendorId: string;
    itemNumber: string;
    lastSeenName: string;
    lastSeenUnit?: string;
    itemMasterId?: string;
  }) {
    this.validateId(data.restaurantId, 'Restaurant');
    this.validateId(data.vendorId, 'Vendor');
    this.validateRequiredString(data.itemNumber, 'Item number');
    this.validateRequiredString(data.lastSeenName, 'Item name');
    return this.executeQuery(async () => {
      this.logOperation('upsert', { 
        restaurantId: data.restaurantId,
        vendorId: data.vendorId,
        itemNumber: data.itemNumber,
        lastSeenName: data.lastSeenName
      });
      return await this.prisma.vendorItem.upsert({
        where: {
          restaurantId_vendorId_itemNumber: {
            restaurantId: data.restaurantId,
            vendorId: data.vendorId,
            itemNumber: data.itemNumber
          }
        },
        create: {
          ...data,
          lastSeenUnit: data.lastSeenUnit || 'each',
          lastSeenAt: new Date()
        },
        update: {
          lastSeenName: data.lastSeenName,
          lastSeenUnit: data.lastSeenUnit || 'each',
          lastSeenAt: new Date(),
          itemMasterId: data.itemMasterId
        },
        include: {
          vendor: true,
          itemMaster: true,
          stats: true
        }
      });
    }, 'upsert');
  }

  async updateItemMaster(id: string, itemMasterId: string | null) {
    this.validateId(id, 'VendorItem');
    if (itemMasterId) {
      this.validateId(itemMasterId, 'ItemMaster');
    }
    return this.executeQuery(async () => {
      this.logOperation('updateItemMaster', { id, itemMasterId });
      return await this.prisma.vendorItem.update({
        where: { id },
        data: { itemMasterId },
        include: {
          vendor: true,
          itemMaster: true,
          stats: true
        }
      });
    }, 'updateItemMaster');
  }

  async findRecentlyUpdated(restaurantId: string, days: number = 7) {
    this.validateId(restaurantId, 'Restaurant');
    return this.executeQuery(async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      this.logOperation('findRecentlyUpdated', { restaurantId, days, cutoffDate });
      return await this.prisma.vendorItem.findMany({
        where: {
          restaurantId,
          lastSeenAt: {
            gte: cutoffDate
          }
        },
        include: {
          vendor: true,
          itemMaster: true,
          stats: true
        },
        orderBy: { lastSeenAt: 'desc' }
      });
    }, 'findRecentlyUpdated');
  }

  async findWithoutItemMaster(restaurantId: string) {
    this.validateId(restaurantId, 'Restaurant');
    return this.executeQuery(async () => {
      this.logOperation('findWithoutItemMaster', { restaurantId });
      return await this.prisma.vendorItem.findMany({
        where: {
          restaurantId,
          itemMasterId: null
        },
        include: {
          vendor: true,
          stats: true
        },
        orderBy: [
          { vendor: { name: 'asc' } },
          { lastSeenName: 'asc' }
        ]
      });
    }, 'findWithoutItemMaster');
  }

  async delete(id: string) {
    this.validateId(id, 'VendorItem');
    return this.executeQuery(async () => {
      this.logOperation('delete', { id });
      return await this.prisma.vendorItem.delete({
        where: { id }
      });
    }, 'delete');
  }

  async getItemHistory(restaurantId: string, vendorId: string, itemNumber: string, days: number = 30) {
    this.validateId(restaurantId, 'Restaurant');
    this.validateId(vendorId, 'Vendor');
    this.validateRequiredString(itemNumber, 'Item number');
    return this.executeQuery(async () => {
      this.logOperation('getItemHistory', { restaurantId, vendorId, itemNumber, days });
      
      const item = await this.prisma.vendorItem.findUnique({
        where: {
          restaurantId_vendorId_itemNumber: {
            restaurantId,
            vendorId,
            itemNumber
          }
        },
        include: {
          vendor: true,
          itemMaster: true,
          stats: true,
          daily: {
            orderBy: { businessDate: 'desc' },
            take: days
          }
        }
      });

      return item;
    }, 'getItemHistory');
  }
}
