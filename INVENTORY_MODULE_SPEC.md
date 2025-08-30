# 🏗️ RestaurantIQ Module Specification - Inventory Management
> **Version:** 1.0 | **Framework:** Enterprise RestaurantIQ Standards
> **Created By:** Geoffrey | **AI Reviewed:** ✅

---

## 🎯 **MODULE OVERVIEW** (Your Creative Space)

### **Business Purpose**
Inventory management enables restaurant operators to track stock levels, manage suppliers, categorize items, and maintain optimal inventory levels. This module solves the problem of inventory discrepancies, stockouts, and inefficient ordering by providing a centralized system for inventory tracking and management.

### **User Stories**
- As a Restaurant Manager, I want to add new inventory items so that I can track what we have in stock
- As a Restaurant Manager, I want to categorize items so that I can organize inventory logically
- As a Kitchen Staff, I want to update stock levels so that I can reflect usage during service
- As a Restaurant Manager, I want to search for items so that I can quickly find what I need
- As a Restaurant Owner, I want to track inventory value so that I can manage cash flow
- As a Restaurant Manager, I want to set reorder points so that I'm alerted when stock is low
- As a Restaurant Manager, I want to manage suppliers so that I can track where items come from

### **Key Concepts & Relationships**
- **Inventory Items** are the core entities that represent physical stock
- **Categories** organize items into logical groups (produce, meat, dairy, etc.)
- **Suppliers** provide items and have contact information
- **Stock Levels** track current quantity, reorder points, and unit costs
- **Inventory Transactions** record additions, removals, and adjustments
- Items belong to categories and can have multiple suppliers
- Each restaurant has its own inventory with unique stock levels

---

## 📋 **TECHNICAL REQUIREMENTS** (AI Implementation Guide)

### **Core Entities**
```
Entity: InventoryCategory
- Fields: name:string, description:string, displayOrder:number, isActive:boolean
- Relationships: belongs to Restaurant, has many InventoryItems
- Business Rules: Name required, unique per restaurant, display order determines sort

Entity: InventoryItem
- Fields: name:string, description:string, sku:string, unitOfMeasure:string, currentStock:decimal, reorderPoint:decimal, unitCost:decimal, sellingPrice:decimal, isActive:boolean, imageUrl:string, location:string
- Relationships: belongs to InventoryCategory, belongs to Restaurant, has many InventoryTransactions, has many SupplierItems
- Business Rules: Name and SKU required, stock cannot be negative, reorder point must be positive

Entity: Supplier
- Fields: name:string, contactName:string, email:string, phone:string, address:string, isActive:boolean, paymentTerms:string, notes:string
- Relationships: belongs to Restaurant, has many SupplierItems
- Business Rules: Name required, email must be valid format

Entity: SupplierItem
- Fields: supplierId:string, inventoryItemId:string, supplierSku:string, supplierPrice:decimal, leadTimeDays:number, minimumOrderQuantity:decimal, isPreferred:boolean
- Relationships: belongs to Supplier, belongs to InventoryItem
- Business Rules: Supplier and item required, price must be positive

Entity: InventoryTransaction
- Fields: inventoryItemId:string, transactionType:string (stock_in/stock_out/adjustment), quantity:decimal, reason:string, reference:string, costPerUnit:decimal, totalCost:decimal
- Relationships: belongs to InventoryItem, belongs to User (who performed transaction)
- Business Rules: Quantity cannot be zero, transaction type required
```

### **API Endpoints Required**
```
# Categories
GET    /api/v1/restaurants/:id/inventory/categories           # List categories
POST   /api/v1/restaurants/:id/inventory/categories           # Create category
GET    /api/v1/restaurants/:id/inventory/categories/:categoryId # Get category
PUT    /api/v1/restaurants/:id/inventory/categories/:categoryId # Update category
DELETE /api/v1/restaurants/:id/inventory/categories/:categoryId # Delete category

# Items
GET    /api/v1/restaurants/:id/inventory/items                # List items with stock levels
POST   /api/v1/restaurants/:id/inventory/items                # Create item
GET    /api/v1/restaurants/:id/inventory/items/:itemId        # Get specific item with stock history
PUT    /api/v1/restaurants/:id/inventory/items/:itemId        # Update item
DELETE /api/v1/restaurants/:id/inventory/items/:itemId        # Delete item

# Stock Management
POST   /api/v1/restaurants/:id/inventory/items/:itemId/stock-adjustments # Adjust stock level
GET    /api/v1/restaurants/:id/inventory/items/:itemId/transactions     # Get stock transaction history
GET    /api/v1/restaurants/:id/inventory/low-stock-alerts              # Get items below reorder point

# Suppliers
GET    /api/v1/restaurants/:id/inventory/suppliers              # List suppliers
POST   /api/v1/restaurants/:id/inventory/suppliers              # Create supplier
GET    /api/v1/restaurants/:id/inventory/suppliers/:supplierId  # Get supplier
PUT    /api/v1/restaurants/:id/inventory/suppliers/:supplierId  # Update supplier
DELETE /api/v1/restaurants/:id/inventory/suppliers/:supplierId  # Delete supplier

# Search
GET    /api/v1/restaurants/:id/inventory/search?query=:term     # Search items and categories
```

