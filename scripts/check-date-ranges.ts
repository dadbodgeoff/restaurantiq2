// Check what date ranges were actually generated
import { PrismaClient } from '@prisma/client';

async function checkDateRanges() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📅 CHECKING ACTUAL DATE RANGES IN DATA\n');
    
    // Check the date range of daily data
    const dateRange = await prisma.vendorItemDaily.aggregate({
      where: { restaurantId: { startsWith: 'clstress' } },
      _min: { businessDate: true },
      _max: { businessDate: true }
    });
    
    console.log('📊 DAILY DATA DATE RANGE:');
    console.log('Earliest Date:', dateRange._min?.businessDate);
    console.log('Latest Date:', dateRange._max?.businessDate);
    
    // Calculate the span
    if (dateRange._min?.businessDate && dateRange._max?.businessDate) {
      const start = new Date(dateRange._min.businessDate);
      const end = new Date(dateRange._max.businessDate);
      const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      console.log('Total Days Span:', daysDiff + 1, 'days');
    }
    
    // Count records by date
    console.log('\n📈 DAILY RECORD COUNTS:');
    const dailyCounts = await prisma.vendorItemDaily.groupBy({
      by: ['businessDate'],
      where: { restaurantId: { startsWith: 'clstress' } },
      _count: { id: true },
      orderBy: { businessDate: 'desc' },
      take: 15
    });
    
    dailyCounts.forEach((day: any) => {
      console.log(`${day.businessDate}: ${day._count.id} records`);
    });
    
    // Check what the stress test was supposed to generate vs what it did
    console.log('\n🔧 STRESS TEST ANALYSIS:');
    console.log('Configured to generate: 90 days of data');
    
    const today = new Date();
    console.log('Today is:', today.toISOString().slice(0, 10));
    
    if (dateRange._max?.businessDate) {
      const actualLatest = new Date(dateRange._max.businessDate);
      const daysSinceLatest = Math.floor((today.getTime() - actualLatest.getTime()) / (1000 * 60 * 60 * 24));
      console.log('Latest data is from:', daysSinceLatest, 'days ago');
      
      if (daysSinceLatest > 28) {
        console.log('🔍 EXPLANATION: The stress test generated data in the past');
        console.log('   This means there is NO data within the last 28 days');
        console.log('   So 28-day calculations return 0 because the date filter finds nothing');
        console.log('   This is CORRECT behavior - system is working as designed!');
      } else {
        console.log('✅ Data is recent enough for 28-day calculations');
      }
    }
    
    // Check a specific item's daily data
    console.log('\n📋 SAMPLE ITEM DAILY DATA:');
    const sampleItem = await prisma.vendorItemDaily.findMany({
      where: { 
        restaurantId: { startsWith: 'clstress' },
        itemNumber: 'ITEM-01-001'
      },
      orderBy: { businessDate: 'desc' },
      take: 10,
      include: { item: true }
    });
    
    if (sampleItem.length > 0) {
      console.log('Item:', sampleItem[0].item?.lastSeenName);
      sampleItem.forEach((day: any) => {
        console.log(`  ${day.businessDate}: $${Number(day.avgUnitPrice).toFixed(2)} (qty: ${day.quantitySum})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDateRanges().catch(console.error);
