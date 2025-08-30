import { VendorItemRepository } from '../repositories/vendor-item.repository';
import { VendorItemDailyRepository } from '../repositories/vendor-item-daily.repository';
import { VendorItemStatsRepository } from '../repositories/vendor-item-stats.repository';
import { PriceStatsService } from './price-stats.service';
import { ItemMatchingService } from './item-matching.service';
import { LoggerService } from '../../../infrastructure/logging/logger.service';

export class PriceIngestionService {
  constructor(
    private vendorItemRepository: VendorItemRepository,
    private vendorItemDailyRepository: VendorItemDailyRepository,
    private vendorItemStatsRepository: VendorItemStatsRepository,
    private priceStatsService: PriceStatsService,
    private itemMatchingService: ItemMatchingService,
    private logger: LoggerService
  ) {}

  /**
   * Process a single invoice line and update price intelligence
   * This is the main entry point for feeding your 4 price trackers
   */
  async recordLine(params: {
    restaurantId: string;
    vendorId: string;
    itemNumber: string;
    name: string;
    unit: string;
    unitPrice: number;
    quantity: number;
    businessDate: string;
  }, options?: { recompute?: boolean }) {
    try {
      const { restaurantId, vendorId, itemNumber, name, unit, unitPrice, quantity, businessDate } = params;
      const { recompute = true } = options || {};

      this.logger.info('recordLine', 'Processing invoice line for price intelligence', {
        restaurantId,
        vendorId,
        itemNumber,
        name,
        unitPrice,
        quantity,
        businessDate
      });

      // Step 1: Find or create ItemMaster for cross-vendor comparison (4th tracker)
      const itemMasterId = await this.itemMatchingService.findOrCreateItemMaster(
        restaurantId,
        vendorId,
        itemNumber,
        name,
        unit,
        this.extractCategory(name) // Simple category extraction
      );

      // Step 2: Update/create vendor item tracking with ItemMaster link
      await this.vendorItemRepository.upsert({
        restaurantId,
        vendorId,
        itemNumber,
        lastSeenName: name,
        lastSeenUnit: unit,
        itemMasterId // NEW: Link for cross-vendor comparison
      });

      // Step 2: Add to daily aggregations
      await this.vendorItemDailyRepository.addRollup(
        restaurantId,
        vendorId,
        itemNumber,
        businessDate,
        quantity,
        unitPrice * quantity
      );

      // Step 3: Atomic increment for 28d rolling aggregates (for real-time stats)
      if (unitPrice > 0) {
        try {
          await this.vendorItemStatsRepository.increment28d(restaurantId, vendorId, itemNumber, unitPrice);
        } catch (error) {
          this.logger.error('recordLine.increment28d', error as Error, {
            restaurantId,
            vendorId,
            itemNumber,
            unitPrice
          });
          // Continue processing even if atomic increment fails
        }
      }

      // Step 4: Update last paid price (CRITICAL for your 4 price trackers)
      const current = await this.vendorItemStatsRepository.get(restaurantId, vendorId, itemNumber);
      
      // Update last paid ONLY if there is no current record, or if the new business date is more recent
      const lastPaidAtDate = current?.lastPaidAt ? new Date(current.lastPaidAt) : null;
      const currentBusinessDate = new Date(`${businessDate}T00:00:00.000Z`);
      
      if (!current || !lastPaidAtDate || currentBusinessDate > lastPaidAtDate) {
        await this.vendorItemStatsRepository.upsert(restaurantId, vendorId, itemNumber, {
          lastPaidPrice: unitPrice,
          lastPaidAt: currentBusinessDate
        });

        this.logger.info('recordLine', 'Updated last paid price', {
          restaurantId,
          vendorId,
          itemNumber,
          lastPaidPrice: unitPrice,
          lastPaidAt: currentBusinessDate.toISOString()
        });
      }

      // Step 5: Recompute rolling averages (your 7d/28d trackers)
      if (recompute) {
        await this.handlePriceRecompute(restaurantId, vendorId, itemNumber, businessDate);
      }

      // Step 6: Update cross-vendor comparison stats (4th tracker)
      await this.itemMatchingService.updateCrossVendorStats(restaurantId, itemMasterId);

      this.logger.info('recordLine', 'Invoice line processed successfully', {
        restaurantId,
        vendorId,
        itemNumber,
        unitPrice,
        businessDate
      });

      return {
        success: true,
        restaurantId,
        vendorId,
        itemNumber,
        businessDate,
        unitPrice,
        processed: true
      };

    } catch (error) {
      this.logger.error('recordLine', error as Error, params);
      throw error;
    }
  }