### **Business Logic Flows**
1. **Item Management**: Create categories, add items to categories, set reorder points and pricing
2. **Stock Tracking**: Record stock additions, consumptions, and adjustments with full audit trail
3. **Supplier Management**: Maintain supplier information and link items to suppliers
4. **Low Stock Alerts**: Automatically identify items below reorder points
5. **Inventory Valuation**: Calculate total inventory value and cost of goods
6. **Search and Organization**: Find items quickly by name, category, or SKU
7. **Reporting**: Generate inventory reports for management decisions

---

## 🏛️ **ENTERPRISE PATTERN ENFORCEMENT** (MANDATORY - DO NOT MODIFY)

### **Repository Pattern Requirements**
```typescript
// MANDATORY: All repositories MUST extend BaseRepository
export class InventoryItemRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma); // MANDATORY
  }

  async findById(id: string) {
    this.validateId(id, 'InventoryItem'); // MANDATORY
    return this.executeQuery(async () => { // MANDATORY
      this.logOperation('findById', { id }); // MANDATORY
      return await this.prisma.inventoryItem.findUnique({
        where: { id },
        include: {
          category: true,
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          supplierItems: {
            include: { supplier: true }
          }
        }
      });
    }, 'findById'); // MANDATORY
  }

  async findLowStockItems(restaurantId: string) {
    this.validateId(restaurantId, 'Restaurant');
    return this.executeQuery(async () => {
      this.logOperation('findLowStockItems', { restaurantId });
      return await this.prisma.inventoryItem.findMany({
        where: {
          restaurantId,
          currentStock: { lte: this.prisma.inventoryItem.fields.reorderPoint }
        },
        include: { category: true }
      });
    }, 'findLowStockItems');
  }
}
```

