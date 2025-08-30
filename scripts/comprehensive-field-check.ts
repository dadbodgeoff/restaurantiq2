// Comprehensive check of ALL price intelligence data fields
import { PrismaClient } from '@prisma/client';

async function checkAllFields() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 COMPREHENSIVE DATA FIELD VALIDATION\n');
    
    // Get sample data to check all fields
    const sampleStats = await prisma.vendorItemStats.findMany({
      where: { restaurantId: { startsWith: 'clstress' } },
      include: {
        vendor: true,
        item: {
          include: {
            daily: {
              orderBy: { businessDate: 'desc' },
              take: 10
            }
          }
        }
      },
      take: 5
    });
    
    console.log(`📊 TESTING ${sampleStats.length} SAMPLE ITEMS FOR ALL FIELDS\n`);
    
    for (let i = 0; i < sampleStats.length; i++) {
      const stat = sampleStats[i];
      const item = stat.item;
      const vendor = stat.vendor;
      
      console.log(`\n📦 ITEM ${i + 1}: ${item?.lastSeenName || 'Unknown'} (${vendor.name})`);
      console.log('=' .repeat(60));
      
      // Core identification fields
      console.log('🔍 IDENTIFICATION FIELDS:');
      console.log(`   Restaurant ID: ${stat.restaurantId} ✓`);
      console.log(`   Vendor ID: ${stat.vendorId} ✓`);
      console.log(`   Item Number: ${stat.itemNumber} ✓`);
      
      // Main price tracker fields
      console.log('\n💰 MAIN PRICE TRACKERS:');
      console.log(`   1️⃣ Last Paid Price: $${(stat.lastPaidPrice || 0).toFixed(2)} ${stat.lastPaidPrice ? '✅' : '⚠️'}`);
      console.log(`   📅 Last Paid Date: ${stat.lastPaidAt?.toISOString().slice(0, 10) || 'N/A'} ${stat.lastPaidAt ? '✅' : '⚠️'}`);
      console.log(`   2️⃣ 7-Day Average: $${(stat.avg7dPrice || 0).toFixed(2)} ${stat.avg7dPrice ? '✅' : '⚠️'}`);
      console.log(`   3️⃣ 28-Day Average: $${(stat.avg28dPrice || 0).toFixed(2)} ${stat.avg28dPrice ? '✅' : '⚠️'}`);
      
      // Variance tracking fields
      console.log('\n📈 VARIANCE TRACKING:');
      console.log(`   📊 Diff vs 7-Day %: ${(stat.diffVs7dPct || 0).toFixed(2)}% ${stat.diffVs7dPct !== null ? '✅' : '⚠️'}`);
      console.log(`   📊 Diff vs 28-Day %: ${(stat.diffVs28dPct || 0).toFixed(2)}% ${stat.diffVs28dPct !== null ? '✅' : '⚠️'}`);
      
      // Min/Max tracking fields
      console.log('\n📊 MIN/MAX TRACKING:');
      console.log(`   📉 Min 28-Day Price: $${(stat.min28dPrice || 0).toFixed(2)} ${stat.min28dPrice ? '✅' : '⚠️'}`);
      console.log(`   📈 Max 28-Day Price: $${(stat.max28dPrice || 0).toFixed(2)} ${stat.max28dPrice ? '✅' : '⚠️'}`);
      
      // Cross-vendor comparison fields (4th tracker)
      console.log('\n🔄 CROSS-VENDOR COMPARISON (4th Tracker):');
      console.log(`   4️⃣ Best Price Across Vendors: $${(stat.bestPriceAcrossVendors || 0).toFixed(2)} ${stat.bestPriceAcrossVendors ? '✅' : '❌ Not implemented yet'}`);
      console.log(`   🏪 Best Vendor Name: ${stat.bestVendorName || 'N/A'} ${stat.bestVendorName ? '✅' : '❌ Not implemented yet'}`);
      console.log(`   💡 Diff vs Best %: ${(stat.diffVsBestPct || 0).toFixed(2)}% ${stat.diffVsBestPct !== null ? '✅' : '❌ Not implemented yet'}`);
      
      // Aggregation tracking fields
      console.log('\n🔢 AGGREGATION TRACKING:');
      console.log(`   📊 Sum 28-Day Spend: $${(stat.sum28dPrice || 0).toFixed(2)} ${stat.sum28dPrice ? '✅' : '⚠️'}`);
      console.log(`   🔢 Count 28-Day: ${stat.count28d || 0} records ${stat.count28d ? '✅' : '⚠️'}`);
      
      // Timestamp fields
      console.log('\n⏰ TIMESTAMP FIELDS:');
      console.log(`   📅 Created At: ${stat.createdAt.toISOString().slice(0, 19)} ✅`);
      console.log(`   🔄 Updated At: ${stat.updatedAt.toISOString().slice(0, 19)} ✅`);
      
      // Related data check
      console.log('\n📋 RELATED DATA:');
      console.log(`   📊 Daily Records: ${item?.daily?.length || 0} records ${(item?.daily?.length || 0) > 0 ? '✅' : '⚠️'}`);
      console.log(`   🏪 Vendor: ${vendor.name} ✅`);
      console.log(`   📦 Item Name: ${item?.lastSeenName || 'N/A'} ${item?.lastSeenName ? '✅' : '⚠️'}`);
      console.log(`   📏 Item Unit: ${item?.lastSeenUnit || 'N/A'} ${item?.lastSeenUnit ? '✅' : '⚠️'}`);
      
      // Data quality check
      console.log('\n🔍 DATA QUALITY CHECK:');
      
      // Check for reasonable price values
      const lastPaid = stat.lastPaidPrice || 0;
      const avg7d = stat.avg7dPrice || 0;
      const avg28d = stat.avg28dPrice || 0;
      
      if (lastPaid > 0 && avg7d > 0) {
        const variance7d = Math.abs(lastPaid - avg7d) / avg7d * 100;
        console.log(`   📊 7-Day Variance Check: ${variance7d.toFixed(1)}% ${variance7d < 50 ? '✅ Reasonable' : '⚠️ High variance'}`);
      }
      
      if (lastPaid > 0 && lastPaid < 1000) {
        console.log(`   💰 Price Range Check: ✅ Reasonable ($${lastPaid.toFixed(2)})`);
      } else if (lastPaid === 0) {
        console.log(`   💰 Price Range Check: ⚠️ Zero price (may be expected)`);
      } else {
        console.log(`   💰 Price Range Check: ⚠️ Very high price ($${lastPaid.toFixed(2)})`);
      }
    }
    
    // Overall statistics
    console.log('\n' + '='.repeat(80));
    console.log('📊 OVERALL FIELD STATISTICS');
    console.log('='.repeat(80));
    
    const totalStats = await prisma.vendorItemStats.count({
      where: { restaurantId: { startsWith: 'clstress' } }
    });
    
    const fieldsWithData = await prisma.vendorItemStats.aggregate({
      where: { restaurantId: { startsWith: 'clstress' } },
      _count: {
        lastPaidPrice: true,
        avg7dPrice: true,
        avg28dPrice: true,
        diffVs7dPct: true,
        diffVs28dPct: true,
        min28dPrice: true,
        max28dPrice: true,
        bestPriceAcrossVendors: true,
        bestVendorName: true,
        sum28dPrice: true,
        count28d: true
      }
    });
    
    console.log(`\n📈 FIELD POPULATION RATES (out of ${totalStats} total records):`);
    console.log(`   1️⃣ Last Paid Price: ${fieldsWithData._count.lastPaidPrice}/${totalStats} (${((fieldsWithData._count.lastPaidPrice/totalStats)*100).toFixed(1)}%)`);
    console.log(`   2️⃣ 7-Day Average: ${fieldsWithData._count.avg7dPrice}/${totalStats} (${((fieldsWithData._count.avg7dPrice/totalStats)*100).toFixed(1)}%)`);
    console.log(`   3️⃣ 28-Day Average: ${fieldsWithData._count.avg28dPrice}/${totalStats} (${((fieldsWithData._count.avg28dPrice/totalStats)*100).toFixed(1)}%)`);
    console.log(`   📊 7-Day Variance: ${fieldsWithData._count.diffVs7dPct}/${totalStats} (${((fieldsWithData._count.diffVs7dPct/totalStats)*100).toFixed(1)}%)`);
    console.log(`   📊 28-Day Variance: ${fieldsWithData._count.diffVs28dPct}/${totalStats} (${((fieldsWithData._count.diffVs28dPct/totalStats)*100).toFixed(1)}%)`);
    console.log(`   📉 Min Price: ${fieldsWithData._count.min28dPrice}/${totalStats} (${((fieldsWithData._count.min28dPrice/totalStats)*100).toFixed(1)}%)`);
    console.log(`   📈 Max Price: ${fieldsWithData._count.max28dPrice}/${totalStats} (${((fieldsWithData._count.max28dPrice/totalStats)*100).toFixed(1)}%)`);
    console.log(`   4️⃣ Best Price (Cross-vendor): ${fieldsWithData._count.bestPriceAcrossVendors}/${totalStats} (${((fieldsWithData._count.bestPriceAcrossVendors/totalStats)*100).toFixed(1)}%)`);
    console.log(`   🏪 Best Vendor: ${fieldsWithData._count.bestVendorName}/${totalStats} (${((fieldsWithData._count.bestVendorName/totalStats)*100).toFixed(1)}%)`);
    
    // Summary of 4 main trackers
    console.log('\n🎯 SUMMARY OF 4 MAIN PRICE TRACKERS:');
    console.log(`   ✅ Tracker 1 (Last Paid): ${fieldsWithData._count.lastPaidPrice > 0 ? 'WORKING' : 'NOT WORKING'}`);
    console.log(`   ✅ Tracker 2 (7-Day Avg): ${fieldsWithData._count.avg7dPrice > 0 ? 'WORKING' : 'NOT WORKING'}`);
    console.log(`   ✅ Tracker 3 (28-Day Avg): ${fieldsWithData._count.avg28dPrice > 0 ? 'WORKING' : 'NOT WORKING'}`);
    console.log(`   ${fieldsWithData._count.bestPriceAcrossVendors > 0 ? '✅' : '❌'} Tracker 4 (Cross-vendor): ${fieldsWithData._count.bestPriceAcrossVendors > 0 ? 'WORKING' : 'NEEDS IMPLEMENTATION'}`);
    
    console.log('\n🏆 OVERALL SYSTEM STATUS:');
    const workingTrackers = [
      fieldsWithData._count.lastPaidPrice > 0,
      fieldsWithData._count.avg7dPrice > 0, 
      fieldsWithData._count.avg28dPrice > 0,
      fieldsWithData._count.bestPriceAcrossVendors > 0
    ].filter(Boolean).length;
    
    console.log(`   🎯 Working Trackers: ${workingTrackers}/4`);
    console.log(`   📊 Data Quality: ${workingTrackers >= 3 ? '✅ EXCELLENT' : workingTrackers >= 2 ? '⚠️ GOOD' : '❌ NEEDS WORK'}`);
    console.log(`   🚀 Production Ready: ${workingTrackers >= 3 ? '✅ YES' : '❌ AFTER FIXES'}`);
    
  } catch (error) {
    console.error('❌ Error during field check:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllFields().catch(console.error);
