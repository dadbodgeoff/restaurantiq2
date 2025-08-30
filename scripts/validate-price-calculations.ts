// Quick validation script to see actual calculated values
import { PrismaClient } from '@prisma/client';

async function validateCalculations() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 ACTUAL PRICE INTELLIGENCE VALUES\n');
    
    // Get all vendor item stats for our test restaurant
    const stats = await prisma.vendorItemStats.findMany({
      where: {
        restaurantId: 'clq1234567890abcdefghijkl'
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

    for (const stat of stats) {
      console.log(`📊 ${stat.item?.lastSeenName || 'Unknown Item'} (${stat.vendor.name})`);
      console.log(`   Last Paid: $${stat.lastPaidPrice?.toFixed(2) || 'N/A'} at ${stat.lastPaidAt?.toISOString().slice(0, 10) || 'N/A'}`);
      console.log(`   7-Day Avg: $${stat.avg7dPrice?.toFixed(2) || 'N/A'}`);
      console.log(`   28-Day Avg: $${stat.avg28dPrice?.toFixed(2) || 'N/A'}`);
      console.log(`   Variance vs 7d: ${stat.diffVs7dPct?.toFixed(2) || 'N/A'}%`);
      console.log(`   Variance vs 28d: ${stat.diffVs28dPct?.toFixed(2) || 'N/A'}%`);
      console.log(`   Min/Max 28d: $${stat.min28dPrice?.toFixed(2) || 'N/A'} - $${stat.max28dPrice?.toFixed(2) || 'N/A'}`);
      
      if (stat.bestPriceAcrossVendors) {
        console.log(`   Best Price Available: $${stat.bestPriceAcrossVendors.toFixed(2)} from ${stat.bestVendorName}`);
        console.log(`   Savings Opportunity: ${stat.diffVsBestPct?.toFixed(2) || 'N/A'}%`);
      }
      console.log('');
    }

    // Show some daily data for context
    console.log('📈 SAMPLE DAILY DATA (Last 10 records):\n');
    const dailyData = await prisma.vendorItemDaily.findMany({
      where: {
        restaurantId: 'clq1234567890abcdefghijkl'
      },
      include: {
        vendor: true,
        item: true
      },
      orderBy: { businessDate: 'desc' },
      take: 10
    });

    for (const daily of dailyData) {
      console.log(`${daily.businessDate}: ${daily.item?.lastSeenName} - $${daily.avgUnitPrice.toFixed(2)} (qty: ${daily.quantitySum})`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

validateCalculations().catch(console.error);