### **Service Layer Requirements**
```typescript
// MANDATORY: Constructor injection pattern
export class InventoryService {
  constructor(
    private inventoryItemRepository: InventoryItemRepository,
    private inventoryCategoryRepository: InventoryCategoryRepository,
    private supplierRepository: SupplierRepository,
    private logger: LoggerService,
    private validator: ValidationService
  ) {}

  // MANDATORY: Error handling pattern
  async createItem(data: CreateInventoryItemRequest) {
    try {
      this.logger.info('createItem', 'Creating inventory item', {
        name: data.name,
        restaurantId: data.restaurantId
      });

      const validatedData = createInventoryItemSchema.parse(data);

      // Check if category exists
      await this.validateCategoryExists(validatedData.categoryId);

      const item = await this.inventoryItemRepository.create(validatedData);

      // Create initial stock transaction if stock provided
      if (validatedData.initialStock && validatedData.initialStock > 0) {
        await this.createStockTransaction({
          inventoryItemId: item.id,
          transactionType: 'stock_in',
          quantity: validatedData.initialStock,
          reason: 'Initial stock',
          costPerUnit: validatedData.unitCost || 0
        });
      }

      this.logger.info('createItem', 'Inventory item created successfully', {
        itemId: item.id,
        name: item.name
      });

      return item;
    } catch (error) {
      this.logger.error('createItem', error, {
        name: data.name,
        restaurantId: data.restaurantId
      });
      throw error;
    }
  }

  async adjustStock(data: AdjustStockRequest) {
    try {
      this.logger.info('adjustStock', 'Adjusting inventory stock', {
        itemId: data.inventoryItemId,
        quantity: data.quantity,
        type: data.transactionType
      });

      const validatedData = adjustStockSchema.parse(data);

      // Get current item
      const item = await this.inventoryItemRepository.findById(validatedData.inventoryItemId);

      // Calculate new stock level
      const newStock = item.currentStock + validatedData.quantity;

      if (newStock < 0) {
        throw new BusinessError('Stock cannot be negative', 'INSUFFICIENT_STOCK');
      }

      // Create transaction
      await this.createStockTransaction(validatedData);

      // Update item stock
      await this.inventoryItemRepository.update(validatedData.inventoryItemId, {
        currentStock: newStock
      });

      this.logger.info('adjustStock', 'Stock adjusted successfully', {
        itemId: data.inventoryItemId,
        oldStock: item.currentStock,
        newStock: newStock,
        adjustment: data.quantity
      });

      return { newStock, transaction: validatedData };
    } catch (error) {
      this.logger.error('adjustStock', error, {
        itemId: data.inventoryItemId,
        quantity: data.quantity
      });
      throw error;
    }
  }

  async searchItems(restaurantId: string, query: string) {
    try {
      this.logger.info('searchItems', 'Searching inventory items', { restaurantId, query });

      return await this.inventoryItemRepository.search(restaurantId, query);
    } catch (error) {
      this.logger.error('searchItems', error, { restaurantId, query });
      throw error;
    }
  }

  private async validateCategoryExists(categoryId: string) {
    const category = await this.inventoryCategoryRepository.findById(categoryId);
    if (!category) {
      throw new BusinessError(`Inventory category ${categoryId} not found`, 'CATEGORY_NOT_FOUND');
    }
  }

  private async createStockTransaction(data: CreateTransactionRequest) {
    // Implementation for creating stock transaction
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
  const response = await fetch(`${process.env.BACKEND_URL}/api/v1/restaurants/${restaurantId}/inventory/items`, {
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
model InventoryCategory {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // MANDATORY: Restaurant relationship
  restaurantId String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id])

  // Category fields
  name        String
  description String?
  displayOrder Int @default(0)
  isActive    Boolean @default(true)

  // Relations
  items InventoryItem[]

  // MANDATORY: Indexes for performance
  @@index([restaurantId])
  @@index([restaurantId, isActive])

  // MANDATORY: Map to snake_case table name
  @@map("inventory_categories")
}

model InventoryItem {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // MANDATORY: Restaurant relationship
  restaurantId String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id])

  // Item fields
  name          String
  description   String?
  sku           String
  unitOfMeasure String @default("each")
  currentStock  Decimal @default(0)
  reorderPoint  Decimal @default(0)
  unitCost      Decimal @default(0)
  sellingPrice  Decimal @default(0)
  isActive      Boolean @default(true)
  imageUrl      String?
  location      String?

  // Category relationship
  categoryId String
  category   InventoryCategory @relation(fields: [categoryId], references: [id])

  // Relations
  transactions InventoryTransaction[]
  supplierItems SupplierItem[]

  // MANDATORY: Indexes for performance
  @@index([restaurantId])
  @@index([restaurantId, categoryId])
  @@index([restaurantId, sku])
  @@index([restaurantId, isActive])
  @@unique([restaurantId, sku])

  // MANDATORY: Map to snake_case table name
  @@map("inventory_items")
}

model Supplier {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // MANDATORY: Restaurant relationship
  restaurantId String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id])

  // Supplier fields
  name          String
  contactName   String?
  email         String?
  phone         String?
  address       String?
  isActive      Boolean @default(true)
  paymentTerms  String?
  notes         String?

  // Relations
  supplierItems SupplierItem[]

  // MANDATORY: Indexes for performance
  @@index([restaurantId])
  @@index([restaurantId, isActive])

  // MANDATORY: Map to snake_case table name
  @@map("suppliers")
}

model SupplierItem {
  id               String   @id @default(cuid())
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Supplier relationship
  supplierId String
  supplier   Supplier @relation(fields: [supplierId], references: [id])

  // Item relationship
  inventoryItemId String
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])

  // Supplier item fields
  supplierSku         String?
  supplierPrice       Decimal @default(0)
  leadTimeDays        Int @default(0)
  minimumOrderQuantity Decimal @default(0)
  isPreferred         Boolean @default(false)

  // MANDATORY: Indexes for performance
  @@index([supplierId])
  @@index([inventoryItemId])
  @@unique([supplierId, inventoryItemId])

  // MANDATORY: Map to snake_case table name
  @@map("supplier_items")
}

model InventoryTransaction {
  id               String   @id @default(cuid())
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Item relationship
  inventoryItemId String
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])

  // Transaction fields
  transactionType String // stock_in, stock_out, adjustment
  quantity       Decimal
  reason         String?
  reference      String? // PO number, invoice, etc.
  costPerUnit    Decimal @default(0)
  totalCost      Decimal @default(0)

  // Who performed transaction
  performedById String
  performedBy   User @relation(fields: [performedById], references: [id])

  // MANDATORY: Indexes for performance
  @@index([inventoryItemId])
  @@index([inventoryItemId, createdAt])
  @@index([performedById])

  // MANDATORY: Map to snake_case table name
  @@map("inventory_transactions")
}
```

### **Security & Permissions**
```typescript
// MANDATORY: Permission enforcement
const requiredPermissions: Permission[] = [
  'inventory.create',
  'inventory.read',
  'inventory.update',
  'inventory.delete',
  'inventory.adjust_stock',
  'inventory.view_reports'
];

// MANDATORY: Middleware chain
app.use(authenticate());
app.use(authorizeRestaurantAccess());
app.use(requirePermission(...requiredPermissions));
```

[All other mandatory patterns from template apply]

---

## 🔍 **IMPLEMENTATION CHECKLIST** (MANDATORY - AI Must Verify)

