// 🚀 MODULE REGISTRATION GUIDE
// This file demonstrates how to easily add new modules to RestaurantIQ

import { moduleRegistry } from './module-registry';

// Import your new modules here as you create them
// import { createMenuModule } from '../domains/menu/menu.module';
// import { createPrepModule } from '../domains/prep/prep.module';
// import { createRevenueModule } from '../domains/revenue/revenue.module';

export const registerAllModules = (_container: unknown): void => {
  // 🏪 Restaurant Module (Core - already registered in container.ts)
  // This is the foundation module with restaurant/user management

  // 🍽️ Menu Module - Uncomment when ready
  // moduleRegistry.register(createMenuModule(container));

  // 📋 PREP Module - Uncomment when ready
  // moduleRegistry.register(createPrepModule(container));

  // 💰 Revenue Module - Uncomment when ready
  // moduleRegistry.register(createRevenueModule(container));

  // 🔄 Add new modules here following the same pattern:
  //
  // 1. Create your module class extending BaseRestaurantModule
  // 2. Implement the required interface methods
  // 3. Register services, repositories, and routes
  // 4. Import and register the module here
  // 5. That's it! Your module is automatically integrated

  // eslint-disable-next-line no-console
  console.log(`📦 Registered ${moduleRegistry.getAllModules().length} modules`);
};
