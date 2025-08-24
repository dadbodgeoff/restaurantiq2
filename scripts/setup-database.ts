#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

async function setupDatabase() {
  console.log('🗄️  Setting up RestaurantIQ Database...\n');

  try {
    // Step 1: Check if .env exists and has database config
    console.log('📋 Step 1: Checking environment configuration...');

    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      console.log('   ❌ .env file not found');
      console.log('   📝 Creating .env template...');

      const envTemplate = `# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/restaurantiq"

# JWT Configuration
JWT_ACCESS_SECRET="your-access-secret-key-here"
JWT_REFRESH_SECRET="your-refresh-secret-key-here"

# Server Configuration
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info
`;

      fs.writeFileSync(envPath, envTemplate);
      console.log('   ✅ .env template created');
      console.log('   ⚠️  Please update .env with your database credentials');
      return;
    }

    console.log('   ✅ .env file exists');

    // Step 2: Test database connection
    console.log('🔌 Step 2: Testing database connection...');

    try {
      execSync('npx prisma db push --preview-feature', { stdio: 'pipe' });
      console.log('   ✅ Database connection successful');
    } catch (error) {
      console.log('   ❌ Database connection failed');
      console.log('   📋 Please ensure:');
      console.log('      • PostgreSQL is running');
      console.log('      • Database exists');
      console.log('      • DATABASE_URL in .env is correct');
      console.log('   🔧 Quick setup commands:');
      console.log('      brew install postgresql');
      console.log('      brew services start postgresql');
      console.log('      createdb restaurantiq');
      return;
    }

    // Step 3: Generate Prisma client
    console.log('🏗️  Step 3: Generating Prisma client...');
    execSync('npm run db:generate');
    console.log('   ✅ Prisma client generated');

    // Step 4: Run initial migration
    console.log('📦 Step 4: Running initial database migration...');
    execSync('npm run db:migrate');
    console.log('   ✅ Initial migration completed');

    // Step 5: Run permission system migration
    console.log('🔐 Step 5: Running permission system migration...');
    execSync('npm run db:migrate:permissions');
    console.log('   ✅ Permission system migration completed');

    // Step 6: Run tests
    console.log('🧪 Step 6: Running permission system tests...');
    execSync('ts-node scripts/test-permissions.ts');
    console.log('   ✅ Permission system tests passed');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📊 Setup Summary:');
    console.log('   • Database connection established');
    console.log('   • Prisma client generated');
    console.log('   • Initial migration applied');
    console.log('   • Permission system migrated');
    console.log('   • All tests passed');

    console.log('\n🚀 Next Steps:');
    console.log('   1. npm run dev  # Start development server');
    console.log('   2. Test authentication endpoints');
    console.log('   3. Verify role assignment functionality');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Execute setup if run directly
if (require.main === module) {
  setupDatabase().catch(console.error);
}

export { setupDatabase };
