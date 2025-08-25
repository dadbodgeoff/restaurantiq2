// Frontend Configuration - Following backend patterns
export const config = {
  // Application Configuration
  NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV || 'development',
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'RestaurantIQ',
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

  // Backend API Configuration
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',

  // Authentication Configuration
  JWT_SECRET: process.env.NEXT_PUBLIC_JWT_SECRET || 'your-jwt-secret-key-change-in-production',

  // Feature Flags (following backend patterns)
  ENABLE_DEBUG: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',

  // UI Configuration
  PRIMARY_COLOR: process.env.NEXT_PUBLIC_PRIMARY_COLOR || 'blue-600',
  THEME: process.env.NEXT_PUBLIC_THEME || 'light',

  // Route Configuration
  ROUTES: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    SETUP: '/setup',
    DASHBOARD: '/dashboard',
  },

  // API Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
    },
    RESTAURANTS: {
      SETUP: '/restaurants/setup',
      SETUP_COMPLETE: '/restaurants/setup-complete',
    },
  },
} as const;

export type Config = typeof config;
