// Quick spot-check to verify accuracy
import { PrismaClient } from '@prisma/client';

async function spotCheckAccuracy() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 SPOT-CHECK ACCURACY VALIDATION\n');
    
    // Get one item and manually verify its calculation
    const stats = await prisma.vendorItemStats.findFirst({
      where: { restaurantId: { startsWith: 'clstress' } },
      include: {
        vendor: true,
        item: {
          include: {
            daily: {
              orderBy: { businessDate: 'desc' },
              take: 30
            }
          }
        }
      }
    });
    
    if (!stats) {
      console.log('No stats found');
      return;
    }
    
    console.log('📊 TESTING ITEM:', stats.item?.lastSeenName);
    console.log('🏪 VENDOR:', stats.vendor.name);
    console.log();
    
    // System calculations
    console.log('🤖 SYSTEM CALCULATIONS:');
    console.log('Last Paid Price: $' + (stats.lastPaidPrice || 0).toFixed(2));
    console.log('7-Day Average: $' + (stats.avg7dPrice || 0).toFixed(2));
    console.log('28-Day Average: $' + (stats.avg28dPrice || 0).toFixed(2));
    console.log();
    
    // Manual calculation using daily data
    const dailyData = stats.item?.daily || [];
    console.log('📈 MANUAL CALCULATION FROM DAILY DATA:');
    console.log('Daily records found:', dailyData.length);
    
    if (dailyData.length > 0) {
      // Sort by date descending
      const sorted = dailyData.sort((a, b) => b.businessDate.localeCompare(a.businessDate));
      
      // Last paid price (most recent)
      const lastPaidManual = Number(sorted[0].avgUnitPrice);
      console.log('Last Paid (most recent): $' + lastPaidManual.toFixed(2));
      
      // Calculate 7-day and 28-day weighted averages
      // Use the latest date in the data as "today" instead of actual today
      const latestDate = new Date(sorted[0].businessDate + 'T00:00:00.000Z');
      const sevenDaysAgo = new Date(latestDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twentyEightDaysAgo = new Date(latestDate.getTime() - 28 * 24 * 60 * 60 * 1000);
      
      const last7Days = sorted.filter(d => new Date(d.businessDate) >= sevenDaysAgo);
      const last28Days = sorted.filter(d => new Date(d.businessDate) >= twentyEightDaysAgo);
      
      const totalSpend7d = last7Days.reduce((sum, d) => sum + Number(d.spendSum || 0), 0);
      const totalQty7d = last7Days.reduce((sum, d) => sum + Number(d.quantitySum || 0), 0);
      const calc7d = totalQty7d > 0 ? totalSpend7d / totalQty7d : 0;
      
      const totalSpend28d = last28Days.reduce((sum, d) => sum + Number(d.spendSum || 0), 0);
      const totalQty28d = last28Days.reduce((sum, d) => sum + Number(d.quantitySum || 0), 0);
      const calc28d = totalQty28d > 0 ? totalSpend28d / totalQty28d : 0;
      
      console.log('7-Day Manual Calc: $' + calc7d.toFixed(2) + ' (from ' + last7Days.length + ' days)');
      console.log('28-Day Manual Calc: $' + calc28d.toFixed(2) + ' (from ' + last28Days.length + ' days)');
      
      console.log();
      console.log('📏 ACCURACY CHECK:');
      const diff7d = Math.abs((stats.avg7dPrice || 0) - calc7d);
      const diff28d = Math.abs((stats.avg28dPrice || 0) - calc28d);
      
      console.log('7-Day Difference: $' + diff7d.toFixed(4));
      console.log('28-Day Difference: $' + diff28d.toFixed(4));
      
      const tolerance = 0.01; // 1 cent tolerance
      if (diff7d < tolerance && diff28d < tolerance) {
        console.log('✅ CALCULATIONS ARE ACCURATE!');
        console.log('🎯 SYSTEM IS WORKING CORRECTLY!');
      } else {
        console.log('❌ Significant differences found');
        console.log('🔧 System needs calibration');
      }
      
      // Show sample data for transparency
      console.log('\n📋 SAMPLE DAILY DATA (last 5 days):');
      for (let i = 0; i < Math.min(5, sorted.length); i++) {
        const day = sorted[i];
        console.log(`${day.businessDate}: $${Number(day.avgUnitPrice).toFixed(2)} (qty: ${Number(day.quantitySum)}, spend: $${Number(day.spendSum).toFixed(2)})`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

spotCheckAccuracy().catch(console.error);
