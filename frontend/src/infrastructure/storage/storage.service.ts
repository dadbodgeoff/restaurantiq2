import { User, AuthTokens } from '../../domains/auth/services/auth.service';

export class StorageService {
  private readonly TOKEN_KEY = 'restaurant_iq_tokens';
  private readonly USER_KEY = 'restaurant_iq_user';

  // Token management
  setTokens(tokens: AuthTokens): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokens));
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  getTokens(): AuthTokens | null {
    try {
      const tokens = localStorage.getItem(this.TOKEN_KEY);
      return tokens ? JSON.parse(tokens) : null;
    } catch (error) {
      console.error('Failed to retrieve tokens:', error);
      return null;
    }
  }

  getAccessToken(): string | null {
    const tokens = this.getTokens();
    return tokens?.accessToken || null;
  }

  getRefreshToken(): string | null {
    const tokens = this.getTokens();
    return tokens?.refreshToken || null;
  }

  // User management
  setUser(user: User): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user:', error);
    }
  }

  getUser(): User | null {
    try {
      const user = localStorage.getItem(this.USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Failed to retrieve user:', error);
      return null;
    }
  }

  // Clear all data
  clear(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  // Utility methods
  hasValidTokens(): boolean {
    const tokens = this.getTokens();
    if (!tokens?.accessToken) return false;

    try {
      // Check if token is expired (basic check)
      const payload = JSON.parse(atob(tokens.accessToken.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Failed to validate token:', error);
      return false;
    }
  }

  // Session storage for temporary data
  setSessionItem(key: string, value: unknown): void {
    try {
      sessionStorage.setItem(`restaurant_iq_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to store session item:', error);
    }
  }

  getSessionItem<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(`restaurant_iq_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to retrieve session item:', error);
      return null;
    }
  }

  removeSessionItem(key: string): void {
    try {
      sessionStorage.removeItem(`restaurant_iq_${key}`);
    } catch (error) {
      console.error('Failed to remove session item:', error);
    }
  }

  clearSession(): void {
    try {
      // Clear only our app's session items
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('restaurant_iq_')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }
}
