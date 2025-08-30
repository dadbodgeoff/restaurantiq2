# 🏗️ RestaurantIQ Module Specification Template
> **Version:** 1.0 | **Framework:** Enterprise RestaurantIQ Standards

---

## 🎯 **MODULE OVERVIEW** (Your Creative Space)

### **Business Purpose**
[Describe the business problem this module solves. What value does it add to restaurant operations?]

### **User Stories**
- As a [user role], I want [functionality] so that [business value]
- As a [user role], I want [functionality] so that [business value]

### **Key Concepts & Relationships**
[Describe the main entities and how they relate to each other in plain English]

---

## 📋 **TECHNICAL REQUIREMENTS** (AI Implementation Guide)

### **Core Entities**
```
Entity: [EntityName]
- Fields: [field1:type, field2:type, ...]
- Relationships: [relationship descriptions]
- Business Rules: [list key business rules]
```

### **API Endpoints Required**
```
GET    /api/v1/restaurants/:id/[module]/          # List entities
POST   /api/v1/restaurants/:id/[module]/          # Create entity
GET    /api/v1/restaurants/:id/[module]/:entityId # Get specific entity
PUT    /api/v1/restaurants/:id/[module]/:entityId # Update entity
DELETE /api/v1/restaurants/:id/[module]/:entityId # Delete entity
```

### **Business Logic Flows**
[Describe the main workflows in plain English]

---

## 🏛️ **ENTERPRISE PATTERN ENFORCEMENT** (MANDATORY - DO NOT MODIFY)

### **Repository Pattern Requirements**
```typescript
// MANDATORY: All repositories MUST extend BaseRepository
export class NewRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma); // MANDATORY
  }

  async findById(id: string) {
    this.validateId(id, 'EntityName'); // MANDATORY
    return this.executeQuery(async () => { // MANDATORY
      this.logOperation('findById', { id }); // MANDATORY
      // Implementation here
    }, 'findById'); // MANDATORY
  }
}
```

### **Service Layer Requirements**
```typescript
// MANDATORY: Constructor injection pattern
export class NewService {
  constructor(
    private repository: IRepository,
    private logger: LoggerService,
    private validator: ValidationService
  ) {}

  // MANDATORY: Error handling pattern
  async operation(data: any) {
    try {
      // Business logic here
      this.logger.info('operation', 'Operation completed', { data });
      return result;
    } catch (error) {
      this.logger.error('operation', error, { data });
      throw error;
    }
  }
}
```

### **API Route Requirements**
```typescript
// MANDATORY: Next.js API route structure
export async function GET(request: NextRequest, { params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params; // MANDATORY: await params
  const authHeader = request.headers.get('Authorization'); // MANDATORY: Authorization header

  // MANDATORY: Proxy to backend
  const response = await fetch(`${process.env.BACKEND_URL}/api/v1/restaurants/${restaurantId}/module`, {
    headers: {
      'Authorization': authHeader || '',
      'Content-Type': 'application/json'
    }
  });

  return Response.json(await response.json());
}
```

### **Database Schema Requirements**
```prisma
// MANDATORY: Standard Prisma model pattern
model EntityName {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // MANDATORY: Restaurant relationship
  restaurantId String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id])

  // MANDATORY: Indexes for performance
  @@index([restaurantId])

  // MANDATORY: Map to snake_case table name
  @@map("entity_names")
}
```

### **Security & Permissions**
```typescript
// MANDATORY: Permission enforcement
const requiredPermissions: Permission[] = [
  'module.create',
  'module.read',
  'module.update',
  'module.delete'
];

// MANDATORY: Middleware chain
app.use(authenticate());
app.use(authorizeRestaurantAccess());
app.use(requirePermission(...requiredPermissions));
```

### **Error Handling Standards**
```typescript
// MANDATORY: Custom error classes
export class ModuleNotFoundError extends BusinessError {
  constructor(entityId: string) {
    super(`Module entity with ID ${entityId} not found`, 'MODULE_NOT_FOUND');
  }
}

// MANDATORY: Error response format
{
  "success": false,
  "error": {
    "code": "MODULE_NOT_FOUND",
    "message": "Entity not found",
    "correlationId": "uuid"
  }
}
```

### **Validation Standards**
```typescript
// MANDATORY: Zod schema pattern
export const createEntitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  restaurantId: z.string().cuid('Invalid restaurant ID')
});

// MANDATORY: Validation in service
async create(data: CreateEntityRequest) {
  const validatedData = createEntitySchema.parse(data);
  // Continue with validated data
}
```

### **Logging Standards**
```typescript
// MANDATORY: Structured logging
this.logger.info('operation', 'Operation started', {
  entityId,
  restaurantId,
  correlationId
});

this.logger.error('operation', error, {
  entityId,
  restaurantId,
  correlationId,
  stack: error.stack
});
```

---

## 🔍 **IMPLEMENTATION CHECKLIST** (MANDATORY - AI Must Verify)

### **Repository Layer**
- [ ] Extends `BaseRepository`
- [ ] Constructor calls `super(prisma)`
- [ ] Input validation on all public methods
- [ ] Error handling via `executeQuery`
- [ ] Development logging via `logOperation`
- [ ] Container registration added

### **Service Layer**
- [ ] Dependency injection via constructor
- [ ] Business logic separated from data access
- [ ] Error handling with custom business errors
- [ ] Input validation before processing
- [ ] Container registration added

### **API Layer**
- [ ] Next.js API routes with `await params`
- [ ] Authorization header forwarding
- [ ] Proper error response handling
- [ ] Backend proxy pattern maintained

### **Database Layer**
- [ ] Prisma schema follows standards
- [ ] Proper indexes added
- [ ] Restaurant relationship maintained
- [ ] Snake_case table naming

### **Security Layer**
- [ ] Permission definitions added
- [ ] Middleware chain implemented
- [ ] Role-based access control
- [ ] Input validation and sanitization

---

## 🚀 **DEPLOYMENT CHECKLIST**

### **Docker Configuration**
- [ ] Multi-stage Dockerfile pattern
- [ ] Non-root user for security
- [ ] Proper health checks
- [ ] Resource limits set

### **Environment Variables**
- [ ] All required env vars documented
- [ ] Default values provided
- [ ] Validation implemented

### **Database Migrations**
- [ ] Migration scripts created
- [ ] Rollback plan documented
- [ ] Data seeding considered

---

## 📝 **USAGE EXAMPLES**

### **Frontend Integration**
```typescript
// Standard usage pattern
const userApiService = new UserApiService();
const result = await userApiService.createUser(restaurantId, userData);

// Error handling pattern
if (!result.success) {
  throw new ModuleError(result.error.message, result.error.code);
}
```

### **Testing Pattern**
```typescript
describe('Module Service', () => {
  it('should create entity with valid data', async () => {
    const result = await service.create(validData);
    expect(result.success).toBe(true);
  });
});
```

---

## 🔄 **FUTURE EXTENSIONS**

### **Planned Enhancements**
[List potential future features while maintaining architectural integrity]

### **Integration Points**
[How this module integrates with existing and planned modules]

---

> **CREATED BY:** [Your Name] | **REVIEWED BY:** AI Agent
> **APPROVED FOR:** RestaurantIQ Enterprise Standards v1.0
> **READY FOR:** Implementation and Testing
