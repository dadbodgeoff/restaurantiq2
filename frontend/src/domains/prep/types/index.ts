// frontend/src/domains/prep/types/index.ts
// Frontend Prep Types - RestaurantIQ Simple CRUD System

// Core Prep Entities
export interface PrepItem {
  id: string;
  restaurantId: string;
  menuItemId: string;
  businessDate: string; // ISO date string
  par: number;           // Amount needed for next business day
  onHand: number;        // Amount available today for next business day
  amountToPrep: number;  // Calculated: par - onHand (READ ONLY)
  notes?: string;
  unit?: string;         // oz, lbs, each, etc.
  createdAt: string;
  updatedAt: string;
  
  // Relations
  menuItem?: {
    id: string;
    name: string;
    categoryId: string;
    category?: {
      id: string;
      name: string;
    };
  };
}

// Update Request Types
export interface UpdatePrepItemRequest {
  par?: number;
  onHand?: number;
  notes?: string;
}

// API Response Types
export interface PrepItemsResponse {
  items: PrepItem[];
  date: string;
  restaurantId: string;
}

export interface PrepSyncResponse {
  itemsCreated: number;
  itemsUpdated: number;
  itemsSkipped: number;
  totalMenuItems: number;
  syncedAt: string;
}

// API Response Wrapper
export interface PrepApiResponse<T> {
  success: boolean;
  data: T;
  correlationId: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Filters and State
export interface PrepFilters {
  search?: string;
  categoryId?: string;
  hasNotes?: boolean;
  needsPrep?: boolean; // Items where amountToPrep > 0
}

export interface PrepState {
  items: PrepItem[];
  loading: boolean;
  error: string | null;
  currentDate: string;
  filters: PrepFilters;
  lastSyncAt?: string;
}

// Tab Types for 3-tab interface
export type PrepTab = 'par' | 'onHand' | 'amountToPrep';

export interface PrepTabConfig {
  id: PrepTab;
  label: string;
  description: string;
  editable: boolean;
  field: keyof PrepItem;
}

// Component Props
export interface PrepManagerProps {
  restaurantId: string;
  initialDate?: string;
}

export interface PrepItemRowProps {
  item: PrepItem;
  activeTab: PrepTab;
  onUpdate: (itemId: string, updates: UpdatePrepItemRequest) => void;
  loading?: boolean;
}

export interface PrepTabsProps {
  activeTab: PrepTab;
  onTabChange: (tab: PrepTab) => void;
  items: PrepItem[];
}

// Permissions (following existing patterns)
export interface PrepPermissions {
  canViewPrep: boolean;
  canUpdatePrep: boolean;
  canSyncPrep: boolean;
}
