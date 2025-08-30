#!/usr/bin/env node

/**
 * RestaurantIQ Specification Compliance Validator
 *
 * This tool validates that module implementations follow the established
 * enterprise patterns defined in MODULE_SPEC_TEMPLATE.md
 *
 * Usage: node validate-spec-compliance.js <module-path>
 */

const fs = require('fs');
const path = require('path');

class SpecComplianceValidator {
  constructor() {
    this.violations = [];
    this.warnings = [];
    this.passed = [];
  }

  validate(modulePath) {
    console.log(`🔍 Validating module at: ${modulePath}\n`);

    if (!fs.existsSync(modulePath)) {
      this.violations.push(`Module path does not exist: ${modulePath}`);
      return this.report();
    }

    this.validateRepositoryPattern(modulePath);
    this.validateServicePattern(modulePath);
    this.validateApiRoutes(modulePath);
    this.validateDatabaseSchema(modulePath);
    this.validateContainerRegistration(modulePath);

    return this.report();
  }

  validateRepositoryPattern(modulePath) {
    const repoPath = path.join(modulePath, 'repositories');

    if (!fs.existsSync(repoPath)) {
      this.violations.push('❌ Repository layer missing - repositories/ directory not found');
      return;
    }

    const repoFiles = fs.readdirSync(repoPath).filter(f => f.endsWith('.repository.ts'));

    repoFiles.forEach(file => {
      const filePath = path.join(repoPath, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Check extends BaseRepository
      if (!content.includes('extends BaseRepository')) {
        this.violations.push(`❌ ${file}: Must extend BaseRepository`);
      } else {
        this.passed.push(`✅ ${file}: Extends BaseRepository`);
      }

      // Check constructor calls super(prisma)
      if (!content.includes('super(prisma)') && !content.includes('super(this.prisma)')) {
        this.violations.push(`❌ ${file}: Constructor must call super(prisma)`);
      } else {
        this.passed.push(`✅ ${file}: Constructor calls super(prisma)`);
      }

      // Check executeQuery usage
      if (!content.includes('executeQuery(')) {
        this.violations.push(`❌ ${file}: Must use executeQuery for database operations`);
      } else {
        this.passed.push(`✅ ${file}: Uses executeQuery pattern`);
      }

      // Check logging
      if (!content.includes('logOperation(')) {
        this.warnings.push(`⚠️  ${file}: Consider adding logOperation calls for debugging`);
      } else {
        this.passed.push(`✅ ${file}: Uses logOperation for debugging`);
      }
    });
  }

  validateServicePattern(modulePath) {
    const servicePath = path.join(modulePath, 'services');

    if (!fs.existsSync(servicePath)) {
      this.violations.push('❌ Service layer missing - services/ directory not found');
      return;
    }

    const serviceFiles = fs.readdirSync(servicePath).filter(f => f.endsWith('.service.ts'));

    serviceFiles.forEach(file => {
      const filePath = path.join(servicePath, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Check constructor injection
      const constructorMatch = content.match(/constructor\(([^)]+)\)/);
      if (!constructorMatch) {
        this.violations.push(`❌ ${file}: Constructor missing`);
        return;
      }

      const params = constructorMatch[1];
      if (!params.includes('Repository') && !params.includes('Service') && !params.includes('Logger')) {
        this.warnings.push(`⚠️  ${file}: Constructor should inject dependencies`);
      } else {
        this.passed.push(`✅ ${file}: Uses dependency injection`);
      }

      // Check error handling
      if (!content.includes('try {') || !content.includes('catch')) {
        this.violations.push(`❌ ${file}: Missing try-catch error handling`);
      } else {
        this.passed.push(`✅ ${file}: Has error handling`);
      }

      // Check logging
      if (!content.includes('logger.')) {
        this.warnings.push(`⚠️  ${file}: Consider adding logging for debugging`);
      } else {
        this.passed.push(`✅ ${file}: Uses logging`);
      }
    });
  }

  validateApiRoutes(modulePath) {
    // Check if this is a frontend or backend module
    const isFrontend = modulePath.includes('frontend');
    const apiPath = isFrontend
      ? path.join(modulePath, 'app', 'api')
      : path.join(modulePath, 'infrastructure', 'web', 'routes');

    if (!fs.existsSync(apiPath)) {
      this.warnings.push(`⚠️  API layer not found at expected path: ${apiPath}`);
      return;
    }

    if (isFrontend) {
      this.validateFrontendApiRoutes(apiPath);
    } else {
      this.validateBackendApiRoutes(apiPath);
    }
  }

  validateFrontendApiRoutes(apiPath) {
    const routeFiles = this.findFilesRecursively(apiPath, 'route.ts');

    routeFiles.forEach(file => {
      const filePath = path.join(apiPath, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Check await params
      if (content.includes('params') && !content.includes('await params')) {
        this.violations.push(`❌ ${file}: Must use 'await params' in Next.js 15+`);
      } else if (content.includes('params')) {
        this.passed.push(`✅ ${file}: Uses await params correctly`);
      }

      // Check authorization header forwarding
      if (!content.includes('Authorization') && !content.includes('authorization')) {
        this.warnings.push(`⚠️  ${file}: Consider forwarding authorization headers`);
      } else {
        this.passed.push(`✅ ${file}: Forwards authorization headers`);
      }
    });
  }

  validateBackendApiRoutes(apiPath) {
    const routeFiles = fs.readdirSync(apiPath).filter(f => f.endsWith('.ts'));

    routeFiles.forEach(file => {
      const filePath = path.join(apiPath, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Check middleware usage
      if (!content.includes('authenticate') || !content.includes('authorizeRestaurantAccess')) {
        this.warnings.push(`⚠️  ${file}: Consider using authentication middleware`);
      } else {
        this.passed.push(`✅ ${file}: Uses authentication middleware`);
      }
    });
  }

  validateDatabaseSchema(modulePath) {
    const schemaPath = path.join(modulePath, '..', '..', '..', 'prisma', 'schema.prisma');

    if (!fs.existsSync(schemaPath)) {
      this.warnings.push('⚠️  Prisma schema not found - cannot validate database patterns');
      return;
    }

    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Check for snake_case table names
    const modelMatches = schemaContent.match(/@@map\("([^"]+)"\)/g);
    if (modelMatches) {
      modelMatches.forEach(match => {
        const tableName = match.match(/@@map\("([^"]+)"\)/)[1];
        if (tableName.includes('_')) {
          this.passed.push(`✅ Database: Uses snake_case table names (${tableName})`);
        } else {
          this.warnings.push(`⚠️  Database: Consider snake_case table names (${tableName})`);
        }
      });
    }
  }

  validateContainerRegistration(modulePath) {
    const containerPath = path.join(modulePath, '..', '..', '..', 'src', 'config', 'container.ts');
    const indexPath = path.join(modulePath, '..', '..', '..', 'src', 'index.ts');

    if (!fs.existsSync(containerPath)) {
      this.warnings.push('⚠️  Container registration file not found');
      return;
    }

    const containerContent = fs.readFileSync(containerPath, 'utf8');
    let indexContent = '';

    if (fs.existsSync(indexPath)) {
      indexContent = fs.readFileSync(indexPath, 'utf8');
    }

    // Check if new services are registered
    const moduleName = path.basename(modulePath);
    const serviceName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1) + 'Service';

    // Check both main container and scoped container patterns
    const inMainContainer = containerContent.includes(serviceName);
    const inScopedContainer = indexContent.includes(`${moduleName}Service: asValue(${moduleName}ServiceInstance)`) ||
                              indexContent.includes(`menuService: asValue(menuServiceInstance)`);

    if (!inMainContainer && !inScopedContainer) {
      this.violations.push(`❌ Container: ${serviceName} not registered in container.ts or index.ts scoped container`);
    } else if (inScopedContainer) {
      this.passed.push(`✅ Container: ${serviceName} registered correctly in scoped container (.cursorrules pattern)`);
    } else {
      this.passed.push(`✅ Container: ${serviceName} registered correctly in main container`);
    }
  }

  findFilesRecursively(dir, pattern) {
    const results = [];

    function traverse(currentDir) {
      const files = fs.readdirSync(currentDir);

      files.forEach(file => {
        const filePath = path.join(currentDir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          traverse(filePath);
        } else if (file.includes(pattern)) {
          results.push(path.relative(dir, filePath));
        }
      });
    }

    traverse(dir);
    return results;
  }

  report() {
    console.log('📊 COMPLIANCE REPORT\n');

    if (this.passed.length > 0) {
      console.log('✅ PASSED CHECKS:');
      this.passed.forEach(check => console.log(`   ${check}`));
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`   ${warning}`));
      console.log('');
    }

    if (this.violations.length > 0) {
      console.log('❌ VIOLATIONS (MUST FIX):');
      this.violations.forEach(violation => console.log(`   ${violation}`));
      console.log('');
    }

    const compliance = this.passed.length / (this.passed.length + this.violations.length) * 100;

    console.log(`🎯 COMPLIANCE SCORE: ${compliance.toFixed(1)}%`);
    console.log(`   ✅ Passed: ${this.passed.length}`);
    console.log(`   ❌ Violations: ${this.violations.length}`);
    console.log(`   ⚠️  Warnings: ${this.warnings.length}`);

    if (this.violations.length === 0) {
      console.log('\n🎉 MODULE IS COMPLIANT WITH ENTERPRISE STANDARDS!');
    } else {
      console.log('\n⚠️  MODULE HAS VIOLATIONS THAT MUST BE FIXED!');
    }

    return {
      passed: this.passed.length,
      warnings: this.warnings.length,
      violations: this.violations.length,
      compliance: compliance
    };
  }
}

// CLI usage
if (require.main === module) {
  const modulePath = process.argv[2];

  if (!modulePath) {
    console.log('Usage: node validate-spec-compliance.js <module-path>');
    console.log('Example: node validate-spec-compliance.js src/domains/menu');
    process.exit(1);
  }

  const validator = new SpecComplianceValidator();
  validator.validate(modulePath);
}

module.exports = SpecComplianceValidator;
