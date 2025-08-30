// frontend/src/app/menu/page.tsx
// Main Menu Management Page - RestaurantIQ Prep Workflow Focus

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MenuOverview } from '../../domains/menu/components/MenuOverview';
import { CategoryManager } from '../../domains/menu/components/CategoryManager';
import { ItemManager } from '../../domains/menu/components/ItemManager';
import { WeeklyMenuManager } from '../../domains/menu/components/WeeklyMenuManager';
import { useMenuCategories, useMenuItems } from '../../domains/menu/hooks/useMenu';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { ChefHat, Package, BarChart3, Calendar } from 'lucide-react';

export default function MenuPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // MANDATORY: Call hooks at the top level before any conditional returns
  const { categories, refetch: refetchCategories } = useMenuCategories();
  const { items, refetch: refetchItems } = useMenuItems();
  const [activeTab, setActiveTab] = useState('overview');

  // MANDATORY: Show loading state during authentication check
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // MANDATORY: Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">You must be logged in to access menu management.</p>
          <a
            href="/login"
            className="inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 px-4 py-2 text-sm"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // MANDATORY: Check for restaurant access
  if (!user.restaurantId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No restaurant access found. Please contact your administrator.</p>
      </div>
    );
  }

  // Wrap refetch to handle Promise properly
  const handleCategoryChange = async () => {
    try {
      await refetchCategories();
    } catch (error) {
      console.error('Failed to refetch categories:', error);
    }
  };

  // Wrap refetch to handle Promise properly
  const handleItemChange = async () => {
    try {
      await refetchItems();
    } catch (error) {
      console.error('Failed to refetch items:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b pb-6">
        <div className="flex items-center gap-3 mb-2">
          <ChefHat className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Manage your menu items and categories for efficient prep workflow operations
        </p>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="items" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Items
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Weekly Menus
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <MenuOverview restaurantId={user.restaurantId} />
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <CategoryManager
            categories={categories}
            onCategoryChange={handleCategoryChange}
          />
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-6">
          <ItemManager
            restaurantId={user.restaurantId}
            items={items}
            categories={categories}
            onItemChange={handleItemChange}
          />
        </TabsContent>

        {/* Weekly Menus Tab */}
        <TabsContent value="weekly" className="space-y-6">
          <WeeklyMenuManager
            categories={categories}
            onMenuChange={handleCategoryChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
