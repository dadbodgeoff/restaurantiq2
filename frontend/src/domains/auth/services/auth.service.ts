// Frontend-compatible auth service that makes API calls
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  restaurantId: string;
  permissions: string[];
}

export interface LoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  requiresRestaurantSelection?: boolean;
  restaurants?: Array<{
    id: string;
    name: string;
  }>;
}

export interface RestaurantSelection {
  requiresRestaurantSelection: boolean;
  restaurants: Array<{
    id: string;
    name: string;
  }>;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  restaurantId: string;
}

export class AuthService {
  private baseUrl = '/api/v1';

  async login(credentials: { email: string; password: string; restaurantId?: string }): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Login failed');
    }

    const result = await response.json();
    
    // If login is successful and we have user data, store it
    if (typeof window !== 'undefined' && result.success && result.data && !result.data.requiresRestaurantSelection) {
      localStorage.setItem('accessToken', result.data.tokens.accessToken);
      localStorage.setItem('refreshToken', result.data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }

    return result.data;
  }

  async register(data: RegisterRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Registration failed');
    }
  }

  async logout(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }
  }

  async refreshToken(): Promise<void> {
    if (typeof window === 'undefined') return; // SSR check
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
  }

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null; // SSR check
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false; // SSR check
    const token = localStorage.getItem('accessToken');
    return !!token;
  }
}
