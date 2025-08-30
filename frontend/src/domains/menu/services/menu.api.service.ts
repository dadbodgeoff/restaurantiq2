// frontend/src/domains/menu/services/menu.api.service.ts
// Menu Management API Service - Internal RestaurantIQ Prep Workflow Focus

import { AuthService } from '../../auth/services/auth.service';
import {
  MenuCategory,
  MenuItem,
  MenuFilters,
  PaginatedMenuItems,
  MenuCategoriesResponse,
  CreateMenuCategoryRequest,
  UpdateMenuCategoryRequest,
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
  MenuCategoryWithItems,
  CategoryImportRequest,
  CategoryImportResponse
} from '../types';

export class MenuApiService {
  // MANDATORY: Use relative URLs for browser compatibility in Docker environment
  // This ensures API calls work through the Next.js dev server and nginx proxy
  private baseUrl = '';
  private authService = new AuthService();
  private isRefreshing = false;

  /**
   * Enhanced fetch with automatic token refresh
   * Handles 401 errors by refreshing token and retrying
   * MANDATORY: SSR-safe token handling following enterprise patterns
   */
  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    // MANDATORY: SSR check following enterprise standards
    if (typeof window === 'undefined') {
      throw new Error('MenuApiService cannot be used during server-side rendering');
    }

    const makeRequest = (token: string) => {
      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-correlation-id': `menu-${Date.now()}`,
          ...options.headers
        }
      });
    };

    // MANDATORY: Safe token retrieval with SSR protection
    const accessToken = localStorage.getItem('accessToken');

    // MANDATORY: Check for authentication before making request
    if (!accessToken) {
      throw new Error('No access token available. Please log in first.');
    }

    // Make initial request
    let response = await makeRequest(accessToken);

    // If 401 and we have a refresh token, try to refresh
    if (response.status === 401 && !this.isRefreshing) {
      try {
        this.isRefreshing = true;
        console.log('🔄 Token expired, refreshing...');

        await this.authService.refreshToken();

        // MANDATORY: Safe token retrieval after refresh
        const newToken = localStorage.getItem('accessToken');
        if (newToken) {
          console.log('✅ Token refreshed, retrying request...');
          response = await makeRequest(newToken);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        // If refresh fails, redirect to login or throw error
        window.location.href = '/login';
        throw new Error('Authentication expired. Please log in again.');
      } finally {
        this.isRefreshing = false;
      }
    }

    return response;
  }

  /**
   * Get all menu categories for a restaurant
   * Following existing API service patterns with auto token refresh
   */
  async getCategories(restaurantId: string): Promise<MenuCategoriesResponse> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/api/restaurants/${restaurantId}/menu/categories`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch menu categories');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Create a new menu category
   */
  async createCategory(
    restaurantId: string,
    categoryData: CreateMenuCategoryRequest
  ): Promise<MenuCategory> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/api/restaurants/${restaurantId}/menu/categories`, {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create menu category');
    }

    const data = await response.json();
    return data.data.category;
  }

  /**
   * Update an existing menu category
   */
  async updateCategory(
    restaurantId: string,
    categoryId: string,
    categoryData: UpdateMenuCategoryRequest
  ): Promise<MenuCategory> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/api/restaurants/${restaurantId}/menu/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update menu category');
    }

    const data = await response.json();
    return data.data.category;
  }

  /**
   * Delete a menu category
   */
  async deleteCategory(restaurantId: string, categoryId: string): Promise<void> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/api/restaurants/${restaurantId}/menu/categories/${categoryId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete menu category');
    }
  }

  /**
   * Get menu items with pagination and filters
   * Following existing API service patterns with pagination
   */
  async getItems(
    restaurantId: string,
    filters: MenuFilters = {}
  ): Promise<PaginatedMenuItems> {
    const queryParams = new URLSearchParams();

    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    if (filters.categoryId) queryParams.append('categoryId', filters.categoryId);
    if (filters.isAvailable !== undefined) queryParams.append('isAvailable', filters.isAvailable.toString());
    if (filters.station) queryParams.append('station', filters.station);
    if (filters.search) queryParams.append('search', filters.search);

    const response = await this.fetchWithAuth(`${this.baseUrl}/api/restaurants/${restaurantId}/menu/items?${queryParams}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch menu items');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Create a new menu item
   */
  async createItem(
    restaurantId: string,
    itemData: CreateMenuItemRequest
  ): Promise<MenuItem> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/api/restaurants/${restaurantId}/menu/items`, {
      method: 'POST',
      body: JSON.stringify(itemData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create menu item');
    }

    const data = await response.json();
    return data.data.item;
  }

  /**
   * Update an existing menu item
   */
  async updateItem(
    restaurantId: string,
    itemId: string,
    itemData: UpdateMenuItemRequest
  ): Promise<MenuItem> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/api/restaurants/${restaurantId}/menu/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(itemData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update menu item');
    }

    const data = await response.json();
    return data.data.item;
  }

  /**
   * Delete a menu item
   */
  async deleteItem(restaurantId: string, itemId: string): Promise<void> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/api/restaurants/${restaurantId}/menu/items/${itemId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete menu item');
    }
  }

  /**
   * Toggle item availability (quick operational control)
   */
  async toggleAvailability(
    restaurantId: string,
    itemId: string,
    isAvailable: boolean
  ): Promise<MenuItem> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/api/restaurants/${restaurantId}/menu/items/${itemId}/availability`, {
      method: 'PUT',
      body: JSON.stringify({ isAvailable })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to toggle item availability');
    }

    const data = await response.json();
    return data.data.item;
  }

  /**
   * Search menu items (for prep workflow quick lookup)
   */
  async searchItems(
    restaurantId: string,
    query: string
  ): Promise<MenuItem[]> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/api/restaurants/${restaurantId}/menu/search?query=${encodeURIComponent(query)}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to search menu items');
    }

    const data = await response.json();
    return data.data.items;
  }

  /**
   * Get categories with their associated items
   */
  async getCategoriesWithItems(restaurantId: string): Promise<MenuCategoryWithItems[]> {
    console.log('Fetching categories with items for restaurant:', restaurantId);

    const response = await this.fetchWithAuth(`${this.baseUrl}/api/restaurants/${restaurantId}/menu/categories/with-items`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to fetch categories with items');
    }

    const apiResponse = await response.json();
    return apiResponse.data.categories;
  }

  /**
   * Import selected categories with their items to a daily menu
   */
  async importCategoriesWithItems(
    restaurantId: string,
    request: CategoryImportRequest
  ): Promise<CategoryImportResponse> {
    console.log('Importing categories with items:', request);

    const response = await this.fetchWithAuth(`${this.baseUrl}/api/restaurants/${restaurantId}/menu/weekly-menus/import-categories`, {
      method: 'POST',
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to import categories');
    }

    const apiResponse = await response.json();
    return apiResponse.data;
  }
}