### **Repository Layer**
- [ ] Extends `BaseRepository`
- [ ] Constructor calls `super(prisma)`
- [ ] Input validation on all public methods
- [ ] Error handling via `executeQuery`
- [ ] Development logging via `logOperation`
- [ ] Container registration added
- [ ] Search functionality implemented
- [ ] Stock level queries optimized

### **Service Layer**
- [ ] Dependency injection via constructor
- [ ] Business logic separated from data access
- [ ] Error handling with custom business errors
- [ ] Input validation before processing
- [ ] Container registration added
- [ ] Stock adjustment logic implemented
- [ ] Low stock alerts functionality
- [ ] Search and categorization logic

[Rest of checklist from template applies]

---

## 🚀 **DEPLOYMENT CHECKLIST**

### **Database Migrations**
- [ ] Create inventory_categories table migration
- [ ] Create inventory_items table migration
- [ ] Create suppliers table migration
- [ ] Create supplier_items table migration
- [ ] Create inventory_transactions table migration
- [ ] Add foreign key constraints
- [ ] Create indexes for performance
- [ ] Add triggers for stock updates
- [ ] Rollback plan documented

### **Environment Variables**
- [ ] INVENTORY_DEFAULT_REORDER_MULTIPLIER=0.2 (20% of average usage)
- [ ] INVENTORY_LOW_STOCK_ALERT_ENABLED=true
- [ ] INVENTORY_AUTO_CALCULATE_COST=true
- [ ] INVENTORY_MAX_TRANSACTION_HISTORY=1000

[Rest of deployment checklist from template applies]

---

## 📝 **USAGE EXAMPLES**

### **Frontend Integration**
```typescript
// Create inventory category
const inventoryApiService = new InventoryApiService();
const category = await inventoryApiService.createCategory(restaurantId, {
  name: "Produce",
  description: "Fresh fruits and vegetables",
  displayOrder: 1
});

// Add inventory item
const item = await inventoryApiService.createItem(restaurantId, {
  categoryId: category.id,
  name: "Organic Tomatoes",
  sku: "PROD-001",
  unitOfMeasure: "lbs",
  reorderPoint: 10,
  unitCost: 2.50,
  sellingPrice: 4.99,
  initialStock: 25
});

// Adjust stock level
await inventoryApiService.adjustStock(restaurantId, item.id, {
  transactionType: "stock_out",
  quantity: -5,
  reason: "Used in lunch service"
});

// Search items
const searchResults = await inventoryApiService.searchItems(restaurantId, "tomato");

// Get low stock alerts
const lowStockItems = await inventoryApiService.getLowStockAlerts(restaurantId);
```

### **Business Logic Examples**
```typescript
// Low stock calculation
const lowStockItems = await inventoryService.getLowStockItems(restaurantId);

// Stock valuation
const totalValue = await inventoryService.calculateInventoryValue(restaurantId);

// Supplier performance
const supplierStats = await inventoryService.getSupplierPerformance(restaurantId);
```

---

## 🔄 **FUTURE EXTENSIONS**

### **Planned Enhancements**
- Barcode scanning integration
- Automatic reorder generation
- Recipe integration for usage tracking
- Cost trend analysis
- Multi-location inventory management
- Integration with POS systems
- Mobile inventory app
- RFID/NFC tag support
- Supplier portal for ordering
- Inventory forecasting using historical data

### **Integration Points**
- **Menu Module**: Menu items can consume inventory items
- **Prep Module**: Preparation workflows can deduct from inventory
- **Reports Module**: Inventory turnover, cost analysis, supplier performance
- **Revenue Module**: Cost of goods sold calculations
- **Purchase Orders**: Automated ordering based on reorder points
- **User Management**: Role-based access to inventory functions

---

> **CREATED BY:** Geoffrey | **REVIEWED BY:** AI Agent
> **APPROVED FOR:** RestaurantIQ Enterprise Standards v1.0
> **READY FOR:** Implementation and Testing

---

## 🎯 **IMPLEMENTATION READY**

This specification is now **complete and ready for AI implementation**. It includes:

✅ **Your Requirements Met:**
- Store item and recall from database ✓
- Add item functionality ✓
- Delete item functionality ✓
- Edit item functionality ✓
- Categorize item functionality ✓
- Search item functionality ✓

✅ **Enterprise Standards Enforced:**
- Repository pattern ✓
- Service layer pattern ✓
- API route structure ✓
- Database schema standards ✓
- Security & permissions ✓
- Error handling ✓
- Logging standards ✓

✅ **Business Logic Complete:**
- Stock management ✓
- Supplier management ✓
- Low stock alerts ✓
- Search functionality ✓
- Transaction history ✓

**Ready to execute:** `node scripts/validate-spec-compliance.js src/domains/inventory` after implementation.
