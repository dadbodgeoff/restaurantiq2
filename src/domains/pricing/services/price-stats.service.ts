import { VendorItemDailyRepository } from '../repositories/vendor-item-daily.repository';
import { VendorItemStatsRepository } from '../repositories/vendor-item-stats.repository';
import { LoggerService } from '../../../infrastructure/logging/logger.service';

export class PriceStatsService {
  constructor(
    private vendorItemDailyRepository: VendorItemDailyRepository,
    private vendorItemStatsRepository: VendorItemStatsRepository,
    private logger: LoggerService
  ) {}

  /**
   * Recompute rolling averages for your 7-day and 28-day price trackers
   */
  async recomputeRolling(restaurantId: string, vendorId: string, itemNumber: string, asOfDate: string) {
    try {
      this.logger.info('recomputeRolling', 'Recomputing rolling price averages', {
        restaurantId,
        vendorId,
        itemNumber,
        asOfDate
      });

      const start7 = this.offsetDate(asOfDate, -6);
      const start28 = this.offsetDate(asOfDate, -27);

      // Get daily data for 7-day and 28-day windows
      const rows7 = await this.vendorItemDailyRepository.getWindow(
        restaurantId,
        vendorId,
        itemNumber,
        start7,
        asOfDate
      );

      const rows28 = await this.vendorItemDailyRepository.getWindow(
        restaurantId,
        vendorId,
        itemNumber,
        start28,
        asOfDate
      );

      // Calculate weighted averages
      const avg7 = this.weightedAvg(rows7);
      const { avg: avg28, min: min28, max: max28 } = this.weightedAvgMinMax(rows28);

      // Get current last paid price for variance calculations
      const current = await this.vendorItemStatsRepository.get(restaurantId, vendorId, itemNumber);
      const lastPaidPrice = current?.lastPaidPrice ? Number(current.lastPaidPrice) : undefined;

      // Calculate variance percentages
      const diffVs7dPct = avg7 > 0 && lastPaidPrice !== undefined ? ((lastPaidPrice - avg7) / avg7) * 100 : 0;
      const diffVs28dPct = avg28 > 0 && lastPaidPrice !== undefined ? ((lastPaidPrice - avg28) / avg28) * 100 : 0;

      // Update stats with calculated values
      await this.vendorItemStatsRepository.upsert(restaurantId, vendorId, itemNumber, {
        avg7dPrice: avg7,
        avg28dPrice: avg28,
        diffVs7dPct: diffVs7dPct,
        diffVs28dPct: diffVs28dPct,
        min28dPrice: min28 ?? 0,
        max28dPrice: max28 ?? 0
      });

      this.logger.info('recomputeRolling', 'Rolling averages recomputed successfully', {
        restaurantId,
        vendorId,
        itemNumber,
        asOfDate,
        avg7dPrice: avg7,
        avg28dPrice: avg28,
        diffVs7dPct,
        diffVs28dPct,
        dataPoints7d: rows7.length,
        dataPoints28d: rows28.length
      });

      return {
        avg7dPrice: avg7,
        avg28dPrice: avg28,
        diffVs7dPct,
        diffVs28dPct,
        min28dPrice: min28 ?? 0,
        max28dPrice: max28 ?? 0,
        dataPoints7d: rows7.length,
        dataPoints28d: rows28.length
      };

    } catch (error) {
      this.logger.error('recomputeRolling', error as Error, {
        restaurantId,
        vendorId,
        itemNumber,
        asOfDate
      });
      throw error;
    }
  }

  /**
   * Calculate weighted average price (quantity-weighted)
   */
  private weightedAvg(rows: any[]): number {
    const totalQuantity = rows.reduce((acc, r) => acc + Number(r.quantitySum || 0), 0);
    const totalSpend = rows.reduce((acc, r) => acc + Number(r.spendSum || 0), 0);
    return totalQuantity > 0 ? totalSpend / totalQuantity : 0;
  }

  /**
   * Calculate weighted average with min/max tracking
   */
  private weightedAvgMinMax(rows: any[]): { avg: number; min?: number; max?: number } {
    const avg = this.weightedAvg(rows);
    const prices = rows
      .map(r => Number(r.avgUnitPrice || 0))
      .filter(price => price > 0);
    
    const min = prices.length ? Math.min(...prices) : undefined;
    const max = prices.length ? Math.max(...prices) : undefined;
    
    return { avg, min, max };
  }

