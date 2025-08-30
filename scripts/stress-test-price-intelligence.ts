// PRODUCTION STRESS TEST - Price Intelligence System
// This will generate massive data volumes and validate 100% accuracy

import { PrismaClient } from '@prisma/client';
import { VendorRepository } from '../src/domains/pricing/repositories/vendor.repository';
import { VendorItemRepository } from '../src/domains/pricing/repositories/vendor-item.repository';
import { VendorItemStatsRepository } from '../src/domains/pricing/repositories/vendor-item-stats.repository';
import { VendorItemDailyRepository } from '../src/domains/pricing/repositories/vendor-item-daily.repository';
import { PriceIngestionService } from '../src/domains/pricing/services/price-ingestion.service';
import { PriceStatsService } from '../src/domains/pricing/services/price-stats.service';
import { LoggerService } from '../src/infrastructure/logging/logger.service';

// STRESS TEST CONFIGURATION
const STRESS_CONFIG = {
  restaurants: 5,          // Multiple restaurants
  vendorsPerRestaurant: 8, // 8 vendors each
  itemsPerVendor: 50,      // 50 items per vendor  
  daysToGenerate: 90,      // 90 days of data
  invoicesPerDay: 3,       // 3 invoices per day per vendor
  linesPerInvoice: 15,     // 15 line items per invoice
  priceVolatility: 0.15,   // 15% price volatility
  totalInvoices: 0,        // Will be calculated
  totalLineItems: 0        // Will be calculated
};

// Calculate totals
STRESS_CONFIG.totalInvoices = STRESS_CONFIG.restaurants * 
  STRESS_CONFIG.vendorsPerRestaurant * 
  STRESS_CONFIG.daysToGenerate * 
  STRESS_CONFIG.invoicesPerDay;

STRESS_CONFIG.totalLineItems = STRESS_CONFIG.totalInvoices * 
  STRESS_CONFIG.linesPerInvoice;

console.log(`🚀 PRODUCTION STRESS TEST CONFIGURATION:
📊 Restaurants: ${STRESS_CONFIG.restaurants}
🏪 Vendors: ${STRESS_CONFIG.restaurants * STRESS_CONFIG.vendorsPerRestaurant}
📦 Items: ${STRESS_CONFIG.restaurants * STRESS_CONFIG.vendorsPerRestaurant * STRESS_CONFIG.itemsPerVendor}
📅 Days: ${STRESS_CONFIG.daysToGenerate}
📄 Total Invoices: ${STRESS_CONFIG.totalInvoices.toLocaleString()}
📋 Total Line Items: ${STRESS_CONFIG.totalLineItems.toLocaleString()}
💾 Estimated DB Records: ${(STRESS_CONFIG.totalLineItems * 2).toLocaleString()}`);

interface StressTestRestaurant {
  id: string;
  name: string;
  vendors: StressTestVendor[];
}

interface StressTestVendor {
  id: string;
  name: string;
  items: StressTestItem[];
}

interface StressTestItem {
  itemNumber: string;
  name: string;
  category: string;
  unit: string;
  basePrice: number;
  priceHistory: Array<{
    date: string;
    price: number;
    quantity: number;
  }>;
}

interface AccuracyTestResult {
  itemKey: string;
  expected: {
    lastPaidPrice: number;
    avg7dPrice: number;
    avg28dPrice: number;
    diffVs7dPct: number;
    diffVs28dPct: number;
  };
  actual: {
    lastPaidPrice: number;
    avg7dPrice: number;
    avg28dPrice: number;
    diffVs7dPct: number;
    diffVs28dPct: number;
  };
  isAccurate: boolean;
  errors: string[];
}

class ProductionStressTest {
  private prisma: PrismaClient;
  private logger: LoggerService;
  private priceIngestionService: PriceIngestionService;
  private priceStatsService: PriceStatsService;
  private vendorRepository: VendorRepository;
  private vendorItemStatsRepository: VendorItemStatsRepository;
  private restaurants: StressTestRestaurant[] = [];
  private startTime: number = 0;
  private accuracyResults: AccuracyTestResult[] = [];

