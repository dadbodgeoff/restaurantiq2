import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MenuApiService } from '../services/menu.api.service';
import {
  MenuCategoryWithItems,
  CategoryImportResponse,
  DayOfWeek
} from '../types';

export function useCategoryImport() {
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [categoriesWithItems, setCategoriesWithItems] = useState<MenuCategoryWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCategoriesWithItems = async () => {
    if (!user?.restaurantId) return;

    setIsLoading(true);
    try {
      const apiService = new MenuApiService();
      const categories = await apiService.getCategoriesWithItems(user.restaurantId);
      setCategoriesWithItems(categories);
    } catch (error) {
      console.error('Failed to load categories with items:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const importCategories = async (
    dayOfWeek: DayOfWeek,
    categoryIds: string[]
  ): Promise<CategoryImportResponse | null> => {
    if (!user?.restaurantId) {
      setIsImporting(false);
      return null;
    }

    setIsImporting(true);
    try {
      const apiService = new MenuApiService();
      const result = await apiService.importCategoriesWithItems(user.restaurantId, {
        dayOfWeek,
        categoryIds
      });

      console.log(`Successfully imported ${result.data.itemsImported} items from ${result.data.categoriesProcessed} categories to ${dayOfWeek}`);
      return result;
    } catch (error) {
      console.error('Failed to import categories:', error);
      throw error;
    } finally {
      // Ensure isImporting is always reset
      setIsImporting(false);
    }
  };

  return {
    categoriesWithItems,
    isLoading,
    isImporting,
    loadCategoriesWithItems,
    importCategories
  };
}
