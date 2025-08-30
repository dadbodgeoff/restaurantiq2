// frontend/src/domains/user/services/user.api.service.ts
// User Management API Service - Following AuthService pattern with direct fetch

import {
  User,
  UserFilters,
  UserRole,
  PaginatedUsers,
  UserRoleUpdate,
  UpdateRoleRequest,
  UpdateRoleResponse,
  CreateUserRequest,
  CreateUserResponse,
  UserApiResponse
} from '../types';
import { AuthService } from '../../auth/services/auth.service';

export class UserApiService {
  private authService: AuthService;
  private isRefreshing = false;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * 🔄 Automatic token refresh on 401 errors
   * Handles token refresh and retries the request with new token
   */
  private async makeRequest(endpoint: string, options: RequestInit, retryCount = 0): Promise<Response> {
    try {
      const response = await fetch(endpoint, options);

      // If we get a 401 and haven't tried refreshing yet
      if (response.status === 401 && retryCount === 0 && !this.isRefreshing) {
        try {
          this.isRefreshing = true;
          console.log('🔄 Token expired, attempting refresh...');

          // Try to refresh the token
          await this.authService.refreshToken();

          // Retry the request with new token
          const newToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
          if (newToken) {
            const newOptions = {
              ...options,
              headers: {
                ...options.headers,
                'Authorization': `Bearer ${newToken}`,
              },
            };
            console.log('🔄 Retrying request with new token...');
            return this.makeRequest(endpoint, newOptions, retryCount + 1);
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          // Refresh failed, return original 401 response
          return response;
        } finally {
          this.isRefreshing = false;
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get users for a restaurant with filtering and pagination
   * Following AuthService pattern - use fetch directly for Next.js API routes
   */
  async getUsers(
    restaurantId: string,
    filters: UserFilters = {}
  ): Promise<UserApiResponse<PaginatedUsers>> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.role) params.append('role', filters.role);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters.search) params.append('search', filters.search);

    const endpoint = `/api/restaurants/${restaurantId}/users${params.toString() ? `?${params.toString()}` : ''}`;

    // Get JWT token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const response = await this.makeRequest(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch users');
    }

    return response.json();
  }

  /**
   * Update user role
   * Following AuthService pattern - use fetch directly for Next.js API routes
   */
  async updateUserRole(
    restaurantId: string,
    userId: string,
    role: UserRole
  ): Promise<UserApiResponse<UserRoleUpdate>> {
    const endpoint = `/api/restaurants/${restaurantId}/users/${userId}/role`;
    const requestData: UpdateRoleRequest = { role };

    // Get JWT token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const response = await this.makeRequest(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update user role');
    }

    return response.json();
  }

  /**
   * Get specific user details
   * Following AuthService pattern - use fetch directly for Next.js API routes
   */
  async getUser(
    restaurantId: string,
    userId: string
  ): Promise<UserApiResponse<User>> {
    const endpoint = `/api/restaurants/${restaurantId}/users/${userId}`;

    // Get JWT token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const response = await this.makeRequest(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch user');
    }

    return response.json();
  }

  /**
   * Update user details (general update)
   * Following AuthService pattern - use fetch directly for Next.js API routes
   */
  async updateUser(
    restaurantId: string,
    userId: string,
    userData: Partial<User>
  ): Promise<UserApiResponse<User>> {
    const endpoint = `/api/restaurants/${restaurantId}/users/${userId}`;

    // Get JWT token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const response = await this.makeRequest(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update user');
    }

    return response.json();
  }

  /**
   * Delete/inactivate user
   * Following AuthService pattern - use fetch directly for Next.js API routes
   */
  async deleteUser(
    restaurantId: string,
    userId: string
  ): Promise<UserApiResponse<{ userId: string; deleted: boolean }>> {
    const endpoint = `/api/restaurants/${restaurantId}/users/${userId}`;

    // Get JWT token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const response = await this.makeRequest(endpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete user');
    }

    return response.json();
  }

  /**
   * Reset user password
   * Following AuthService pattern - use fetch directly for Next.js API routes
   */
  async resetPassword(
    restaurantId: string,
    userId: string
  ): Promise<UserApiResponse<{ message: string }>> {
    const endpoint = `/api/restaurants/${restaurantId}/users/${userId}/reset-password`;

    // Get JWT token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const response = await this.makeRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to reset password');
    }

    return response.json();
  }

  /**
   * Get available roles and permissions
   * Following AuthService pattern - use fetch directly for Next.js API routes
   */
  async getRoles(
    restaurantId: string
  ): Promise<UserApiResponse<{
    availableRoles: string[];
    assignableRoles: string[];
    currentUserRole: string;
  }>> {
    const endpoint = `/api/restaurants/${restaurantId}/roles`;

    // Get JWT token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const response = await this.makeRequest(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch roles');
    }

    return response.json();
  }

  /**
   * Create a new user
   * Following AuthService pattern - use fetch directly for Next.js API routes
   */
  async createUser(
    restaurantId: string,
    userData: CreateUserRequest
  ): Promise<UserApiResponse<CreateUserResponse>> {
    const endpoint = `/api/restaurants/${restaurantId}/users`;

    // Get JWT token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const response = await this.makeRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create user');
    }

    return response.json();
  }
}
