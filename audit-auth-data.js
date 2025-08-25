const { PrismaClient } = require('@prisma/client');

async function auditAuthenticationData() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 AUTHENTICATION DATA AUDIT');
    console.log('=' .repeat(60));

    // 1. Check all restaurants
    console.log('\n🏪 RESTAURANTS:');
    const restaurants = await prisma.restaurant.findMany({
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            role: true
          }
        }
      }
    });

    restaurants.forEach((restaurant, index) => {
      console.log(`${index + 1}. ${restaurant.name}`);
      console.log(`   ID: ${restaurant.id}`);
      console.log(`   Active: ${restaurant.isActive}`);
      console.log(`   Users: ${restaurant.users.length}`);
      restaurant.users.forEach((user, uIndex) => {
        console.log(`   ${uIndex + 1}. ${user.email} (${user.firstName} ${user.lastName}) - ${user.role} - ${user.isActive ? 'Active' : 'Inactive'}`);
      });
      console.log('');
    });

    // 2. Check all users with full details
    console.log('\n👥 ALL USERS:');
    const allUsers = await prisma.user.findMany({
      include: {
        restaurant: true
      },
      orderBy: { email: 'asc' }
    });

    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Restaurant: ${user.restaurant.name} (${user.restaurantId})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Has Password: ${!!user.password}`);
      console.log(`   Password Length: ${user.password?.length || 0}`);
      console.log(`   Failed Attempts: ${user.failedLoginAttempts}`);
      console.log(`   Locked Until: ${user.lockedUntil || 'Not locked'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Last Login: ${user.lastLoginAt || 'Never'}`);
      console.log('');
    });

    // 3. Check for potential data issues
    console.log('\n🚨 POTENTIAL DATA ISSUES:');

    // Check for emails with different cases
    const emailCases = allUsers.reduce((acc, user) => {
      const lowerEmail = user.email.toLowerCase();
      if (!acc[lowerEmail]) {
        acc[lowerEmail] = [];
      }
      acc[lowerEmail].push(user);
      return acc;
    }, {});

    Object.entries(emailCases).forEach(([lowerEmail, users]) => {
      if (users.length > 1) {
        console.log(`⚠️  Email case mismatch: ${lowerEmail}`);
        users.forEach(user => {
          console.log(`   - "${user.email}" in restaurant ${user.restaurant.name}`);
        });
      }
    });

    // Check for users without passwords
    const usersWithoutPasswords = allUsers.filter(user => !user.password);
    if (usersWithoutPasswords.length > 0) {
      console.log(`⚠️  Users without passwords: ${usersWithoutPasswords.length}`);
      usersWithoutPasswords.forEach(user => {
        console.log(`   - ${user.email} in restaurant ${user.restaurant.name}`);
      });
    }

    // Check for duplicate restaurantId + email combinations
    const userCombinations = allUsers.map(user => ({
      key: `${user.restaurantId}:${user.email.toLowerCase()}`,
      user
    }));

    const duplicates = userCombinations.reduce((acc, item) => {
      if (!acc[item.key]) {
        acc[item.key] = [];
      }
      acc[item.key].push(item.user);
      return acc;
    }, {});

    Object.entries(duplicates).forEach(([key, users]) => {
      if (users.length > 1) {
        console.log(`⚠️  Duplicate user in same restaurant: ${key}`);
        users.forEach(user => {
          console.log(`   - ID: ${user.id}, Email: ${user.email}`);
        });
      }
    });

    // 4. Test specific login scenarios
    console.log('\n🔍 LOGIN SCENARIO TESTING:');

    if (allUsers.length > 0) {
      const testUser = allUsers[0];
      console.log(`Testing login for: ${testUser.email}`);
      console.log(`Restaurant ID: ${testUser.restaurantId}`);
      console.log(`Expected to find: ${!!testUser}`);

      // Test the actual query used in authentication
      const foundUser = await prisma.user.findFirst({
        where: {
          restaurantId: testUser.restaurantId,
          email: testUser.email,
        },
      });

      console.log(`Query result: ${!!foundUser}`);
      if (foundUser) {
        console.log(`Found user ID: ${foundUser.id}`);
        console.log(`Match: ${foundUser.id === testUser.id}`);
      } else {
        console.log('❌ User not found with exact query!');
      }
    }

    // 5. Summary statistics
    console.log('\n📊 SUMMARY STATISTICS:');
    console.log(`Total Restaurants: ${restaurants.length}`);
    console.log(`Total Users: ${allUsers.length}`);
    console.log(`Active Users: ${allUsers.filter(u => u.isActive).length}`);
    console.log(`Users with Passwords: ${allUsers.filter(u => u.password).length}`);
    console.log(`Locked Accounts: ${allUsers.filter(u => u.lockedUntil).length}`);

  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditAuthenticationData();
