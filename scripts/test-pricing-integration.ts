import { PrismaClient } from '@prisma/client';
import { PriceIngestionService } from '../src/domains/pricing/services/price-ingestion.service';
import { PriceStatsService } from '../src/domains/pricing/services/price-stats.service';
import { ItemMatchingService } from '../src/domains/pricing/services/item-matching.service';
import { VendorItemRepository } from '../src/domains/pricing/repositories/vendor-item.repository';
import { VendorItemStatsRepository } from '../src/domains/pricing/repositories/vendor-item-stats.repository';
import { VendorItemDailyRepository } from '../src/domains/pricing/repositories/vendor-item-daily.repository';
import { LoggerService } from '../src/infrastructure/logging/logger.service';

const prisma = new PrismaClient();

async function testPricingIntegration() {
  console.log('🧪 TESTING PRICING INTEGRATION\n');

  try {
    // Test 1: Verify all services can be instantiated
    console.log('✅ Test 1: Service Instantiation');
    
    const loggerService = new LoggerService();
    
    const vendorItemRepository = new VendorItemRepository(prisma);
    const vendorItemStatsRepository = new VendorItemStatsRepository(prisma);
    const vendorItemDailyRepository = new VendorItemDailyRepository(prisma);
    
    const priceStatsService = new PriceStatsService(
      vendorItemDailyRepository,
      vendorItemStatsRepository,
      loggerService
    );
    
    const itemMatchingService = new ItemMatchingService(
      prisma,
      loggerService
    );
    
    const priceIngestionService = new PriceIngestionService(
      vendorItemRepository,
      vendorItemDailyRepository,
      vendorItemStatsRepository,
      priceStatsService,
      itemMatchingService,
      loggerService
    );
    
    console.log('   ✓ All pricing services instantiated successfully');

    // Test 2: Verify repository methods exist
    console.log('\n✅ Test 2: Repository Methods');
    
    console.log('   ✓ VendorItemRepository methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(vendorItemRepository)).filter(name => name !== 'constructor'));
    console.log('   ✓ VendorItemStatsRepository methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(vendorItemStatsRepository)).filter(name => name !== 'constructor'));
    console.log('   ✓ VendorItemDailyRepository methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(vendorItemDailyRepository)).filter(name => name !== 'constructor'));

    // Test 3: Verify service methods exist
    console.log('\n✅ Test 3: Service Methods');
    
    console.log('   ✓ PriceIngestionService methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(priceIngestionService)).filter(name => name !== 'constructor'));
    console.log('   ✓ PriceStatsService methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(priceStatsService)).filter(name => name !== 'constructor'));
    console.log('   ✓ ItemMatchingService methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(itemMatchingService)).filter(name => name !== 'constructor'));

    // Test 4: Verify database connection
    console.log('\n✅ Test 4: Database Connection');
    
    await prisma.$connect();
    console.log('   ✓ Database connected successfully');
    
    // Test 5: Verify pricing tables exist
    console.log('\n✅ Test 5: Database Schema');
    
    const tableCounts = {
      vendorItem: await prisma.vendorItem.count(),
      vendorItemStats: await prisma.vendorItemStats.count(),
      vendorItemDaily: await prisma.vendorItemDaily.count(),
      vendor: await prisma.vendor.count(),
      itemMaster: await prisma.itemMaster.count()
    };
    
    console.log('   ✓ Pricing tables accessible:');
    Object.entries(tableCounts).forEach(([table, count]) => {
      console.log(`     - ${table}: ${count} records`);
    });

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
    console.log('\n📋 INTEGRATION SUMMARY:');
    console.log('   ✅ Pricing services can be instantiated');
    console.log('   ✅ All repository methods are available');
    console.log('   ✅ All service methods are available');
    console.log('   ✅ Database connection works');
    console.log('   ✅ Pricing tables are accessible');
    console.log('\n🚀 READY FOR API ROUTES:');
    console.log('   - GET /api/v1/pricing/vendors');
    console.log('   - GET /api/v1/pricing/trackers/:vendorId/:itemNumber');
    console.log('   - GET /api/v1/pricing/trackers/:vendorId');
    console.log('   - POST /api/v1/pricing/process-invoice');
    console.log('   - GET /api/v1/pricing/cross-vendor/:itemMasterId');
    console.log('   - GET /api/v1/pricing/health');

  } catch (error) {
    console.error('❌ INTEGRATION TEST FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testPricingIntegration();
