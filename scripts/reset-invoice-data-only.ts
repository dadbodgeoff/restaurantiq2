// SURGICAL DATABASE RESET - Invoice/Pricing Data Only
// Keeps: Restaurants, Users, Prep, Menu, etc.
// Removes: Only invoice/pricing data for clean testing

import { PrismaClient } from '@prisma/client';

async function resetInvoiceDataOnly() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 SURGICAL DATABASE RESET - Invoice/Pricing Data Only\n');
    
    // Count what we're about to remove
    const counts = {
      vendorItemDaily: await prisma.vendorItemDaily.count(),
      vendorItemStats: await prisma.vendorItemStats.count(),
      vendorItem: await prisma.vendorItem.count(),
      invoiceLine: await prisma.invoiceLine.count(),
      invoice: await prisma.invoice.count(),
      vendor: await prisma.vendor.count(),
      itemMaster: await prisma.itemMaster.count()
    };
    
    console.log('📊 RECORDS TO BE REMOVED:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count.toLocaleString()} records`);
    });
    
    // Count what we're keeping
    const keeping = {
      restaurants: await prisma.restaurant.count(),
      users: await prisma.user.count()
    };
    
    console.log('\n✅ RECORDS BEING KEPT:');
    Object.entries(keeping).forEach(([table, count]) => {
      console.log(`   ${table}: ${count.toLocaleString()} records`);
    });
    
    console.log('\n🗑️ Starting surgical deletion...');
    
    // Delete in correct order (foreign key constraints)
    console.log('   Removing daily aggregations...');
    await prisma.vendorItemDaily.deleteMany({});
    
    console.log('   Removing price statistics...');
    await prisma.vendorItemStats.deleteMany({});
    
    console.log('   Removing vendor items...');
    await prisma.vendorItem.deleteMany({});
    
    console.log('   Removing invoice lines...');
    await prisma.invoiceLine.deleteMany({});
    
    console.log('   Removing invoices...');
    await prisma.invoice.deleteMany({});
    
    console.log('   Removing item masters...');
    await prisma.itemMaster.deleteMany({});
    
    console.log('   Removing vendors...');
    await prisma.vendor.deleteMany({});
    
    // Verify core data is still intact
    console.log('\n✅ VERIFICATION - Core data still intact:');
    const verification = {
      restaurants: await prisma.restaurant.count(),
      users: await prisma.user.count()
    };
    
    Object.entries(verification).forEach(([table, count]) => {
      console.log(`   ${table}: ${count.toLocaleString()} records ✓`);
    });
    
    console.log('\n🎉 SURGICAL RESET COMPLETE!');
    console.log('   ✅ All invoice/pricing data removed');
    console.log('   ✅ Core restaurant data preserved');
    console.log('   ✅ Ready for fresh testing');
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetInvoiceDataOnly().catch(console.error);
