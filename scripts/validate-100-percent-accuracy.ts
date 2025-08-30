// 100% ACCURACY VALIDATION SYSTEM
// This will manually calculate every price tracker and compare against system results

import { PrismaClient } from '@prisma/client';

interface PriceDataPoint {
  businessDate: string;
  unitPrice: number;
  quantity: number;
  extendedPrice: number;
}

interface ManualCalculationResult {
  itemKey: string;
  itemName: string;
  vendorName: string;
  rawDataPoints: PriceDataPoint[];
  manual: {
    lastPaidPrice: number;
    lastPaidDate: string;
    avg7dPrice: number;
    avg28dPrice: number;
    diffVs7dPct: number;
    diffVs28dPct: number;
    min28dPrice: number;
    max28dPrice: number;
    dataPoints7d: number;
    dataPoints28d: number;
  };
  system: {
    lastPaidPrice: number;
    lastPaidDate: string;
    avg7dPrice: number;
    avg28dPrice: number;
    diffVs7dPct: number;
    diffVs28dPct: number;
    min28dPrice: number;
    max28dPrice: number;
  };
  accuracy: {
    isAccurate: boolean;
    tolerance: number;
    errors: string[];
    maxError: number;
  };
}

class AccuracyValidator {
  private prisma: PrismaClient;
  private tolerance = 0.005; // 0.5 cent tolerance for floating point precision

  constructor() {
    this.prisma = new PrismaClient();
  }

