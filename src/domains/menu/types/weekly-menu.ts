// src/domains/menu/types/weekly-menu.ts
// Weekly Menu Types - Brain/Logic System

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday', 
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday'
};

// Weekly Menu Item (simplified for brain system)
export interface WeeklyMenuItem {
  id: string; // Unique ID for this specific menu item instance
  name: string;
  categoryId: string;
  categoryName: string;
  createdAt: Date;
}

// Weekly Menu (per day)
export interface WeeklyMenu {
  id: string;
  restaurantId: string;
  dayOfWeek: DayOfWeek;
  menuItems: WeeklyMenuItem[];
  isActive: boolean;
  lastModified: Date;
  version: number;
  createdBy: string;
  lastEditedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create/Update Requests
export interface CreateWeeklyMenuRequest {
  dayOfWeek: DayOfWeek;
  menuItems: Omit<WeeklyMenuItem, 'id' | 'createdAt'>[];
}

export interface UpdateWeeklyMenuRequest {
  menuItems: Omit<WeeklyMenuItem, 'id' | 'createdAt'>[];
}

export interface CopyMenuRequest {
  sourceDayOfWeek: DayOfWeek;
  targetDayOfWeek: DayOfWeek;
}

// API Response Types
export interface WeeklyMenuResponse {
  success: boolean;
  data: {
    menu: WeeklyMenu;
  };
}

export interface WeeklyMenusResponse {
  success: boolean;
  data: {
    menus: WeeklyMenu[];
  };
}

// Frontend Component Props
export interface WeeklyMenuManagerProps {
  restaurantId: string;
  onMenuChange?: () => void;
}

export interface DaySelectorProps {
  selectedDay: DayOfWeek;
  onDayChange: (day: DayOfWeek) => void;
  hasMenus: Record<DayOfWeek, boolean>;
}

export interface MenuEditorProps {
  dayOfWeek: DayOfWeek;
  menu: WeeklyMenu | null;
  categories: any[]; // From existing MenuCategory type
  onSave: (menu: CreateWeeklyMenuRequest | UpdateWeeklyMenuRequest) => Promise<void>;
  onCopy: (request: CopyMenuRequest) => Promise<void>;
}

// Form Data
export interface WeeklyMenuFormData {
  selectedDay: DayOfWeek;
  items: Array<{
    name: string;
    categoryId: string;
  }>;
}

export interface MenuCopyFormData {
  sourceDay: DayOfWeek;
  targetDay: DayOfWeek;
}
