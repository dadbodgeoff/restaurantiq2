'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { AuthService, User, LoginResponse, RestaurantSelection } from '@/domains/auth/services/auth.service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, restaurantId?: string) => Promise<LoginResponse>;
  loginWithRestaurant: (email: string, password: string, restaurantId: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    restaurantId: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider for authentication context

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start with false for SSR

  // Create auth service instance directly
  const authService = useMemo(() => new AuthService(), []);

  // Inactivity tracking
  const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
  const lastActivity = useRef<number>(Date.now());

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if user is already authenticated on app load
    const initializeAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser && authService.isAuthenticated()) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      }
    };

    initializeAuth();
  }, [authService]); // Removed 'user' to prevent infinite loop

  // Separate useEffect for inactivity detection
  useEffect(() => {
    // Only run on client side and when user is logged in
    if (typeof window === 'undefined' || !user) return;

    const updateActivity = () => {
      lastActivity.current = Date.now();
    };

    // Listen for user activity
    document.addEventListener('mousedown', updateActivity);
    document.addEventListener('keydown', updateActivity);
    document.addEventListener('scroll', updateActivity);
    document.addEventListener('touchstart', updateActivity);

    // Check for inactivity every minute
    const inactivityInterval = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity.current;
      if (inactiveTime > INACTIVITY_TIMEOUT) {
        console.log('🔒 User inactive for 2 hours, logging out...');
        authService.logout().finally(() => {
          setUser(null);
          // Optional: redirect to login
          window.location.href = '/login';
        });
        clearInterval(inactivityInterval);
      }
    }, 60 * 1000); // Check every minute

    // Cleanup function
    return () => {
      document.removeEventListener('mousedown', updateActivity);
      document.removeEventListener('keydown', updateActivity);
      document.removeEventListener('scroll', updateActivity);
      document.removeEventListener('touchstart', updateActivity);
      clearInterval(inactivityInterval);
    };
  }, [user, authService]); // Only depends on user and authService

  const login = async (email: string, password: string, restaurantId?: string): Promise<LoginResponse> => {
    setIsLoading(true);
    try {
      const result = await authService.login({ email, password, restaurantId });

      // If restaurant selection is required, don't set user yet
      if (!result.requiresRestaurantSelection) {
        setUser(result.user);
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithRestaurant = async (email: string, password: string, restaurantId: string) => {
    setIsLoading(true);
    try {
      const result = await authService.login({ email, password, restaurantId });
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    restaurantId: string;
  }) => {
    setIsLoading(true);
    try {
      await authService.register(data);
      // After registration, user needs to login
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const refreshToken = async () => {
    try {
      await authService.refreshToken();
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Token refresh failed:', error);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null, // Don't call authService.isAuthenticated() during SSR
    isLoading,
    login,
    loginWithRestaurant,
    register,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
