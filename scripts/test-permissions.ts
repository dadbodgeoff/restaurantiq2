#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { UserRole, Permissions, DefaultRolePermissions } from '../src/domains/shared/types/permissions';
import { PermissionService } from '../src/infrastructure/security/permission.service';
import { PasswordService } from '../src/infrastructure/security/password.service';
import { DatabaseService } from '../src/infrastructure/database/database.service';
import { LoggerService } from '../src/infrastructure/logging/logger.service';

const prisma = new PrismaClient();

async function testPermissionSystem() {
  console.log('🧪 Testing Hierarchical Permission System...\n');

  // Initialize services
  const logger = new LoggerService();
  const database = new DatabaseService();
  const userRepository = new (require('../src/domains/restaurant/repositories/user.repository').UserRepository)(prisma);
  const permissionService = new PermissionService(database, userRepository, logger);

  try {
    // Test 1: Permission Structure
    console.log('📋 Test 1: Verifying permission structure...');
    await testPermissionStructure();

    // Test 2: Role Hierarchy
    console.log('👑 Test 2: Testing role hierarchy...');
    await testRoleHierarchy();

    // Test 3: Permission Assignment
    console.log('🔗 Test 3: Testing permission assignment...');
    await testPermissionAssignment();

    // Test 4: Hierarchical Assignment Rules
    console.log('🏛️  Test 4: Testing hierarchical assignment rules...');
    await testHierarchicalAssignment(permissionService);

    // Test 5: Service Integration
    console.log('⚙️  Test 5: Testing service integration...');
    await testServiceIntegration();

    console.log('\n🎉 All permission system tests passed!');
    console.log('\n📊 Test Results Summary:');
    console.log('   • Permission structure: ✅ Valid');
    console.log('   • Role hierarchy: ✅ Working');
    console.log('   • Permission assignment: ✅ Functional');
    console.log('   • Hierarchical rules: ✅ Enforced');
    console.log('   • Service integration: ✅ Complete');

  } catch (error) {
    console.error('\n❌ Permission system test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function testPermissionStructure() {
  console.log('   🔍 Checking permission records...');

  const permissions = await prisma.permission.findMany();
  console.log(`   📊 Found ${permissions.length} permissions`);

  // Check categories
  const categories = Array.from(new Set(permissions.map(p => p.category)));
  console.log(`   📂 Categories: ${categories.join(', ')}`);

  // Verify specific permissions exist
  const criticalPermissions = [
    Permissions.AUTH_LOGIN,
    Permissions.USERS_CREATE,
    Permissions.USERS_ASSIGN_ROLE,
    Permissions.PREP_FINALIZE
  ];

  for (const permission of criticalPermissions) {
    const exists = await prisma.permission.findUnique({
      where: { name: permission }
    });

    if (!exists) {
      throw new Error(`Critical permission missing: ${permission}`);
    }
  }

  console.log('   ✅ Permission structure valid');
}

async function testRoleHierarchy() {
  console.log('   🏗️  Checking role-permission relationships...');

  const rolePermissions = await prisma.rolePermission.findMany({
    include: {
      permission: true
    }
  });

  console.log(`   🔗 Found ${rolePermissions.length} role-permission links`);

  // Check each role has expected permissions
  for (const role of Object.values(UserRole)) {
    const rolePerms = rolePermissions.filter(rp => rp.role === role);
    const expectedPerms = DefaultRolePermissions[role];

    console.log(`   ${role}: ${rolePerms.length}/${expectedPerms.length} permissions`);

    if (rolePerms.length !== expectedPerms.length) {
      throw new Error(`Role ${role} has ${rolePerms.length} permissions, expected ${expectedPerms.length}`);
    }
  }

  console.log('   ✅ Role hierarchy structure valid');
}

async function testPermissionAssignment() {
  console.log('   🔐 Testing permission assignment logic...');

  // Test OWNER permissions
  const ownerPerms = DefaultRolePermissions[UserRole.OWNER];
  console.log(`   👑 OWNER has ${ownerPerms.length} permissions`);

  // Test STAFF permissions (should be limited)
  const staffPerms = DefaultRolePermissions[UserRole.STAFF];
  console.log(`   👤 STAFF has ${staffPerms.length} permissions`);

  // Verify OWNER has more permissions than STAFF
  if (ownerPerms.length <= staffPerms.length) {
    throw new Error('OWNER should have more permissions than STAFF');
  }

  // Check specific permission assignments
  const ownerHasUserManagement = ownerPerms.includes(Permissions.USERS_ASSIGN_ROLE);
  const staffHasUserManagement = staffPerms.includes(Permissions.USERS_ASSIGN_ROLE);

  console.log(`   👑 OWNER can assign roles: ${ownerHasUserManagement}`);
  console.log(`   👤 STAFF can assign roles: ${staffHasUserManagement}`);

  if (!ownerHasUserManagement) {
    throw new Error('OWNER should be able to assign roles');
  }

  if (staffHasUserManagement) {
    throw new Error('STAFF should NOT be able to assign roles');
  }

  console.log('   ✅ Permission assignment logic valid');
}

async function testHierarchicalAssignment(permissionService: PermissionService) {
  console.log('   🏛️  Testing hierarchical role assignment rules...');

  // Create test users
  const ownerUser = await prisma.user.create({
    data: {
      email: 'test-owner@example.com',
      firstName: 'Test',
      lastName: 'Owner',
      role: UserRole.OWNER,
      restaurantId: 'test-restaurant',
      failedLoginAttempts: 0
    }
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'test-manager@example.com',
      firstName: 'Test',
      lastName: 'Manager',
      role: UserRole.MANAGER,
      restaurantId: 'test-restaurant',
      failedLoginAttempts: 0
    }
  });

  const staffUser = await prisma.user.create({
    data: {
      email: 'test-staff@example.com',
      firstName: 'Test',
      lastName: 'Staff',
      role: UserRole.STAFF,
      restaurantId: 'test-restaurant',
      failedLoginAttempts: 0
    }
  });

  try {
    // Test 1: OWNER can assign MANAGER role
    const ownerCanAssignManager = await permissionService.canAssignRole(ownerUser.id, UserRole.MANAGER);
    console.log(`   👑 OWNER → MANAGER: ${ownerCanAssignManager ? '✅' : '❌'}`);

    if (!ownerCanAssignManager) {
      throw new Error('OWNER should be able to assign MANAGER role');
    }

    // Test 2: OWNER can assign STAFF role
    const ownerCanAssignStaff = await permissionService.canAssignRole(ownerUser.id, UserRole.STAFF);
    console.log(`   👑 OWNER → STAFF: ${ownerCanAssignStaff ? '✅' : '❌'}`);

    if (!ownerCanAssignStaff) {
      throw new Error('OWNER should be able to assign STAFF role');
    }

    // Test 3: MANAGER can assign STAFF role
    const managerCanAssignStaff = await permissionService.canAssignRole(managerUser.id, UserRole.STAFF);
    console.log(`   👨‍💼 MANAGER → STAFF: ${managerCanAssignStaff ? '✅' : '❌'}`);

    if (!managerCanAssignStaff) {
      throw new Error('MANAGER should be able to assign STAFF role');
    }

    // Test 4: MANAGER cannot assign ADMIN role
    const managerCanAssignAdmin = await permissionService.canAssignRole(managerUser.id, UserRole.ADMIN);
    console.log(`   👨‍💼 MANAGER → ADMIN: ${!managerCanAssignAdmin ? '✅' : '❌'}`);

    if (managerCanAssignAdmin) {
      throw new Error('MANAGER should NOT be able to assign ADMIN role');
    }

    // Test 5: STAFF cannot assign any role
    const staffCanAssignStaff = await permissionService.canAssignRole(staffUser.id, UserRole.STAFF);
    console.log(`   👤 STAFF → STAFF: ${!staffCanAssignStaff ? '✅' : '❌'}`);

    if (staffCanAssignStaff) {
      throw new Error('STAFF should NOT be able to assign any roles');
    }

  } finally {
    // Cleanup test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'test-owner@example.com',
            'test-manager@example.com',
            'test-staff@example.com'
          ]
        }
      }
    });
  }

  console.log('   ✅ Hierarchical assignment rules working correctly');
}

async function testServiceIntegration() {
  console.log('   🔧 Testing service integration...');

  // Test PasswordService
  const passwordService = new PasswordService();
  const testPassword = 'TestPassword123!';
  const hashedPassword = await passwordService.hashPassword(testPassword);
  const isValidPassword = await passwordService.verifyPassword(testPassword, hashedPassword);

  console.log(`   🔒 Password hashing: ${isValidPassword ? '✅' : '❌'}`);

  if (!isValidPassword) {
    throw new Error('Password hashing/verification failed');
  }

  // Test password strength validation
  const weakPassword = '123';
  const strongPassword = 'StrongPass123!';
  const weakResult = passwordService.validatePasswordStrength(weakPassword);
  const strongResult = passwordService.validatePasswordStrength(strongPassword);

  console.log(`   🛡️  Password strength validation: ${!weakResult && strongResult ? '✅' : '❌'}`);

  if (weakResult || !strongResult) {
    throw new Error('Password strength validation failed');
  }

  console.log('   ✅ Service integration working correctly');
}

// Execute tests if run directly
if (require.main === module) {
  testPermissionSystem().catch(console.error);
}

export { testPermissionSystem };
