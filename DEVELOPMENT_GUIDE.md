# 🚀 RestaurantIQ Development Guide
# Complete Enterprise Standards & Patterns

## 📋 QUICK START CHECKLIST

### Before Starting Any New Feature:
```bash
# 1. Environment Check
./scripts/dev-workflow.sh status

# 2. Database Schema
vim prisma/schema.prisma
npm run db:migrate:dev

# 3. Follow Implementation Order
# (See patterns below)
```

---

## 🏗️ IMPLEMENTATION ORDER (MANDATORY)

### Phase 1: Database & Types
```bash
# 1. Add Prisma Model
vim prisma/schema.prisma

# 2. Add TypeScript Interface
vim src/domains/shared/types/your-entity.ts

# 3. Run Migration
npm run db:migrate:dev
```

### Phase 2: Repository Layer
```typescript
// src/domains/your-domain/repositories/your-entity.repository.ts
export class YourEntityRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);  // MANDATORY
  }

  async findById(id: string) {
    this.validateId(id, 'YourEntity');  // MANDATORY
    return this.executeQuery(async () => {
      this.logOperation('findById', { id });
      // Implementation
    }, 'findById');
  }
}
```

### Phase 3: Service Layer
```typescript
// src/domains/your-domain/services/your-entity.service.ts
export class YourEntityService {
  constructor(
    private readonly yourEntityRepository: YourEntityRepository
  ) {}

  async businessOperation(data: YourData) {
    // Business logic here
    return this.yourEntityRepository.create(data);
  }
}
```

### Phase 4: Container Registration
```typescript
// src/config/container.ts
container.register({
  yourEntityRepository: asClass(YourEntityRepository).scoped(),
  yourEntityService: asClass(YourEntityService).scoped(),
});
```

### Phase 5: API Routes
```typescript
// src/infrastructure/web/routes/your-entity.ts
router.get('/', authenticate(), async (req, res) => {
  const service = req.container.resolve('yourEntityService') as YourEntityService;
  const result = await service.businessOperation(req.body);
  res.json({ success: true, data: result });
});
```

---

## 🔧 DOCKER DEVELOPMENT WORKFLOW

### Building & Testing
```bash
# Build specific service
docker-compose build backend

# View logs
docker-compose logs -f backend

# Access container shell
docker-compose exec backend sh

# Restart after changes
docker-compose restart backend
```

### Multi-Service Development
```bash
# Start all services
./scripts/start.sh

# View all service status
docker-compose ps

# Scale services for testing
docker-compose up -d --scale backend=2
```

---

## 🗄️ DATABASE OPERATIONS

### Schema Changes
```bash
# Development migration
npm run db:migrate:dev --name=add_your_feature

# Production migration
npm run db:migrate

# Reset database (development only)
npm run db:migrate:reset
```

### Database Tools
```bash
# Prisma Studio
npm run db:studio

# Generate client
npx prisma generate

# Database backup
./scripts/backup-postgres.sh
```

---

## 🔒 SECURITY IMPLEMENTATION

### Authentication Flow
```typescript
// Route protection
router.post('/protected', authenticate(), (req, res) => {
  // User is authenticated
  res.json({ user: req.user });
});

// Restaurant access control
router.get('/:restaurantId/data',
  authenticate(),
  authorizeRestaurantAccess(),
  async (req, res) => {
    // User has access to this restaurant
  }
);
```

### Permission Checking
```typescript
// Check specific permission
if (!hasPermission(userPermissions, Permissions.MENU_CREATE)) {
  throw new AuthorizationError('Insufficient permissions');
}
```

---

## 📝 LOGGING STANDARDS

### Development Logging
```typescript
// Info logging
logger.info('user.login', 'User authenticated successfully', {
  userId: user.id,
  correlationId: req.correlationId
});

// Error logging
logger.error('database.query', error, {
  query: 'SELECT * FROM users',
  correlationId: req.correlationId
});
```

### Production Considerations
```typescript
// Structured logging for production
console.log(JSON.stringify({
  level: 'INFO',
  timestamp: new Date().toISOString(),
  operation: 'user.login',
  message: 'User authenticated',
  userId: user.id,
  correlationId: req.correlationId
}));
```

---

## 🧪 TESTING PATTERNS

### Unit Testing Structure
```typescript
// Repository tests
describe('UserRepository', () => {
  test('findById validates input', async () => {
    await expect(repo.findById('invalid-id')).rejects.toThrow();
  });
});

// Service tests
describe('UserService', () => {
  test('createUser validates email', async () => {
    await expect(service.createUser({ email: 'invalid' })).rejects.toThrow();
  });
});
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Docker images built
- [ ] SSL certificates valid
- [ ] Health checks passing

### Deployment Steps
```bash
# 1. Environment check
if [ -z "$DATABASE_URL" ]; then exit 1; fi

# 2. Run migrations
npm run db:migrate

# 3. Build application
docker build -f Dockerfile.backend -t restaurantiq-backend .

# 4. Deploy services
docker-compose up -d

# 5. Verify deployment
curl -f https://restaurantiq.local/api/v1/health
```

---

## 📚 REFERENCE ARCHITECTURE

### Service Dependencies
```
Frontend (Port 3001)
    ↓
Nginx (Ports 80/443)
    ↓
Backend (Port 3000)
    ↓
Database (Port 5432)
    ↓
Redis (Port 6379)
```

### Data Flow
```
Request → Nginx → Backend → Service → Repository → Database
Response ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
```

### Module Structure
```
src/
├── domains/           # Business logic
├── infrastructure/    # Technical concerns
├── config/           # Configuration
└── lib/              # Shared utilities
```

---

## 🎯 TROUBLESHOOTING

### Common Issues

#### Container Won't Start
```bash
# Check logs
docker-compose logs backend

# Check container status
docker-compose ps

# Restart container
docker-compose restart backend
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready -U restaurantiq

# View database logs
docker-compose logs postgres

# Reset database (development only)
npm run db:migrate:reset
```

#### Build Failures
```bash
# Clean build
docker-compose build --no-cache backend

# Check build logs
docker-compose build backend

# Verify dependencies
npm ls --depth=0
```

---

## 📋 DAILY WORKFLOW

### Morning Setup
```bash
# Start development environment
./scripts/start.sh

# Check all services
./scripts/dev-workflow.sh status

# View recent logs
./scripts/dev-workflow.sh logs --tail=50
```

### Development Loop
```bash
# Make changes to code
vim src/domains/your-feature/

# Test changes
npm run dev

# Check logs
docker-compose logs -f backend

# Commit changes
git add .
git commit -m "feat: add your feature"
```

### End of Day
```bash
# Create backup
./scripts/backup-postgres.sh

# Stop services
./scripts/dev-workflow.sh stop

# Clean up
docker system prune -f
```

---

## 🎯 SUCCESS METRICS

### Code Quality
- ✅ **TypeScript** - No compilation errors
- ✅ **ESLint** - No linting errors
- ✅ **Tests** - All tests passing
- ✅ **Patterns** - Follows established standards

### Deployment Ready
- ✅ **Docker** - Images build successfully
- ✅ **Health Checks** - All endpoints responding
- ✅ **Migrations** - Database schema current
- ✅ **Security** - No security vulnerabilities

### Production Standards
- ✅ **Logging** - Structured logging implemented
- ✅ **Monitoring** - Metrics collection active
- ✅ **Backups** - Automated backup system
- ✅ **Security** - SSL and authentication working

---

**Remember:** Always follow the patterns in `.cursorrules` and consult this guide for implementation details. Enterprise consistency ensures scalable, maintainable code! 🏗️✨
