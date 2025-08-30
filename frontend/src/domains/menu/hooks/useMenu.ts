// frontend/src/domains/menu/hooks/useMenu.ts
// Menu hooks following existing patterns

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { MenuApiService } from '../services/menu.api.service';
import { MenuCategory, MenuItem, MenuCategoriesResponse, MenuItemsResponse, CreateMenuCategoryRequest, CreateMenuItemRequest, UpdateMenuItemRequest } from '../types';

export function useMenuCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Simple category loading
  const categoriesQuery = useQuery({
    queryKey: user ? ['menu-categories', user.restaurantId] : ['menu-categories'],
    queryFn: async (): Promise<MenuCategory[]> => {
      if (!user) return [];
      const apiService = new MenuApiService();
      const response: MenuCategoriesResponse = await apiService.getCategories(user.restaurantId);
      return response.categories;
    },
    enabled: !!user,
  });

  // Simple category creation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CreateMenuCategoryRequest) => {
      if (!user) throw new Error('User not authenticated');
      if (!user.restaurantId) throw new Error('Restaurant ID is required');

      console.log('Creating category with restaurantId:', user.restaurantId);
      const apiService = new MenuApiService();
      return apiService.createCategory(user.restaurantId, data);
    },
    onSuccess: () => {
      if (user) {
        // Invalidate both categories and items since they're interconnected
        queryClient.invalidateQueries({ queryKey: ['menu-categories', user.restaurantId] });
        queryClient.invalidateQueries({ queryKey: ['menu-items', user.restaurantId] });
      }
    },
  });

  // Simple category update
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ categoryId, data }: { categoryId: string; data: Partial<CreateMenuCategoryRequest> }) => {
      if (!user) throw new Error('User not authenticated');
      const apiService = new MenuApiService();
      return apiService.updateCategory(user.restaurantId, categoryId, data);
    },
    onSuccess: () => {
      if (user) {
        // Invalidate both categories and items since they're interconnected
        queryClient.invalidateQueries({ queryKey: ['menu-categories', user.restaurantId] });
        queryClient.invalidateQueries({ queryKey: ['menu-items', user.restaurantId] });
      }
    },
  });

  // Simple category deletion
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      if (!user) throw new Error('User not authenticated');
      const apiService = new MenuApiService();
      return apiService.deleteCategory(user.restaurantId, categoryId);
    },
    onSuccess: () => {
      if (user) {
        // Invalidate both categories and items since they're interconnected
        queryClient.invalidateQueries({ queryKey: ['menu-categories', user.restaurantId] });
        queryClient.invalidateQueries({ queryKey: ['menu-items', user.restaurantId] });
      }
    },
  });

  return {
    categories: categoriesQuery.data || [],
    isLoading: categoriesQuery.isLoading,
    error: categoriesQuery.error,
    createCategory: createCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,
    isCreating: createCategoryMutation.isPending,
    isUpdating: updateCategoryMutation.isPending,
    isDeleting: deleteCategoryMutation.isPending,
  };
}

export function useMenuPermissions() {
  const { user } = useAuth();

  // Use enterprise permission system instead of hardcoded roles
  const permissions = user?.permissions || [];

  return {
    data: {
      canViewMenu: !!user && permissions.includes('menu.read'),
      canManageMenu: !!user && permissions.includes('menu.manage'),
      canManageCategories: !!user && permissions.includes('menu.manage'),
      canToggleAvailability: !!user && permissions.includes('prep.manage'),
    },
  };
}

export function useMenuItems() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Items loading with pagination
  const itemsQuery = useQuery({
    queryKey: user ? ['menu-items', user.restaurantId] : ['menu-items'],
    queryFn: async (): Promise<MenuItem[]> => {
      if (!user) return [];
      const apiService = new MenuApiService();
      const response: MenuItemsResponse = await apiService.getItems(user.restaurantId);
      return response.items;
    },
    enabled: !!user,
  });

  // Item creation mutation
  const createItemMutation = useMutation({
    mutationFn: async (data: CreateMenuItemRequest) => {
      if (!user) throw new Error('User not authenticated');
      if (!user.restaurantId) throw new Error('Restaurant ID is required');

      console.log('Creating item with restaurantId:', user.restaurantId);
      const apiService = new MenuApiService();
      return apiService.createItem(user.restaurantId, data);
    },
    onSuccess: () => {
      if (user) {
        // Invalidate both items and categories since category item counts depend on items
        queryClient.invalidateQueries({ queryKey: ['menu-items', user.restaurantId] });
        queryClient.invalidateQueries({ queryKey: ['menu-categories', user.restaurantId] });
      }
    },
  });

  // Item update mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: UpdateMenuItemRequest }) => {
      if (!user) throw new Error('User not authenticated');
      const apiService = new MenuApiService();
      return apiService.updateItem(user.restaurantId, itemId, data);
    },
    onSuccess: () => {
      if (user) {
        // Invalidate both items and categories since category item counts depend on items
        queryClient.invalidateQueries({ queryKey: ['menu-items', user.restaurantId] });
        queryClient.invalidateQueries({ queryKey: ['menu-categories', user.restaurantId] });
      }
    },
  });

  // Item deletion mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!user) throw new Error('User not authenticated');
      const apiService = new MenuApiService();
      return apiService.deleteItem(user.restaurantId, itemId);
    },
    onSuccess: () => {
      if (user) {
        // Invalidate both items and categories since category item counts depend on items
        queryClient.invalidateQueries({ queryKey: ['menu-items', user.restaurantId] });
        queryClient.invalidateQueries({ queryKey: ['menu-categories', user.restaurantId] });
      }
    },
  });

  // Toggle availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ itemId, isAvailable }: { itemId: string; isAvailable: boolean }) => {
      if (!user) throw new Error('User not authenticated');
      const apiService = new MenuApiService();
      return apiService.toggleAvailability(user.restaurantId, itemId, isAvailable);
    },
    onSuccess: () => {
      if (user) {
        // Invalidate both items and categories since category item counts depend on items
        queryClient.invalidateQueries({ queryKey: ['menu-items', user.restaurantId] });
        queryClient.invalidateQueries({ queryKey: ['menu-categories', user.restaurantId] });
      }
    },
  });

  return {
    items: itemsQuery.data || [],
    isLoading: itemsQuery.isLoading,
    error: itemsQuery.error,
    createItem: createItemMutation.mutateAsync,
    updateItem: updateItemMutation.mutateAsync,
    deleteItem: deleteItemMutation.mutateAsync,
    toggleAvailability: toggleAvailabilityMutation.mutateAsync,
    isCreating: createItemMutation.isPending,
    isUpdating: updateItemMutation.isPending,
    isDeleting: deleteItemMutation.isPending,
    isToggling: toggleAvailabilityMutation.isPending,
  };
}

// Overview hook - placeholder until backend endpoint is created
export function useMenuOverview() {
  return {
    data: null, // Placeholder until backend endpoint exists
    isLoading: false,
    error: null,
  };
}