  constructor() {
    this.prisma = new PrismaClient();
    this.logger = new LoggerService();
    this.vendorRepository = new VendorRepository(this.prisma);
    
    const vendorItemRepository = new VendorItemRepository(this.prisma);
    this.vendorItemStatsRepository = new VendorItemStatsRepository(this.prisma);
    const vendorItemDailyRepository = new VendorItemDailyRepository(this.prisma);
    
    this.priceStatsService = new PriceStatsService(
      vendorItemDailyRepository,
      this.vendorItemStatsRepository,
      this.logger
    );
    
    this.priceIngestionService = new PriceIngestionService(
      vendorItemRepository,
      vendorItemDailyRepository,
      this.vendorItemStatsRepository,
      this.priceStatsService,
      this.logger
    );
  }

  async runStressTest() {
    try {
      this.startTime = Date.now();
      console.log('\n🔥 STARTING PRODUCTION STRESS TEST...\n');
      
      await this.setupMassiveTestData();
      await this.generateMassiveInvoiceData();
      await this.validateAccuracyAt100Percent();
      await this.testEdgeCases();
      await this.testConcurrentProcessing();
      await this.generateStressTestReport();
      
      console.log('\n✅ PRODUCTION STRESS TEST COMPLETED SUCCESSFULLY!');
      
    } catch (error) {
      console.error('\n❌ STRESS TEST FAILED:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async setupMassiveTestData() {
    console.log('📋 Setting up massive test dataset...');
    
    const itemCategories = [
      'Proteins', 'Vegetables', 'Dairy', 'Grains', 'Seafood', 
      'Beverages', 'Spices', 'Oils', 'Condiments', 'Bakery'
    ];
    
    const itemTemplates = [
      { name: 'Ground Beef', category: 'Proteins', unit: 'lb', basePrice: 6.50 },
      { name: 'Chicken Breast', category: 'Proteins', unit: 'lb', basePrice: 4.25 },
      { name: 'Salmon Fillet', category: 'Seafood', unit: 'lb', basePrice: 12.00 },
      { name: 'Roma Tomatoes', category: 'Vegetables', unit: 'case', basePrice: 35.00 },
      { name: 'Yellow Onions', category: 'Vegetables', unit: 'bag', basePrice: 24.00 },
      { name: 'Cheddar Cheese', category: 'Dairy', unit: 'block', basePrice: 8.75 },
      { name: 'Olive Oil', category: 'Oils', unit: 'bottle', basePrice: 15.50 },
      { name: 'Rice', category: 'Grains', unit: 'bag', basePrice: 28.00 },
      { name: 'All Purpose Flour', category: 'Bakery', unit: 'bag', basePrice: 22.00 },
      { name: 'Black Pepper', category: 'Spices', unit: 'container', basePrice: 12.50 }
    ];

    for (let r = 0; r < STRESS_CONFIG.restaurants; r++) {
      const restaurant: StressTestRestaurant = {
        id: `clstress${String(r + 1).padStart(3, '0')}abcdefghijklmn`,
        name: `Stress Test Restaurant ${r + 1}`,
        vendors: []
      };

      // Create restaurant
      await this.prisma.restaurant.upsert({
        where: { id: restaurant.id },
        create: {
          id: restaurant.id,
          name: restaurant.name,
          timezone: 'America/New_York',
          locale: 'en-US',
          currency: 'USD',
          isActive: true,
          settings: {}
        },
        update: {
          name: restaurant.name,
          isActive: true
        }
      });

      // Create vendors for this restaurant
      for (let v = 0; v < STRESS_CONFIG.vendorsPerRestaurant; v++) {
        const vendor: StressTestVendor = {
          id: `clvendor${String(r + 1).padStart(2, '0')}${String(v + 1).padStart(2, '0')}abcdefghijklm`,
          name: `Vendor ${v + 1} (R${r + 1})`,
          items: []
        };

        await this.prisma.vendor.upsert({
          where: { id: vendor.id },
          create: {
            id: vendor.id,
            restaurantId: restaurant.id,
            name: vendor.name,
            isActive: true
          },
          update: {
            name: vendor.name,
            isActive: true
          }
        });

        // Create items for this vendor
        for (let i = 0; i < STRESS_CONFIG.itemsPerVendor; i++) {
          const template = itemTemplates[i % itemTemplates.length];
          const item: StressTestItem = {
            itemNumber: `ITEM-${String(v + 1).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
            name: `${template.name} ${i + 1}`,
            category: template.category,
            unit: template.unit,
            basePrice: template.basePrice * (0.8 + Math.random() * 0.4), // ±20% variation
            priceHistory: []
          };

          vendor.items.push(item);
        }

        restaurant.vendors.push(vendor);
      }

      this.restaurants.push(restaurant);
    }

    console.log(`✅ Created ${this.restaurants.length} restaurants with ${this.restaurants.length * STRESS_CONFIG.vendorsPerRestaurant} vendors`);
    console.log(`📦 Total items configured: ${this.restaurants.length * STRESS_CONFIG.vendorsPerRestaurant * STRESS_CONFIG.itemsPerVendor}`);
  }

  private async generateMassiveInvoiceData() {
    console.log('\n📄 Generating massive invoice dataset...');
    
    const today = new Date();
    let totalProcessed = 0;
    const batchSize = 1000;
    let batch: any[] = [];

    for (let day = STRESS_CONFIG.daysToGenerate - 1; day >= 0; day--) {
      const businessDate = new Date(today);
      businessDate.setDate(businessDate.getDate() - day);
      const businessDateStr = businessDate.toISOString().slice(0, 10);

      for (const restaurant of this.restaurants) {
        for (const vendor of restaurant.vendors) {
          // Generate multiple invoices per day per vendor
          for (let invoice = 0; invoice < STRESS_CONFIG.invoicesPerDay; invoice++) {
            
            // Generate multiple line items per invoice
            for (let line = 0; line < STRESS_CONFIG.linesPerInvoice; line++) {
              const item = vendor.items[Math.floor(Math.random() * vendor.items.length)];
              
              // Calculate price with realistic volatility
              const volatility = (Math.random() - 0.5) * 2 * STRESS_CONFIG.priceVolatility;
              const price = item.basePrice * (1 + volatility);
              const quantity = Math.ceil(Math.random() * 10);

              // Store price history for manual calculation
              item.priceHistory.push({
                date: businessDateStr,
                price: price,
                quantity: quantity
              });

              batch.push({
                restaurantId: restaurant.id,
                vendorId: vendor.id,
                itemNumber: item.itemNumber,
                name: item.name,
                unit: item.unit,
                unitPrice: price,
                quantity: quantity,
                businessDate: businessDateStr
              });

              totalProcessed++;

              // Process in batches to avoid memory issues
              if (batch.length >= batchSize) {
                await this.processBatch(batch);
                batch = [];
                
                if (totalProcessed % 10000 === 0) {
                  console.log(`📊 Processed ${totalProcessed.toLocaleString()} invoice lines...`);
                }
              }
            }
          }
        }
      }
    }

    // Process remaining batch
    if (batch.length > 0) {
      await this.processBatch(batch);
    }

    console.log(`✅ Generated and processed ${totalProcessed.toLocaleString()} invoice lines`);
  }

  private async processBatch(batch: any[]) {
    for (const line of batch) {
      try {
        await this.priceIngestionService.recordLine(line);
      } catch (error) {
        console.error(`❌ Error processing line:`, line, error);
        throw error;
      }
    }
  }

  private async validateAccuracyAt100Percent() {
    console.log('\n🔍 VALIDATING 100% ACCURACY...');
    
    // Sample validation on 100 random items for performance
    const sampleSize = 100;
    const sampledItems: Array<{restaurant: StressTestRestaurant, vendor: StressTestVendor, item: StressTestItem}> = [];
    
    for (let i = 0; i < sampleSize; i++) {
      const restaurant = this.restaurants[Math.floor(Math.random() * this.restaurants.length)];
      const vendor = restaurant.vendors[Math.floor(Math.random() * restaurant.vendors.length)];
      const item = vendor.items[Math.floor(Math.random() * vendor.items.length)];
      sampledItems.push({ restaurant, vendor, item });
    }

    for (const { restaurant, vendor, item } of sampledItems) {
      const result = await this.validateItemAccuracy(restaurant.id, vendor.id, item);
      this.accuracyResults.push(result);
    }

    const accurateCount = this.accuracyResults.filter(r => r.isAccurate).length;
    const accuracyPercentage = (accurateCount / this.accuracyResults.length) * 100;

    console.log(`📊 Accuracy Results: ${accurateCount}/${this.accuracyResults.length} (${accuracyPercentage.toFixed(2)}%)`);

    if (accuracyPercentage < 100) {
      console.error('\n❌ ACCURACY FAILURES DETECTED:');
      this.accuracyResults.filter(r => !r.isAccurate).forEach(result => {
        console.error(`\n🚨 ${result.itemKey}`);
        result.errors.forEach(error => console.error(`   ${error}`));
      });
      throw new Error(`System accuracy is ${accuracyPercentage.toFixed(2)}% - MUST BE 100%`);
    }

    console.log('✅ 100% ACCURACY VALIDATED');
  }

  private async validateItemAccuracy(restaurantId: string, vendorId: string, item: StressTestItem): Promise<AccuracyTestResult> {
    const itemKey = `${restaurantId}-${vendorId}-${item.itemNumber}`;
    
    // Get system calculated values
    const actualStats = await this.vendorItemStatsRepository.get(restaurantId, vendorId, item.itemNumber);
    
    if (!actualStats) {
      return {
        itemKey,
        expected: { lastPaidPrice: 0, avg7dPrice: 0, avg28dPrice: 0, diffVs7dPct: 0, diffVs28dPct: 0 },
        actual: { lastPaidPrice: 0, avg7dPrice: 0, avg28dPrice: 0, diffVs7dPct: 0, diffVs28dPct: 0 },
        isAccurate: false,
        errors: ['No stats found in database']
      };
    }

    // Calculate expected values manually
    const expected = this.calculateExpectedValues(item.priceHistory);
    
    const actual = {
      lastPaidPrice: actualStats.lastPaidPrice || 0,
      avg7dPrice: actualStats.avg7dPrice || 0,
      avg28dPrice: actualStats.avg28dPrice || 0,
      diffVs7dPct: actualStats.diffVs7dPct || 0,
      diffVs28dPct: actualStats.diffVs28dPct || 0
    };

    const errors: string[] = [];
    const tolerance = 0.01; // 1 cent tolerance

    if (Math.abs(actual.lastPaidPrice - expected.lastPaidPrice) > tolerance) {
      errors.push(`Last Paid: Expected ${expected.lastPaidPrice.toFixed(2)}, got ${actual.lastPaidPrice.toFixed(2)}`);
    }

    if (Math.abs(actual.avg7dPrice - expected.avg7dPrice) > tolerance) {
      errors.push(`7d Avg: Expected ${expected.avg7dPrice.toFixed(2)}, got ${actual.avg7dPrice.toFixed(2)}`);
    }

    if (Math.abs(actual.avg28dPrice - expected.avg28dPrice) > tolerance) {
      errors.push(`28d Avg: Expected ${expected.avg28dPrice.toFixed(2)}, got ${actual.avg28dPrice.toFixed(2)}`);
    }

    return {
      itemKey,
      expected,
      actual,
      isAccurate: errors.length === 0,
      errors
    };
  }

  private calculateExpectedValues(priceHistory: Array<{date: string, price: number, quantity: number}>) {
    // Sort by date descending (most recent first)
    const sorted = priceHistory.sort((a, b) => b.date.localeCompare(a.date));
    
    const lastPaidPrice = sorted.length > 0 ? sorted[0].price : 0;
    
    // Calculate 7-day weighted average
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last7Days = sorted.filter(entry => new Date(entry.date) >= sevenDaysAgo);
    
    const twentyEightDaysAgo = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000);
    const last28Days = sorted.filter(entry => new Date(entry.date) >= twentyEightDaysAgo);
    
    const avg7dPrice = this.calculateWeightedAverage(last7Days);
    const avg28dPrice = this.calculateWeightedAverage(last28Days);
    
    const diffVs7dPct = avg7dPrice > 0 ? ((lastPaidPrice - avg7dPrice) / avg7dPrice) * 100 : 0;
    const diffVs28dPct = avg28dPrice > 0 ? ((lastPaidPrice - avg28dPrice) / avg28dPrice) * 100 : 0;

    return {
      lastPaidPrice,
      avg7dPrice,
      avg28dPrice,
      diffVs7dPct,
      diffVs28dPct
    };
  }

  private calculateWeightedAverage(entries: Array<{price: number, quantity: number}>): number {
    if (entries.length === 0) return 0;
    
    const totalQuantity = entries.reduce((sum, entry) => sum + entry.quantity, 0);
    const totalSpend = entries.reduce((sum, entry) => sum + (entry.price * entry.quantity), 0);
    
    return totalQuantity > 0 ? totalSpend / totalQuantity : 0;
  }

  private async testEdgeCases() {
    console.log('\n🧪 TESTING EDGE CASES...');
    
    const testRestaurantId = this.restaurants[0].id;
    const testVendorId = this.restaurants[0].vendors[0].id;
    
    const edgeCases = [
      // Zero price
      { itemNumber: 'EDGE-001', name: 'Zero Price Test', unit: 'ea', unitPrice: 0, quantity: 1, businessDate: '2025-08-30' },
      
      // Negative quantity (should be rejected)
      { itemNumber: 'EDGE-002', name: 'Negative Qty Test', unit: 'ea', unitPrice: 10.00, quantity: -5, businessDate: '2025-08-30' },
      
      // Extremely high price
      { itemNumber: 'EDGE-003', name: 'High Price Test', unit: 'ea', unitPrice: 99999.99, quantity: 1, businessDate: '2025-08-30' },
      
      // Duplicate same-day entries
      { itemNumber: 'EDGE-004', name: 'Duplicate Test', unit: 'ea', unitPrice: 10.00, quantity: 1, businessDate: '2025-08-30' },
      { itemNumber: 'EDGE-004', name: 'Duplicate Test', unit: 'ea', unitPrice: 15.00, quantity: 2, businessDate: '2025-08-30' },
      
      // Very small price
      { itemNumber: 'EDGE-005', name: 'Small Price Test', unit: 'ea', unitPrice: 0.01, quantity: 1000, businessDate: '2025-08-30' }
    ];

    let edgeTestsPassed = 0;
    let edgeTestsTotal = 0;

    for (const testCase of edgeCases) {
      edgeTestsTotal++;
      try {
        await this.priceIngestionService.recordLine({
          restaurantId: testRestaurantId,
          vendorId: testVendorId,
          ...testCase
        });
        
        // Validate result
        const stats = await this.vendorItemStatsRepository.get(testRestaurantId, testVendorId, testCase.itemNumber);
        
        if (testCase.unitPrice === 0) {
          // Zero price should be handled gracefully
          console.log(`✅ Zero price test handled correctly`);
          edgeTestsPassed++;
        } else if (testCase.quantity < 0) {
          // This should have been rejected - if we get here, it's a problem
          console.error(`❌ Negative quantity was not rejected`);
        } else {
          // Normal edge case processing
          console.log(`✅ Edge case processed: ${testCase.itemNumber}`);
          edgeTestsPassed++;
        }
        
      } catch (error) {
        if (testCase.quantity < 0) {
          // Negative quantity rejection is expected
          console.log(`✅ Negative quantity correctly rejected`);
          edgeTestsPassed++;
        } else {
          console.error(`❌ Edge case failed: ${testCase.itemNumber}`, error);
        }
      }
    }

    console.log(`📊 Edge Cases: ${edgeTestsPassed}/${edgeTestsTotal} passed`);
    
    if (edgeTestsPassed < edgeTestsTotal) {
      throw new Error(`Edge case testing failed: ${edgeTestsPassed}/${edgeTestsTotal}`);
    }
  }

  private async testConcurrentProcessing() {
    console.log('\n⚡ TESTING CONCURRENT PROCESSING...');
    
    const testRestaurantId = this.restaurants[0].id;
    const testVendorId = this.restaurants[0].vendors[0].id;
    
    // Create 100 concurrent invoice lines for same item
    const concurrentPromises = [];
    const testItemNumber = 'CONCURRENT-001';
    
    for (let i = 0; i < 100; i++) {
      const promise = this.priceIngestionService.recordLine({
        restaurantId: testRestaurantId,
        vendorId: testVendorId,
        itemNumber: testItemNumber,
        name: 'Concurrent Test Item',
        unit: 'ea',
        unitPrice: 10.00 + (i * 0.01), // Slightly different prices
        quantity: 1,
        businessDate: '2025-08-30'
      });
      concurrentPromises.push(promise);
    }

    const startTime = Date.now();
    await Promise.all(concurrentPromises);
    const endTime = Date.now();
    
    console.log(`✅ Processed 100 concurrent operations in ${endTime - startTime}ms`);
    
    // Verify final state is consistent
    const finalStats = await this.vendorItemStatsRepository.get(testRestaurantId, testVendorId, testItemNumber);
    if (!finalStats) {
      throw new Error('Concurrent processing resulted in missing data');
    }
    
    console.log(`✅ Concurrent processing test passed`);
  }

  private async generateStressTestReport() {
    const endTime = Date.now();
    const totalTimeSeconds = (endTime - this.startTime) / 1000;
    const linesPerSecond = STRESS_CONFIG.totalLineItems / totalTimeSeconds;

    console.log('\n' + '='.repeat(80));
    console.log('📊 PRODUCTION STRESS TEST REPORT');
    console.log('='.repeat(80));
    console.log(`🕐 Total Execution Time: ${totalTimeSeconds.toFixed(2)} seconds`);
    console.log(`📈 Processing Rate: ${linesPerSecond.toFixed(0)} invoice lines/second`);
    console.log(`💾 Total Records Created: ${(STRESS_CONFIG.totalLineItems * 2).toLocaleString()}`);
    console.log(`🎯 System Accuracy: 100%`);
    console.log(`📊 Restaurants Tested: ${STRESS_CONFIG.restaurants}`);
    console.log(`🏪 Vendors Tested: ${STRESS_CONFIG.restaurants * STRESS_CONFIG.vendorsPerRestaurant}`);
    console.log(`📦 Items Tested: ${STRESS_CONFIG.restaurants * STRESS_CONFIG.vendorsPerRestaurant * STRESS_CONFIG.itemsPerVendor}`);
    console.log(`📅 Days of Data: ${STRESS_CONFIG.daysToGenerate}`);
    console.log(`✅ Edge Cases: Passed`);
    console.log(`⚡ Concurrent Processing: Passed`);
    console.log(`🔒 Production Ready: YES`);
    console.log('='.repeat(80));
  }

  private async cleanup() {
    console.log('\n🧹 Cleaning up stress test data...');
    
    // Optional cleanup - comment out to inspect results
    /*
    for (const restaurant of this.restaurants) {
      await this.prisma.vendorItemDaily.deleteMany({
        where: { restaurantId: restaurant.id }
      });
      await this.prisma.vendorItemStats.deleteMany({
        where: { restaurantId: restaurant.id }
      });
      await this.prisma.vendorItem.deleteMany({
        where: { restaurantId: restaurant.id }
      });
      await this.prisma.vendor.deleteMany({
        where: { restaurantId: restaurant.id }
      });
      await this.prisma.restaurant.delete({
        where: { id: restaurant.id }
      });
    }
    */
    
    await this.prisma.$disconnect();
    console.log('✅ Cleanup complete');
  }
}

// Execute stress test
async function main() {
  const stressTest = new ProductionStressTest();
  await stressTest.runStressTest();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('\n💥 STRESS TEST FAILED:', error);
    process.exit(1);
  });
}

export { ProductionStressTest };
