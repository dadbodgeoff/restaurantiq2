export interface Restaurant {
  id: string;
  name: string;
  timezone: string;
  locale: string;
  currency: string;
  isActive: boolean;
  settings: RestaurantSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface RestaurantSettings {
  prepFinalizationTime: string;   // '23:30' (11:30 PM EST)
  gracePeriodHours: number;       // 1 hour
  snapshotRetentionDays: number;  // 90 days
  enableAutoSync: boolean;        // true
  workingHours: {
    start: string;               // '06:00'
    end: string;                 // '23:00'
  };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string; // Hashed password
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date | null;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  restaurantId: string;
  assignedById?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const UserRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  GUEST: 'GUEST'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];
