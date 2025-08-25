const { PrismaClient } = require('@prisma/client');

async function checkRegistration() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking for registered user: test@test.com');
    console.log('🏪 Checking for restaurant: Test Restaurant');
    console.log('=' .repeat(50));

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: {
        email: 'test@test.com'
      },
      include: {
        restaurant: true
      }
    });

    if (user) {
      console.log('✅ User found!');
      console.log('📧 Email:', user.email);
      console.log('👤 Name:', `${user.firstName} ${user.lastName}`);
      console.log('🔑 Role:', user.role);
      console.log('🏪 Restaurant:', user.restaurant.name);
      console.log('📍 Restaurant ID:', user.restaurantId);
      console.log('🔒 Password Hash:', user.password ? 'Present (hashed)' : 'Missing');
      console.log('✅ Active:', user.isActive);
      console.log('📅 Created:', user.createdAt);
      console.log('🔑 Last Login:', user.lastLoginAt || 'Never');
    } else {
      console.log('❌ User not found in database');
    }

    console.log('=' .repeat(50));

    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        name: 'Test Restaurant'
      },
      include: {
        users: true
      }
    });

    if (restaurant) {
      console.log('✅ Restaurant found!');
      console.log('🏪 Name:', restaurant.name);
      console.log('📍 ID:', restaurant.id);
      console.log('🌍 Timezone:', restaurant.timezone);
      console.log('💰 Currency:', restaurant.currency);
      console.log('✅ Active:', restaurant.isActive);
      console.log('📅 Created:', restaurant.createdAt);

      console.log('👥 Users in restaurant:');
      restaurant.users.forEach((u, index) => {
        console.log(`  ${index + 1}. ${u.email} (${u.role}) - ${u.firstName} ${u.lastName}`);
      });
    } else {
      console.log('❌ Restaurant not found in database');
    }

    console.log('=' .repeat(50));

    // Check all users with similar emails
    console.log('🔍 All users with similar emails:');
    const similarUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'test' } },
          { email: { contains: 'example' } }
        ]
      },
      include: {
        restaurant: true
      }
    });

    similarUsers.forEach((u, index) => {
      console.log(`${index + 1}. ${u.email} (${u.firstName} ${u.lastName}) - Restaurant: ${u.restaurant.name}`);
    });

    console.log('=' .repeat(50));

    // Check all restaurants
    console.log('🏪 All restaurants:');
    const allRestaurants = await prisma.restaurant.findMany({
      include: {
        users: true
      }
    });

    allRestaurants.forEach((r, index) => {
      console.log(`${index + 1}. ${r.name} (ID: ${r.id}) - Users: ${r.users.length}`);
      r.users.forEach((u, uIndex) => {
        console.log(`   ${uIndex + 1}. ${u.email} (${u.firstName} ${u.lastName}) - ${u.role}`);
      });
    });

    console.log('=' .repeat(50));

    // Check total counts
    const userCount = await prisma.user.count();
    const restaurantCount = await prisma.restaurant.count();

    console.log('📊 Database Summary:');
    console.log('👥 Total Users:', userCount);
    console.log('🏪 Total Restaurants:', restaurantCount);

  } catch (error) {
    console.error('❌ Error checking registration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRegistration();
