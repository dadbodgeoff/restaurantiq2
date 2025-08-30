# 🏗️ RestaurantIQ Module Specification - Menu Management
> **Version:** 1.0 | **Framework:** Enterprise RestaurantIQ Standards
> **Created By:** Geoffrey | **AI Reviewed:** ✅

---

## 🎯 **MODULE OVERVIEW** (Your Creative Space)

### **Business Purpose**
Menu management enables restaurant operators to create, organize, and maintain their restaurant's menu offerings. This module solves the problem of menu inconsistency across different platforms and provides a centralized way to manage menu items, categories, pricing, and availability.

### **User Stories**
- As a Restaurant Manager, I want to create menu categories so that I can organize items logically
- As a Restaurant Manager, I want to add menu items with prices and descriptions so that customers know what to order
- As a Restaurant Manager, I want to update menu item availability so that I can handle temporary shortages
- As a Kitchen Staff, I want to see preparation notes for menu items so that I can cook dishes correctly
- As a Restaurant Owner, I want to analyze menu performance so that I can optimize offerings

### **Key Concepts & Relationships**
- **Menu Categories** organize items (Pizza, Burgers, Desserts)
- **Menu Items** belong to categories and have pricing, descriptions, prep notes
- **Menu Item Options** allow customization (size, toppings, sides)
- **Availability Status** tracks if items are currently orderable
- **Prep Time** helps with order timing and kitchen workflow

---

## 📋 **TECHNICAL REQUIREMENTS** (AI Implementation Guide)

### **Core Entities**
```
Entity: MenuCategory
- Fields: name:string, description:string, displayOrder:number, isActive:boolean
- Relationships: belongs to Restaurant, has many MenuItems
- Business Rules: Name required, unique per restaurant, display order determines sort

Entity: MenuItem
- Fields: name:string, description:string, price:decimal, prepTimeMinutes:number, isAvailable:boolean, imageUrl:string, prepNotes:string
- Relationships: belongs to MenuCategory, belongs to Restaurant, has many MenuItemOptions
- Business Rules: Price must be positive, name required, prep time must be reasonable

Entity: MenuItemOption
- Fields: name:string, type:string (size/topping/side), priceModifier:decimal, isRequired:boolean, maxSelections:number
- Relationships: belongs to MenuItem
- Business Rules: Name required, price modifier can be negative (discount) or positive (upcharge)
```

### **API Endpoints Required**
```
GET    /api/v1/restaurants/:id/menu/categories           # List categories
POST   /api/v1/restaurants/:id/menu/categories           # Create category
PUT    /api/v1/restaurants/:id/menu/categories/:categoryId # Update category
DELETE /api/v1/restaurants/:id/menu/categories/:categoryId # Delete category

GET    /api/v1/restaurants/:id/menu/items                # List all items
POST   /api/v1/restaurants/:id/menu/items                # Create item
GET    /api/v1/restaurants/:id/menu/items/:itemId        # Get specific item
PUT    /api/v1/restaurants/:id/menu/items/:itemId        # Update item
DELETE /api/v1/restaurants/:id/menu/items/:itemId        # Delete item
```

### **Business Logic Flows**
1. **Category Management**: Create categories, reorder them, activate/deactivate
2. **Item Management**: Add items to categories, set pricing and availability
3. **Menu Publishing**: Mark items available/unavailable for ordering
4. **Prep Coordination**: Access preparation notes and timing information

---

## 🏛️ **ENTERPRISE PATTERN ENFORCEMENT** (MANDATORY - DO NOT MODIFY)

### **Repository Pattern Requirements**
```typescript
// MANDATORY: All repositories MUST extend BaseRepository
export class MenuCategoryRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma); // MANDATORY
  }

  async findById(id: string) {
    this.validateId(id, 'MenuCategory'); // MANDATORY
    return this.executeQuery(async () => { // MANDATORY
      this.logOperation('findById', { id }); // MANDATORY
      return await this.prisma.menuCategory.findUnique({
        where: { id },
        include: { items: true }
      });
    }, 'findById'); // MANDATORY
  }
}
```

### **Service Layer Requirements**
```typescript
// MANDATORY: Constructor injection pattern
export class MenuService {
  constructor(
    private menuCategoryRepository: MenuCategoryRepository,
    private menuItemRepository: MenuItemRepository,
    private logger: LoggerService,
    private validator: ValidationService
  ) {}

  // MANDATORY: Error handling pattern
  async createCategory(data: CreateMenuCategoryRequest) {
    try {
      this.logger.info('createCategory', 'Creating menu category', { name: data.name });

      const validatedData = createMenuCategorySchema.parse(data);
      const category = await this.menuCategoryRepository.create(validatedData);

      this.logger.info('createCategory', 'Menu category created successfully', {
        categoryId: category.id,
        name: category.name
      });

      return category;
    } catch (error) {
      this.logger.error('createCategory', error, { name: data.name });
      throw error;
    }
  }
}
```

[All other mandatory patterns from the template apply - see MODULE_SPEC_TEMPLATE.md]

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

[Rest of checklist from template applies]

---

## 🚀 **DEPLOYMENT CHECKLIST**

### **Database Migrations**
- [ ] Create menu_categories table migration
- [ ] Create menu_items table migration
- [ ] Create menu_item_options table migration
- [ ] Add foreign key constraints
- [ ] Create indexes for performance
- [ ] Rollback plan documented

### **Environment Variables**
- [ ] MENU_IMAGE_UPLOAD_PATH (optional)
- [ ] MENU_DEFAULT_PREP_TIME_MINUTES=15
- [ ] MENU_MAX_CATEGORIES_PER_RESTAURANT=20

---

## 📝 **USAGE EXAMPLES**

### **Frontend Integration**
```typescript
// Create a new menu category
const menuApiService = new MenuApiService();
const category = await menuApiService.createCategory(restaurantId, {
  name: "Pizza",
  description: "Wood-fired pizzas",
  displayOrder: 1
});

// Add a menu item
const item = await menuApiService.createItem(restaurantId, {
  categoryId: category.id,
  name: "Margherita Pizza",
  description: "Fresh tomato, mozzarella, basil",
  price: 18.99,
  prepTimeMinutes: 12,
  prepNotes: "Bake at 700°F for 2 minutes"
});
```

---

## 🔄 **FUTURE EXTENSIONS**

### **Planned Enhancements**
- Menu item images with upload functionality
- Recipe management integration
- Menu scheduling (different menus for different times)
- Allergen tracking and labeling
- Nutrition information integration
- Online ordering platform integration

### **Integration Points**
- **Prep Module**: Menu items link to preparation workflows
- **Inventory Module**: Menu items can consume inventory items
- **Reports Module**: Menu performance analytics
- **Revenue Module**: Sales tracking by menu item

---

> **CREATED BY:** Geoffrey | **REVIEWED BY:** AI Agent
> **APPROVED FOR:** RestaurantIQ Enterprise Standards v1.0
> **READY FOR:** Implementation and Testing