  private offsetDate(ymd: string, days: number): string {
    const d = new Date(`${ymd}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }

  /**
   * Update cross-vendor price comparison (your 4th price tracker)
   * Finds the best price across all vendors for items linked to the same ItemMaster
   */
  async updateCrossVendorComparison(restaurantId: string, itemMasterId: string) {
    try {
      this.logger.info('updateCrossVendorComparison', 'Updating cross-vendor price comparison', {
        restaurantId,
        itemMasterId
      });

      const updated = await this.vendorItemStatsRepository.updateCrossVendorStats(restaurantId, itemMasterId);

      this.logger.info('updateCrossVendorComparison', 'Cross-vendor comparison updated', {
        restaurantId,
        itemMasterId,
        updatedCount: updated.length
      });

      return updated;

    } catch (error) {
      this.logger.error('updateCrossVendorComparison', error as Error, {
        restaurantId,
        itemMasterId
      });
      throw error;
    }
  }

  /**
   * Get price alerts for items with significant price changes
   */
  async getPriceAlerts(restaurantId: string, thresholdPct: number = 10) {
    try {
      this.logger.info('getPriceAlerts', 'Getting price alerts', {
        restaurantId,
        thresholdPct
      });

      const alerts = await this.vendorItemStatsRepository.findPriceAlerts(restaurantId, thresholdPct);

      const processedAlerts = alerts.map(alert => ({
        restaurantId: alert.restaurantId,
        vendorId: alert.vendorId,
        vendorName: alert.vendor.name,
        itemNumber: alert.itemNumber,
        itemName: alert.item?.lastSeenName,
        lastPaidPrice: alert.lastPaidPrice,
        lastPaidAt: alert.lastPaidAt,
        avg7dPrice: alert.avg7dPrice,
        avg28dPrice: alert.avg28dPrice,
        diffVs7dPct: alert.diffVs7dPct,
        diffVs28dPct: alert.diffVs28dPct,
        alertType: Math.abs(alert.diffVs7dPct || 0) > Math.abs(alert.diffVs28dPct || 0) ? '7d_change' : '28d_change',
        severity: Math.max(Math.abs(alert.diffVs7dPct || 0), Math.abs(alert.diffVs28dPct || 0)) > 20 ? 'high' : 'medium'
      }));

      this.logger.info('getPriceAlerts', 'Price alerts retrieved', {
        restaurantId,
        thresholdPct,
        alertCount: processedAlerts.length
      });

      return processedAlerts;

    } catch (error) {
      this.logger.error('getPriceAlerts', error as Error, {
        restaurantId,
        thresholdPct
      });
      throw error;
    }
  }

  /**
   * Get pricing trends for analysis
   */
  async getPricingTrends(restaurantId: string, days: number = 30) {
    try {
      this.logger.info('getPricingTrends', 'Getting pricing trends', {
        restaurantId,
        days
      });

      const trends = await this.vendorItemStatsRepository.getPricingTrends(restaurantId, days);

      const processedTrends = trends.map(trend => ({
        restaurantId: trend.restaurantId,
        vendorId: trend.vendorId,
        vendorName: trend.vendor.name,
        itemNumber: trend.itemNumber,
        itemName: trend.item?.lastSeenName,
        itemMasterName: trend.item?.itemMaster?.masterName,
        lastPaidPrice: trend.lastPaidPrice,
        lastPaidAt: trend.lastPaidAt,
        avg7dPrice: trend.avg7dPrice,
        avg28dPrice: trend.avg28dPrice,
        bestPriceAcrossVendors: trend.bestPriceAcrossVendors,
        bestVendorName: trend.bestVendorName,
        diffVs7dPct: trend.diffVs7dPct,
        diffVs28dPct: trend.diffVs28dPct,
        diffVsBestPct: trend.diffVsBestPct,
        min28dPrice: trend.min28dPrice,
        max28dPrice: trend.max28dPrice,
        priceVolatility: trend.max28dPrice && trend.min28dPrice && trend.avg28dPrice 
          ? ((trend.max28dPrice - trend.min28dPrice) / trend.avg28dPrice) * 100 
          : 0
      }));

      this.logger.info('getPricingTrends', 'Pricing trends retrieved', {
        restaurantId,
        days,
        trendCount: processedTrends.length
      });

      return processedTrends;

    } catch (error) {
      this.logger.error('getPricingTrends', error as Error, {
        restaurantId,
        days
      });
      throw error;
    }
  }

  /**
   * Calculate price intelligence summary for a restaurant
   */
  async getPriceIntelligenceSummary(restaurantId: string) {
    try {
      this.logger.info('getPriceIntelligenceSummary', 'Getting price intelligence summary', {
        restaurantId
      });

      const [allStats, alerts, trends] = await Promise.all([
        this.vendorItemStatsRepository.findByRestaurantId(restaurantId),
        this.getPriceAlerts(restaurantId, 10),
        this.getPricingTrends(restaurantId, 7)
      ]);

      // Calculate summary metrics
      const totalItems = allStats.length;
      const itemsWithPricing = allStats.filter(s => s.lastPaidPrice && s.lastPaidPrice > 0).length;
      const itemsWith7dAvg = allStats.filter(s => s.avg7dPrice && s.avg7dPrice > 0).length;
      const itemsWith28dAvg = allStats.filter(s => s.avg28dPrice && s.avg28dPrice > 0).length;
      const itemsWithCrossVendor = allStats.filter(s => s.bestPriceAcrossVendors && s.bestPriceAcrossVendors > 0).length;

      // Price change distributions
      const priceIncreases = allStats.filter(s => (s.diffVs7dPct || 0) > 5).length;
      const priceDecreases = allStats.filter(s => (s.diffVs7dPct || 0) < -5).length;
      const priceStable = totalItems - priceIncreases - priceDecreases;

      const summary = {
        restaurantId,
        totalItems,
        coverage: {
          itemsWithPricing,
          itemsWith7dAvg,
          itemsWith28dAvg,
          itemsWithCrossVendor,
          coveragePercentage: totalItems > 0 ? (itemsWithPricing / totalItems) * 100 : 0
        },
        alerts: {
          total: alerts.length,
          high: alerts.filter(a => a.severity === 'high').length,
          medium: alerts.filter(a => a.severity === 'medium').length
        },
        priceMovements: {
          increases: priceIncreases,
          decreases: priceDecreases,
          stable: priceStable
        },
        recentActivity: {
          itemsUpdatedLast7d: trends.length,
          avgPriceChange7d: trends.length > 0 
            ? trends.reduce((sum, t) => sum + Math.abs(t.diffVs7dPct || 0), 0) / trends.length 
            : 0
        },
        generatedAt: new Date().toISOString()
      };

      this.logger.info('getPriceIntelligenceSummary', 'Price intelligence summary generated', {
        restaurantId,
        totalItems,
        alertCount: alerts.length,
        coveragePercentage: summary.coverage.coveragePercentage
      });

      return summary;

    } catch (error) {
      this.logger.error('getPriceIntelligenceSummary', error as Error, {
        restaurantId
      });
      throw error;
    }
  }
}
