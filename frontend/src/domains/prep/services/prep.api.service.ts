// frontend/src/domains/prep/services/prep.api.service.ts
// PrepApiService - Following RestaurantIQ API patterns

import { AuthService } from '../../auth/services/auth.service';
import {
  PrepItem,
  PrepItemsResponse,
  PrepSyncResponse,
  UpdatePrepItemRequest,
  PrepApiResponse
} from '../types';

export class PrepApiService {
  // MANDATORY: Use relative URLs for browser compatibility in Docker environment
  private readonly baseUrl = '';
  private readonly authService = new AuthService();
  private isRefreshing = false;
  private readonly basePath = '/api/restaurants';

  /**
   * Enhanced fetch with automatic token refresh
   * Following MenuApiService patterns
   */
  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    // MANDATORY: SSR check following enterprise standards
    if (typeof window === 'undefined') {
      throw new Error('PrepApiService cannot be used during server-side rendering');
    }

    const makeRequest = (token: string) => {
      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-correlation-id': `prep-${Date.now()}`,
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
   * Generic request handler
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await this.fetchWithAuth(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: { message: errorText || `HTTP ${response.status}: ${response.statusText}` } };
      }
      
      throw new Error(error.error?.message || `Failed to complete request: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get prep items for a specific restaurant and date
   */
  async getPrepItems(
    restaurantId: string,
    date: string
  ): Promise<PrepItem[]> {
    const response = await this.request<PrepApiResponse<PrepItem[]>>(
      `${this.basePath}/${restaurantId}/prep/${date}`
    );
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch prep items');
    }
    
    return response.data;
  }

  /**
   * Update a specific prep item
   */
  async updatePrepItem(
    restaurantId: string,
    itemId: string,
    updates: UpdatePrepItemRequest
  ): Promise<PrepItem> {
    const response = await this.request<PrepApiResponse<PrepItem>>(
      `${this.basePath}/${restaurantId}/prep/items/${itemId}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates)
      }
    );
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update prep item');
    }
    
    return response.data;
  }

  /**
   * Sync prep items from menu for a specific date
   */
  async syncFromMenu(
    restaurantId: string,
    date: string
  ): Promise<PrepSyncResponse> {
    const response = await this.request<PrepApiResponse<PrepSyncResponse>>(
      `${this.basePath}/${restaurantId}/prep/${date}/sync`,
      {
        method: 'POST',
        body: JSON.stringify({})
      }
    );
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to sync prep items');
    }
    
    return response.data;
  }

  /**
   * Calculate amount to prep for all items (client-side helper)
   */
  calculateAmountToPrep(items: PrepItem[]): PrepItem[] {
    return items.map(item => ({
      ...item,
      amountToPrep: Math.max(0, item.par - item.onHand)
    }));
  }

  /**
   * Get prep summary statistics
   */
  getPrepSummary(items: PrepItem[]) {
    const totalItems = items.length;
    const itemsNeedingPrep = items.filter(item => 
      (item.par - item.onHand) > 0
    ).length;
    const totalAmountToPrep = items.reduce(
      (sum, item) => sum + Math.max(0, item.par - item.onHand), 
      0
    );
    
    return {
      totalItems,
      itemsNeedingPrep,
      totalAmountToPrep,
      percentComplete: totalItems > 0 ? 
        ((totalItems - itemsNeedingPrep) / totalItems) * 100 : 0
    };
  }

  /**
   * Save current prep items as preset for a day of week
   */
  async savePreset(
    restaurantId: string,
    dayOfWeek: string,
    prepItems: PrepItem[]
  ): Promise<{ message: string }> {
    const prepData = prepItems.map(item => ({
      menuItemId: item.menuItemId,
      par: item.par
    }));

    const response = await this.request<PrepApiResponse<{ message: string }>>(
      `${this.basePath}/${restaurantId}/prep/presets/${dayOfWeek}/save`,
      {
        method: 'POST',
        body: JSON.stringify({ prepItems: prepData })
      }
    );
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to save preset');
    }
    
    return response.data;
  }

  /**
   * Load prep preset for a day of week
   */
  async loadPreset(
    restaurantId: string,
    dayOfWeek: string
  ): Promise<any[]> {
    const response = await this.request<PrepApiResponse<any[]>>(
      `${this.basePath}/${restaurantId}/prep/presets/${dayOfWeek}/load`
    );
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to load preset');
    }
    
    return response.data;
  }

  /**
   * Finalize prep list - save final values to database
   */
  async finalizePrepList(
    restaurantId: string,
    date: string,
    prepItems: PrepItem[]
  ): Promise<{ message: string; data: any }> {
    const response = await this.request<PrepApiResponse<{ message: string; data: any }>>(
      `${this.basePath}/${restaurantId}/prep/${date}/finalize`,
      {
        method: 'POST',
        body: JSON.stringify({ prepItems })
      }
    );
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to finalize prep list');
    }
    
    return response.data;
  }
}
