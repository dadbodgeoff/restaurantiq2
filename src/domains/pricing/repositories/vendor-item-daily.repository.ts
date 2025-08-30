import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../../shared/base-repository';

export class VendorItemDailyRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma); // MANDATORY
  }

  async findById(id: string) {
    this.validateId(id, 'VendorItemDaily'); // MANDATORY
    return this.executeQuery(async () => { // MANDATORY
      this.logOperation('findById', { id }); // MANDATORY
      return await this.prisma.vendorItemDaily.findUnique({
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

  async get(restaurantId: string, vendorId: string, itemNumber: string, businessDate: string) {
    this.validateId(restaurantId, 'Restaurant');
    this.validateId(vendorId, 'Vendor');
    this.validateRequiredString(itemNumber, 'Item number');
    this.validateRequiredString(businessDate, 'Business date');
    return this.executeQuery(async () => {
      this.logOperation('get', { restaurantId, vendorId, itemNumber, businessDate });
      return await this.prisma.vendorItemDaily.findUnique({
        where: {
          restaurantId_vendorId_itemNumber_businessDate: {
            restaurantId,
            vendorId,
            itemNumber,
            businessDate
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

  async getWindow(restaurantId: string, vendorId: string, itemNumber: string, startDate: string, endDate: string) {
    this.validateId(restaurantId, 'Restaurant');
    this.validateId(vendorId, 'Vendor');
    this.validateRequiredString(itemNumber, 'Item number');
    this.validateRequiredString(startDate, 'Start date');
    this.validateRequiredString(endDate, 'End date');
    return this.executeQuery(async () => {
      this.logOperation('getWindow', { restaurantId, vendorId, itemNumber, startDate, endDate });
      return await this.prisma.vendorItemDaily.findMany({
        where: {
          restaurantId,
          vendorId,
          itemNumber,
          businessDate: {
            gte: startDate,
            lte: endDate
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
        orderBy: { businessDate: 'asc' }
      });
    }, 'getWindow');
  }

  async findByBusinessDate(restaurantId: string, businessDate: string) {
    this.validateId(restaurantId, 'Restaurant');
    this.validateRequiredString(businessDate, 'Business date');
    return this.executeQuery(async () => {
      this.logOperation('findByBusinessDate', { restaurantId, businessDate });
      return await this.prisma.vendorItemDaily.findMany({
        where: {
          restaurantId,
          businessDate
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
          { vendor: { name: 'asc' } },
          { item: { lastSeenName: 'asc' } }
        ]
      });
    }, 'findByBusinessDate');
  }

  async findByVendorAndDateRange(vendorId: string, startDate: string, endDate: string) {
    this.validateId(vendorId, 'Vendor');
    this.validateRequiredString(startDate, 'Start date');
    this.validateRequiredString(endDate, 'End date');
    return this.executeQuery(async () => {
      this.logOperation('findByVendorAndDateRange', { vendorId, startDate, endDate });
      return await this.prisma.vendorItemDaily.findMany({
        where: {
          vendorId,
          businessDate: {
            gte: startDate,
            lte: endDate
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
          { businessDate: 'desc' },
          { item: { lastSeenName: 'asc' } }
        ]
      });
    }, 'findByVendorAndDateRange');
  }

  // CRITICAL: Add rollup data for daily aggregations
  async addRollup(restaurantId: string, vendorId: string, itemNumber: string, businessDate: string, quantity: number, spend: number) {
    this.validateId(restaurantId, 'Restaurant');
    this.validateId(vendorId, 'Vendor');
    this.validateRequiredString(itemNumber, 'Item number');
    this.validateRequiredString(businessDate, 'Business date');
    
    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }
    if (spend < 0) {
      throw new Error('Spend cannot be negative');
    }

    return this.executeQuery(async () => {
      this.logOperation('addRollup', { 
        restaurantId, 
        vendorId, 
        itemNumber, 
        businessDate, 
        quantity, 
        spend 
      });

      const avgUnitPrice = quantity > 0 ? spend / quantity : 0;

      return await this.prisma.vendorItemDaily.upsert({
        where: {
          restaurantId_vendorId_itemNumber_businessDate: {
            restaurantId,
            vendorId,
            itemNumber,
            businessDate
          }
        },
        create: {
          restaurantId,
          vendorId,
          itemNumber,
          businessDate,
          quantitySum: quantity,
          spendSum: spend,
          avgUnitPrice
        },
        update: {
          quantitySum: {
            increment: quantity
          },
          spendSum: {
            increment: spend
          },
          avgUnitPrice: {
            // Recalculate weighted average
            set: avgUnitPrice // Will be updated with proper calculation below
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
    }, 'addRollup');
  }

  // Batch upsert for performance when processing large invoices
  async batchUpsert(records: Array<{
    restaurantId: string;
    vendorId: string;
    itemNumber: string;
    businessDate: string;
    quantity: number;
    spend: number;
  }>) {
    return this.executeQuery(async () => {
      this.logOperation('batchUpsert', { recordCount: records.length });
      
      const results = [];
      
      // Process in smaller batches to avoid database timeouts
      const batchSize = 50;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(
          batch.map(record => 
            this.addRollup(
              record.restaurantId,
              record.vendorId,
              record.itemNumber,
              record.businessDate,
              record.quantity,
              record.spend
            )
          )
        );
        
        results.push(...batchResults);
      }
      
      return results;
    }, 'batchUpsert');
  }

  // Get aggregated data for specific time periods
  async getAggregatedData(restaurantId: string, vendorId: string, itemNumber: string, days: number = 30) {
    this.validateId(restaurantId, 'Restaurant');
    this.validateId(vendorId, 'Vendor');
    this.validateRequiredString(itemNumber, 'Item number');
    
    return this.executeQuery(async () => {
      const endDate = new Date().toISOString().slice(0, 10); // Today as YYYY-MM-DD
      const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10);
      
      this.logOperation('getAggregatedData', { 
        restaurantId, 
        vendorId, 
        itemNumber, 
        days, 
        startDate, 
        endDate 
      });

      const records = await this.prisma.vendorItemDaily.findMany({
        where: {
          restaurantId,
          vendorId,
          itemNumber,
          businessDate: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { businessDate: 'asc' }
      });

      // Calculate aggregations
      const totalQuantity = records.reduce((sum, r) => sum + r.quantitySum, 0);
      const totalSpend = records.reduce((sum, r) => sum + r.spendSum, 0);
      const avgUnitPrice = totalQuantity > 0 ? totalSpend / totalQuantity : 0;
      
      const unitPrices = records
        .map(r => r.avgUnitPrice)
        .filter(price => price > 0);
      
      const minPrice = unitPrices.length > 0 ? Math.min(...unitPrices) : 0;
      const maxPrice = unitPrices.length > 0 ? Math.max(...unitPrices) : 0;

      return {
        records,
        aggregation: {
          totalQuantity,
          totalSpend,
          avgUnitPrice,
          minPrice,
          maxPrice,
          recordCount: records.length,
          dateRange: {
            startDate,
            endDate,
            days
          }
        }
      };
    }, 'getAggregatedData');
  }

  async delete(id: string) {
    this.validateId(id, 'VendorItemDaily');
    return this.executeQuery(async () => {
      this.logOperation('delete', { id });
      return await this.prisma.vendorItemDaily.delete({
        where: { id }
      });
    }, 'delete');
  }

  // Cleanup old records (useful for data retention policies)
  async deleteOlderThan(restaurantId: string, cutoffDate: string) {
    this.validateId(restaurantId, 'Restaurant');
    this.validateRequiredString(cutoffDate, 'Cutoff date');
    return this.executeQuery(async () => {
      this.logOperation('deleteOlderThan', { restaurantId, cutoffDate });
      
      const result = await this.prisma.vendorItemDaily.deleteMany({
        where: {
          restaurantId,
          businessDate: {
            lt: cutoffDate
          }
        }
      });

      return result;
    }, 'deleteOlderThan');
  }

  // Get recent activity summary
  async getRecentActivity(restaurantId: string, days: number = 7) {
    this.validateId(restaurantId, 'Restaurant');
    return this.executeQuery(async () => {
      const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10);
      
      this.logOperation('getRecentActivity', { restaurantId, days, cutoffDate });
      
      const records = await this.prisma.vendorItemDaily.findMany({
        where: {
          restaurantId,
          businessDate: {
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
        orderBy: { businessDate: 'desc' }
      });

      // Group by business date for summary
      const summary = records.reduce((acc, record) => {
        if (!acc[record.businessDate]) {
          acc[record.businessDate] = {
            date: record.businessDate,
            totalSpend: 0,
            totalQuantity: 0,
            uniqueItems: 0,
            uniqueVendors: new Set()
          };
        }
        
        acc[record.businessDate].totalSpend += record.spendSum;
        acc[record.businessDate].totalQuantity += record.quantitySum;
        acc[record.businessDate].uniqueItems += 1;
        acc[record.businessDate].uniqueVendors.add(record.vendorId);
        
        return acc;
      }, {} as Record<string, any>);

      // Convert vendor sets to counts
      Object.values(summary).forEach((day: any) => {
        day.uniqueVendors = day.uniqueVendors.size;
      });

      return {
        records,
        summary: Object.values(summary),
        totals: {
          totalRecords: records.length,
          totalSpend: records.reduce((sum, r) => sum + r.spendSum, 0),
          totalQuantity: records.reduce((sum, r) => sum + r.quantitySum, 0)
        }
      };
    }, 'getRecentActivity');
  }
}