  /**
   * Process multiple invoice lines in batch for performance
   */
  async recordBatch(lines: Array<{
    restaurantId: string;
    vendorId: string;
    itemNumber: string;
    name: string;
    unit: string;
    unitPrice: number;
    quantity: number;
    businessDate: string;
  }>, options?: { recompute?: boolean }) {
    try {
      this.logger.info('recordBatch', 'Processing batch of invoice lines', {
        lineCount: lines.length,
        businessDates: Array.from(new Set(lines.map(l => l.businessDate))),
        vendors: Array.from(new Set(lines.map(l => l.vendorId)))
      });

      const results = [];
      const { recompute = true } = options || {};

      // Process each line individually for now
      // In production, you might want to batch database operations further
      for (const line of lines) {
        try {
          const result = await this.recordLine(line, { recompute: false }); // Skip recompute during batch
          results.push(result);
        } catch (error) {
          this.logger.error('recordBatch.line', error as Error, line);
          results.push({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            ...line
          });
        }
      }

      // Recompute stats for unique items if requested
      if (recompute) {
        const uniqueItems = lines.reduce((acc, line) => {
          const key = `${line.restaurantId}|${line.vendorId}|${line.itemNumber}|${line.businessDate}`;
          if (!acc.has(key)) {
            acc.set(key, line);
          }
          return acc;
        }, new Map());

        for (const line of Array.from(uniqueItems.values())) {
          try {
            await this.handlePriceRecompute(
              line.restaurantId,
              line.vendorId,
              line.itemNumber,
              line.businessDate
            );
          } catch (error) {
            this.logger.error('recordBatch.recompute', error as Error, line);
          }
        }
      }

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.length - successCount;

      this.logger.info('recordBatch', 'Batch processing completed', {
        totalLines: lines.length,
        successCount,
        errorCount,
        recomputed: recompute
      });

      return {
        totalLines: lines.length,
        successCount,
        errorCount,
        results
      };

    } catch (error) {
      this.logger.error('recordBatch', error as Error, { lineCount: lines.length });
      throw error;
    }
  }

  /**
   * Handle price recomputation for rolling averages
   */
  private async handlePriceRecompute(restaurantId: string, vendorId: string, itemNumber: string, businessDate: string) {
    try {
      // Check if we have daily data before attempting recomputation
      const start28 = this.offsetDate(businessDate, -27);
      const dailyData = await this.vendorItemDailyRepository.getWindow(
        restaurantId,
        vendorId,
        itemNumber,
        start28,
        businessDate
      );

      if (dailyData.length > 0) {
        // Daily data exists - safe to recompute with rolling calculations
        await this.runRecomputeWithDailyData(restaurantId, vendorId, itemNumber, businessDate, dailyData);
      } else {
        // No daily data - preserve atomic increment data
        await this.handleNoDailyData(restaurantId, vendorId, itemNumber, businessDate);
      }
    } catch (error) {
      // Error handling - preserve atomic data
      await this.handleRecomputeError(error as Error, restaurantId, vendorId, itemNumber, businessDate);
    }
  }

  private async runRecomputeWithDailyData(
    restaurantId: string,
    vendorId: string,
    itemNumber: string,
    businessDate: string,
    dailyData: any[]
  ) {
    this.logger.info('runRecomputeWithDailyData', 'Running recompute with daily data available', {
      restaurantId,
      vendorId,
      itemNumber,
      businessDate,
      dailyDataPoints: dailyData.length
    });

    await this.priceStatsService.recomputeRolling(restaurantId, vendorId, itemNumber, businessDate);
  }

