# 🚀 RestaurantIQ Repository Pattern Guide

## Quick Reference for All Future Repositories

### 📋 MANDATORY Pattern (Copy & Paste Ready)

```typescript
import { BaseRepository } from '../../shared/base-repository';
import { PrismaClient } from '@prisma/client';
import { YourEntityType } from '../../shared/types/your-domain';

export class YourEntityRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(id: string) {
    this.validateId(id, 'YourEntity');
    return this.executeQuery(async () => {
      this.logOperation('findById', { id });
      // Your Prisma query here
      return result;
    }, 'findById');
  }

  async create(data: YourCreateData) {
    this.validateRequiredString(data.name, 'Name'); // Example validation
    return this.executeQuery(async () => {
      this.logOperation('create', { name: data.name });
      // Your create logic here
      return result;
    }, 'create');
  }
}
```

### 🎯 5 Required Elements in Every Method

```typescript
async yourMethod(params) {
  // 1. ✅ INPUT VALIDATION
  this.validateId(id, 'EntityName');
  this.validateRequiredString(name, 'FieldName');

  // 2. ✅ EXECUTE QUERY (Error Handling)
  return this.executeQuery(async () => {

    // 3. ✅ DEVELOPMENT LOGGING
    this.logOperation('yourMethod', { params });

    // 4. Your business logic here...

    // 5. ✅ SAFE OPTIONAL HANDLING
    return {
      ...data,
      optionalField: this.safeOptional(value)
    };
  }, 'yourMethod');
}
```

### 📝 Implementation Checklist

**Before Committing:**
- [ ] Extends `BaseRepository`?
- [ ] Constructor calls `super(prisma)`?
- [ ] All methods have input validation?
- [ ] All methods use `executeQuery`?
- [ ] All methods have `logOperation`?
- [ ] Nullable fields use `safeOptional`?
- [ ] TypeScript interfaces defined?
- [ ] Container registration added?

### 🚨 Common Mistakes (Don't Do These)

```typescript
// ❌ WRONG - Missing BaseRepository
export class BadRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return await this.prisma.entity.findUnique({ where: { id } });
  }
}

// ❌ WRONG - Missing validation & error handling
async findById(id: string) {
  const result = await this.prisma.entity.findUnique({ where: { id } });
  return result;
}
```

### 📚 Reference Files

- **Base Pattern:** `src/domains/shared/base-repository.ts`
- **Good Example:** `src/domains/restaurant/repositories/restaurant.repository.ts`
- **Type Definitions:** `src/domains/shared/types/restaurant.ts`
- **Container Setup:** `src/config/container.ts`

### 🔧 When Adding New Models

1. **Prisma Schema:** Add model to `schema.prisma`
2. **Types:** Add interface to `src/domains/shared/types/`
3. **Repository:** Create `NewRepository extends BaseRepository`
4. **Container:** Register in `src/config/container.ts`
5. **Service:** Create service if needed
6. **Routes:** Update API routes if needed

### 🎯 Why This Matters

- **Consistency:** All repositories behave the same way
- **Reliability:** Built-in error handling and validation
- **Debugging:** Consistent logging across all operations
- **Maintenance:** Easy to understand and modify
- **Scalability:** Patterns work as you add 8-10 more models

**Remember:** Every repository must follow this pattern for enterprise reliability! 🏗️