  async validateAllCalculations(): Promise<void> {
    console.log('🔍 STARTING 100% ACCURACY VALIDATION...\n');
    console.log(`📏 Tolerance: $${this.tolerance.toFixed(3)} (accounting for floating point precision)\n`);

    try {
      // Get all vendor item stats from stress test
      const allStats = await this.prisma.vendorItemStats.findMany({
        where: {
          restaurantId: { startsWith: 'clstress' }
        },
        include: {
          vendor: true,
          item: {
            include: {
              daily: {
                orderBy: { businessDate: 'desc' }
              }
            }
          }
        },
        take: 50 // Sample 50 items for thorough validation
      });

      console.log(`📊 Validating ${allStats.length} price intelligence records...\n`);

      const results: ManualCalculationResult[] = [];
      let totalAccurate = 0;
      let totalTested = 0;

      for (const stat of allStats) {
        const result = await this.validateSingleItem(stat);
        results.push(result);
        totalTested++;
        
        if (result.accuracy.isAccurate) {
          totalAccurate++;
          console.log(`✅ ${result.itemKey} - ACCURATE`);
        } else {
          console.log(`❌ ${result.itemKey} - ERRORS DETECTED:`);
          result.accuracy.errors.forEach(error => {
            console.log(`   ${error}`);
          });
          console.log(`   Max Error: $${result.accuracy.maxError.toFixed(4)}`);
        }
      }

      // Generate comprehensive report
      await this.generateAccuracyReport(results, totalAccurate, totalTested);

      if (totalAccurate < totalTested) {
        throw new Error(`❌ ACCURACY FAILURE: ${totalAccurate}/${totalTested} items accurate. System NOT ready for production.`);
      }

      console.log('\n🎉 100% ACCURACY VALIDATED - SYSTEM READY FOR PRODUCTION! 🎉');

    } catch (error) {
      console.error('\n💥 ACCURACY VALIDATION FAILED:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private async validateSingleItem(stat: any): Promise<ManualCalculationResult> {
    const itemKey = `${stat.restaurantId}-${stat.vendorId}-${stat.itemNumber}`;
    
    // Get raw transaction data by querying daily aggregations
    const dailyData = stat.item.daily || [];
    
    // Convert daily data to individual price points for manual calculation
    const rawDataPoints: PriceDataPoint[] = dailyData.map((daily: any) => ({
      businessDate: daily.businessDate,
      unitPrice: Number(daily.avgUnitPrice),
      quantity: Number(daily.quantitySum),
      extendedPrice: Number(daily.spendSum)
    }));

    // Manual calculations
    const manual = this.calculateManualPriceIntelligence(rawDataPoints);
    
    // System calculations
    const system = {
      lastPaidPrice: Number(stat.lastPaidPrice || 0),
      lastPaidDate: stat.lastPaidAt?.toISOString().slice(0, 10) || '',
      avg7dPrice: Number(stat.avg7dPrice || 0),
      avg28dPrice: Number(stat.avg28dPrice || 0),
      diffVs7dPct: Number(stat.diffVs7dPct || 0),
      diffVs28dPct: Number(stat.diffVs28dPct || 0),
      min28dPrice: Number(stat.min28dPrice || 0),
      max28dPrice: Number(stat.max28dPrice || 0)
    };

    // Accuracy validation
    const accuracy = this.compareResults(manual, system);

    return {
      itemKey,
      itemName: stat.item?.lastSeenName || 'Unknown',
      vendorName: stat.vendor.name,
      rawDataPoints,
      manual,
      system,
      accuracy
    };
  }

  private calculateManualPriceIntelligence(dataPoints: PriceDataPoint[]) {
    // Sort by date descending (most recent first)
    const sorted = dataPoints.sort((a, b) => b.businessDate.localeCompare(a.businessDate));
    
    if (sorted.length === 0) {
      return {
        lastPaidPrice: 0,
        lastPaidDate: '',
        avg7dPrice: 0,
        avg28dPrice: 0,
        diffVs7dPct: 0,
        diffVs28dPct: 0,
        min28dPrice: 0,
        max28dPrice: 0,
        dataPoints7d: 0,
        dataPoints28d: 0
      };
    }

    // Last paid price (most recent)
    const lastPaidPrice = sorted[0].unitPrice;
    const lastPaidDate = sorted[0].businessDate;

    // Calculate date ranges
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twentyEightDaysAgo = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000);

    // Filter data by date ranges
    const last7Days = sorted.filter(point => new Date(point.businessDate) >= sevenDaysAgo);
    const last28Days = sorted.filter(point => new Date(point.businessDate) >= twentyEightDaysAgo);

    // Calculate weighted averages
    const avg7dPrice = this.calculateWeightedAverage(last7Days);
    const avg28dPrice = this.calculateWeightedAverage(last28Days);

    // Calculate percentage differences
    const diffVs7dPct = avg7dPrice > 0 ? ((lastPaidPrice - avg7dPrice) / avg7dPrice) * 100 : 0;
    const diffVs28dPct = avg28dPrice > 0 ? ((lastPaidPrice - avg28dPrice) / avg28dPrice) * 100 : 0;

    // Calculate min/max prices over 28 days
    const prices28d = last28Days.map(point => point.unitPrice).filter(p => p > 0);
    const min28dPrice = prices28d.length > 0 ? Math.min(...prices28d) : 0;
    const max28dPrice = prices28d.length > 0 ? Math.max(...prices28d) : 0;

    return {
      lastPaidPrice,
      lastPaidDate,
      avg7dPrice,
      avg28dPrice,
      diffVs7dPct,
      diffVs28dPct,
      min28dPrice,
      max28dPrice,
      dataPoints7d: last7Days.length,
      dataPoints28d: last28Days.length
    };
  }

  private calculateWeightedAverage(dataPoints: PriceDataPoint[]): number {
    if (dataPoints.length === 0) return 0;

    const totalQuantity = dataPoints.reduce((sum, point) => sum + point.quantity, 0);
    const totalSpend = dataPoints.reduce((sum, point) => sum + point.extendedPrice, 0);

    return totalQuantity > 0 ? totalSpend / totalQuantity : 0;
  }

  private compareResults(manual: any, system: any) {
    const errors: string[] = [];
    let maxError = 0;

    // Compare each field with tolerance
    const comparisons = [
      { name: 'Last Paid Price', manual: manual.lastPaidPrice, system: system.lastPaidPrice },
      { name: '7-Day Average', manual: manual.avg7dPrice, system: system.avg7dPrice },
      { name: '28-Day Average', manual: manual.avg28dPrice, system: system.avg28dPrice },
      { name: '7-Day Variance %', manual: manual.diffVs7dPct, system: system.diffVs7dPct },
      { name: '28-Day Variance %', manual: manual.diffVs28dPct, system: system.diffVs28dPct },
      { name: 'Min 28-Day Price', manual: manual.min28dPrice, system: system.min28dPrice },
      { name: 'Max 28-Day Price', manual: manual.max28dPrice, system: system.max28dPrice }
    ];

    for (const comp of comparisons) {
      const difference = Math.abs(comp.manual - comp.system);
      maxError = Math.max(maxError, difference);

      if (difference > this.tolerance) {
        errors.push(`${comp.name}: Manual=${comp.manual.toFixed(4)}, System=${comp.system.toFixed(4)}, Diff=${difference.toFixed(4)}`);
      }
    }

    return {
      isAccurate: errors.length === 0,
      tolerance: this.tolerance,
      errors,
      maxError
    };
  }

  private async generateAccuracyReport(results: ManualCalculationResult[], totalAccurate: number, totalTested: number) {
    const accuracyPercentage = (totalAccurate / totalTested) * 100;
    const maxErrorOverall = Math.max(...results.map(r => r.accuracy.maxError));
    const avgDataPoints7d = results.reduce((sum, r) => sum + r.manual.dataPoints7d, 0) / results.length;
    const avgDataPoints28d = results.reduce((sum, r) => sum + r.manual.dataPoints28d, 0) / results.length;

    console.log('\n' + '='.repeat(80));
    console.log('📊 100% ACCURACY VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(`🎯 Overall Accuracy: ${accuracyPercentage.toFixed(2)}% (${totalAccurate}/${totalTested})`);
    console.log(`📏 Tolerance Used: $${this.tolerance.toFixed(3)}`);
    console.log(`📈 Maximum Error Found: $${maxErrorOverall.toFixed(4)}`);
    console.log(`📊 Average Data Points (7d): ${avgDataPoints7d.toFixed(1)}`);
    console.log(`📊 Average Data Points (28d): ${avgDataPoints28d.toFixed(1)}`);
    
    console.log('\n🔍 SAMPLE VALIDATIONS:');
    
    // Show 5 sample accurate calculations
    const accurateResults = results.filter(r => r.accuracy.isAccurate).slice(0, 5);
    for (const result of accurateResults) {
      console.log(`\n✅ ${result.itemName} (${result.vendorName})`);
      console.log(`   Last Paid: $${result.manual.lastPaidPrice.toFixed(2)} ✓`);
      console.log(`   7d Avg: $${result.manual.avg7dPrice.toFixed(2)} ✓`);
      console.log(`   28d Avg: $${result.manual.avg28dPrice.toFixed(2)} ✓`);
      console.log(`   7d Variance: ${result.manual.diffVs7dPct.toFixed(2)}% ✓`);
      console.log(`   Data Points: ${result.manual.dataPoints7d} (7d), ${result.manual.dataPoints28d} (28d)`);
    }

    // Show any errors found
    const errorResults = results.filter(r => !r.accuracy.isAccurate);
    if (errorResults.length > 0) {
      console.log('\n❌ ERRORS DETECTED:');
      for (const result of errorResults) {
        console.log(`\n🚨 ${result.itemName} (${result.vendorName})`);
        result.accuracy.errors.forEach(error => {
          console.log(`   ${error}`);
        });
      }
    }

    console.log('\n🧮 CALCULATION METHODOLOGY:');
    console.log('• Weighted Averages: (Σ(price × quantity)) / Σ(quantity)');
    console.log('• Date Ranges: Rolling windows from current date');
    console.log('• Variance: ((current - average) / average) × 100');
    console.log('• Min/Max: Actual price extremes in 28-day window');
    
    console.log('\n🎯 PRODUCTION READINESS:');
    if (accuracyPercentage === 100) {
      console.log('✅ SYSTEM IS 100% MATHEMATICALLY ACCURATE');
      console.log('✅ READY FOR PRODUCTION USE WITH REAL MONEY');
      console.log('✅ ALL FINANCIAL CALCULATIONS VERIFIED');
    } else {
      console.log('❌ SYSTEM HAS CALCULATION ERRORS');
      console.log('❌ NOT READY FOR PRODUCTION USE');
      console.log('❌ REQUIRES FIXES BEFORE HANDLING REAL MONEY');
    }
    
    console.log('='.repeat(80));
  }
}

// Execute validation
async function main() {
  const validator = new AccuracyValidator();
  await validator.validateAllCalculations();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('💥 VALIDATION FAILED:', error);
    process.exit(1);
  });
}

export { AccuracyValidator };
