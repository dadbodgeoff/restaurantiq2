import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../../shared/base-repository';

export class VendorItemStatsRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma); // MANDATORY
  }

  async findById(id: string) {
    this.validateId(id, 'VendorItemStats'); // MANDATORY
    return this.executeQuery(async () => { // MANDATORY
      this.logOperation('findById', { id }); // MANDATORY
      return await this.prisma.vendorItemStats.findUnique({
        where: { id },
        include: {
          vendor: true,
          restaurant: true,
          item: {
            include: {
              itemMaster: true
            }
          }
        }
      });
    }, 'findById'); // MANDATORY
  }

  async get(restaurantId: string, vendorId: string, itemNumber: string) {
    this.validateId(restaurantId, 'Restaurant');
    this.validateId(vendorId, 'Vendor');
    this.validateRequiredString(itemNumber, 'Item number');
    return this.executeQuery(async () => {
      this.logOperation('get', { restaurantId, vendorId, itemNumber });
      return await this.prisma.vendorItemStats.findUnique({
        where: {
          restaurantId_vendorId_itemNumber: {
            restaurantId,
            vendorId,
            itemNumber
          }
        },
        include: {
          vendor: true,
          item: {
            include: {
              itemMaster: true
            }
          }
        }
      });
    }, 'get');
  }

  async findByVendorId(vendorId: string) {
    this.validateId(vendorId, 'Vendor');
    return this.executeQuery(async () => {
      this.logOperation('findByVendorId', { vendorId });
      return await this.prisma.vendorItemStats.findMany({
        where: { vendorId },
        include: {
          vendor: true,
          item: {
            include: {
              itemMaster: true
            }
          }
        },
        orderBy: [
          { lastPaidAt: 'desc' },
          { item: { lastSeenName: 'asc' } }
        ]
      });
    }, 'findByVendorId');
  }

  async findByRestaurantId(restaurantId: string) {
    this.validateId(restaurantId, 'Restaurant');
    return this.executeQuery(async () => {
      this.logOperation('findByRestaurantId', { restaurantId });
      return await this.prisma.vendorItemStats.findMany({
        where: { restaurantId },
        include: {
          vendor: true,
          item: {
            include: {
              itemMaster: true
            }
          }
        },
        orderBy: [
          { vendor: { name: 'asc' } },
          { item: { lastSeenName: 'asc' } }
        ]
      });
    }, 'findByRestaurantId');
  }

  // CRITICAL: Your 4 Price Trackers - Upsert method
  async upsert(restaurantId: string, vendorId: string, itemNumber: string, data: {
    lastPaidPrice?: number;
    lastPaidAt?: Date;
    avg7dPrice?: number;
    avg28dPrice?: number;
    bestPriceAcrossVendors?: number;
    bestVendorName?: string;
    diffVs7dPct?: number;
    diffVs28dPct?: number;
    diffVsBestPct?: number;
    min28dPrice?: number;
    max28dPrice?: number;
    sum28dPrice?: number;
    count28d?: number;
  }) {
    this.validateId(restaurantId, 'Restaurant');
    this.validateId(vendorId, 'Vendor');
    this.validateRequiredString(itemNumber, 'Item number');
    return this.executeQuery(async () => {
      this.logOperation('upsert', { 
        restaurantId,
        vendorId,
        itemNumber,
        updateFields: Object.keys(data)
      });
      return await this.prisma.vendorItemStats.upsert({
        where: {
          restaurantId_vendorId_itemNumber: {
            restaurantId,
            vendorId,
            itemNumber
          }
        },
        create: {
          restaurantId,
          vendorId,
          itemNumber,
          ...data
        },
        update: data,
        include: {
          vendor: true,
          item: {
            include: {
              itemMaster: true
            }
          }
        }
      });
    }, 'upsert');
  }

  // Atomic increment for 28-day rolling aggregates (for real-time processing)
  async increment28d(restaurantId: string, vendorId: string, itemNumber: string, unitPrice: number) {
    this.validateId(restaurantId, 'Restaurant');
    this.validateId(vendorId, 'Vendor');
    this.validateRequiredString(itemNumber, 'Item number');
    if (unitPrice <= 0) {
      throw new Error('Unit price must be greater than 0');
    }
    
    return this.executeQuery(async () => {
      this.logOperation('increment28d', { restaurantId, vendorId, itemNumber, unitPrice });
      
      // First ensure the record exists
      await this.prisma.vendorItemStats.upsert({
        where: {
          restaurantId_vendorId_itemNumber: {
            restaurantId,
            vendorId,
            itemNumber
          }
        },
        create: {
          restaurantId,
          vendorId,
          itemNumber,
          sum28dPrice: unitPrice,
          count28d: 1,
          min28dPrice: unitPrice,
          max28dPrice: unitPrice
        },
        update: {
          sum28dPrice: {
            increment: unitPrice
          },
          count28d: {
            increment: 1
          },
          min28dPrice: {
            // Use conditional update to maintain min
            set: unitPrice // Will be overridden by raw SQL if needed
          },
          max28dPrice: {
            // Use conditional update to maintain max  
            set: unitPrice // Will be overridden by raw SQL if needed
          }
        }
      });

      // Update min/max with raw SQL for proper conditional logic
      await this.prisma.$executeRaw`
        UPDATE vendor_item_stats 
        SET 
          "min28dPrice" = LEAST(COALESCE("min28dPrice", ${unitPrice}), ${unitPrice}),
          "max28dPrice" = GREATEST(COALESCE("max28dPrice", ${unitPrice}), ${unitPrice})
        WHERE "restaurantId" = ${restaurantId} 
          AND "vendorId" = ${vendorId} 
          AND "itemNumber" = ${itemNumber}
      `;

      return await this.get(restaurantId, vendorId, itemNumber);
    }, 'increment28d');
  }

  // Get items with significant price changes
  async findPriceAlerts(restaurantId: string, thresholdPct: number = 10) {
    this.validateId(restaurantId, 'Restaurant');
    return this.executeQuery(async () => {
      this.logOperation('findPriceAlerts', { restaurantId, thresholdPct });
      return await this.prisma.vendorItemStats.findMany({
        where: {
          restaurantId,
          OR: [
            {
              diffVs7dPct: {
                gte: thresholdPct
              }
            },
            {
              diffVs7dPct: {
                lte: -thresholdPct
              }
            },
            {
              diffVs28dPct: {
                gte: thresholdPct
              }
            },
            {
              diffVs28dPct: {
                lte: -thresholdPct
              }
            }
          ]
        },
        include: {
          vendor: true,
          item: {
            include: {
              itemMaster: true
            }
          }
        },
        orderBy: [
          { diffVs7dPct: 'desc' }
        ]
      });
    }, 'findPriceAlerts');
  }

  // Get best prices across all vendors for items in a restaurant
  async findBestPrices(restaurantId: string) {
    this.validateId(restaurantId, 'Restaurant');
    return this.executeQuery(async () => {
      this.logOperation('findBestPrices', { restaurantId });
      return await this.prisma.vendorItemStats.findMany({
        where: {
          restaurantId,
          bestPriceAcrossVendors: {
            not: null
          }
        },
        include: {
          vendor: true,
          item: {
            include: {
              itemMaster: true
            }
          }
        },
        orderBy: [
          { item: { itemMaster: { masterName: 'asc' } } },
          { bestPriceAcrossVendors: 'asc' }
        ]
      });
    }, 'findBestPrices');
  }

  // Update cross-vendor comparison data
  async updateCrossVendorStats(restaurantId: string, itemMasterId: string) {
    this.validateId(restaurantId, 'Restaurant');
    this.validateId(itemMasterId, 'ItemMaster');
    return this.executeQuery(async () => {
      this.logOperation('updateCrossVendorStats', { restaurantId, itemMasterId });
      
      // Find all vendor items for this master item
      const vendorItems = await this.prisma.vendorItem.findMany({
        where: {
          restaurantId,
          itemMasterId
        },
        include: {
          stats: true,
          vendor: true
        }
      });

      if (vendorItems.length === 0) return [];

      // Find the best price among all vendors
      const validPrices = vendorItems
        .filter(item => item.stats?.lastPaidPrice && item.stats.lastPaidPrice > 0)
        .map(item => ({
          price: item.stats!.lastPaidPrice!,
          vendorName: item.vendor.name,
          vendorId: item.vendorId,
          itemNumber: item.itemNumber
        }));

      if (validPrices.length === 0) return [];

      const bestPrice = Math.min(...validPrices.map(p => p.price));
      const bestVendor = validPrices.find(p => p.price === bestPrice);

      // Update all vendor item stats for this master item
      const updates = [];
      for (const vendorItem of vendorItems) {
        if (vendorItem.stats?.lastPaidPrice) {
          const diffVsBest = ((vendorItem.stats.lastPaidPrice - bestPrice) / bestPrice) * 100;
          
          const updated = await this.prisma.vendorItemStats.update({
            where: {
              restaurantId_vendorId_itemNumber: {
                restaurantId,
                vendorId: vendorItem.vendorId,
                itemNumber: vendorItem.itemNumber
              }
            },
            data: {
              bestPriceAcrossVendors: bestPrice,
              bestVendorName: bestVendor?.vendorName,
              diffVsBestPct: diffVsBest
            },
            include: {
              vendor: true,
              item: {
                include: {
                  itemMaster: true
                }
              }
            }
          });
          updates.push(updated);
        }
      }

      return updates;
    }, 'updateCrossVendorStats');
  }

  async delete(id: string) {
    this.validateId(id, 'VendorItemStats');
    return this.executeQuery(async () => {
      this.logOperation('delete', { id });
      return await this.prisma.vendorItemStats.delete({
        where: { id }
      });
    }, 'delete');
  }

  // Get pricing trends for analysis
  async getPricingTrends(restaurantId: string, days: number = 30) {
    this.validateId(restaurantId, 'Restaurant');
    return this.executeQuery(async () => {
      this.logOperation('getPricingTrends', { restaurantId, days });
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return await this.prisma.vendorItemStats.findMany({
        where: {
          restaurantId,
          lastPaidAt: {
            gte: cutoffDate
          }
        },
        include: {
          vendor: true,
          item: {
            include: {
              itemMaster: true
            }
          }
        },
        orderBy: [
          { lastPaidAt: 'desc' }
        ]
      });
    }, 'getPricingTrends');
  }
}