  private async handleNoDailyData(restaurantId: string, vendorId: string, itemNumber: string, businessDate: string) {
    this.logger.warn('handleNoDailyData', 'Skipping recompute - no daily data available, preserving atomic increments', {
      restaurantId,
      vendorId,
      itemNumber,
      businessDate
    });

    await this.ensureMinMaxFallback(restaurantId, vendorId, itemNumber);
  }

  private async handleRecomputeError(
    error: Error,
    restaurantId: string,
    vendorId: string,
    itemNumber: string,
    businessDate: string
  ) {
    this.logger.error('handleRecomputeError', error, {
      restaurantId,
      vendorId,
      itemNumber,
      businessDate,
      message: 'Error in recompute - preserving atomic data'
    });

    await this.ensureMinMaxFallback(restaurantId, vendorId, itemNumber);
  }

  private async ensureMinMaxFallback(restaurantId: string, vendorId: string, itemNumber: string) {
    const stats = await this.vendorItemStatsRepository.get(restaurantId, vendorId, itemNumber);
    if (stats && (stats.min28dPrice === null || stats.max28dPrice === null)) {
      const avg28d = Number(stats.avg28dPrice || stats.lastPaidPrice || 0);
      await this.vendorItemStatsRepository.upsert(restaurantId, vendorId, itemNumber, {
        min28dPrice: avg28d,
        max28dPrice: avg28d
      });
    }
  }

  private offsetDate(ymd: string, days: number): string {
    const d = new Date(`${ymd}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }

  /**
   * Get current price intelligence for an item
   * Returns all 4 of your price trackers
   */
  async getPriceIntelligence(restaurantId: string, vendorId: string, itemNumber: string) {
    try {
      this.logger.info('getPriceIntelligence', 'Getting price intelligence', {
        restaurantId,
        vendorId,
        itemNumber
      });

      const stats = await this.vendorItemStatsRepository.get(restaurantId, vendorId, itemNumber);
      const item = await this.vendorItemRepository.findByVendorAndItem(restaurantId, vendorId, itemNumber);

      if (!stats || !item) {
        return null;
      }

      return {
        // Your 4 Price Trackers
        lastPaidPrice: stats.lastPaidPrice,
        lastPaidAt: stats.lastPaidAt,
        avg7dPrice: stats.avg7dPrice,
        avg28dPrice: stats.avg28dPrice,
        bestPriceAcrossVendors: stats.bestPriceAcrossVendors,
        bestVendorName: stats.bestVendorName,

        // Price variance indicators
        diffVs7dPct: stats.diffVs7dPct,
        diffVs28dPct: stats.diffVs28dPct,
        diffVsBestPct: stats.diffVsBestPct,

        // Item details
        itemName: item.lastSeenName,
        itemUnit: item.lastSeenUnit,
        vendorName: item.vendor.name,
        lastSeen: item.lastSeenAt,

        // 28-day stats
        min28dPrice: stats.min28dPrice,
        max28dPrice: stats.max28dPrice,
        count28d: stats.count28d
      };

    } catch (error) {
      this.logger.error('getPriceIntelligence', error as Error, {
        restaurantId,
        vendorId,
        itemNumber
      });
      throw error;
    }
  }

  /**
   * Simple category extraction from item name
   * Used for better matching in ItemMaster
   */
  private extractCategory(itemName: string): string {
    const name = itemName.toLowerCase();
    
    if (name.includes('tomato') || name.includes('onion') || name.includes('pepper') || 
        name.includes('lettuce') || name.includes('carrot')) {
      return 'Vegetables';
    }
    
    if (name.includes('chicken') || name.includes('beef') || name.includes('pork')) {
      return 'Proteins';
    }
    
    if (name.includes('salmon') || name.includes('fish') || name.includes('seafood')) {
      return 'Seafood';
    }
    
    if (name.includes('cheese') || name.includes('milk') || name.includes('dairy')) {
      return 'Dairy';
    }
    
    if (name.includes('flour') || name.includes('bread') || name.includes('rice')) {
      return 'Grains';
    }
    
    if (name.includes('oil') || name.includes('sauce') || name.includes('spice')) {
      return 'Condiments';
    }
    
    return 'Other';
  }
}
