// frontend/src/domains/menu/components/WeeklyMenuManager.tsx
// Weekly Menu Management Component - RestaurantIQ Brain System

'use client';

import React, { useState } from 'react';
import { DayOfWeek, DAYS_OF_WEEK, DAY_LABELS } from '../types';
import { MenuCategory } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Label } from '../../../components/ui/Label';
import { Badge } from '../../../components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/Dialog';
import {
  Calendar,
  Copy,
  Plus,
  Trash2,
  Edit,
  Save,
  Download
} from 'lucide-react';
import { useCategoryImport } from '../hooks/useCategoryImport';
import { CategoryImportDialog } from './CategoryImportDialog';

export interface WeeklyMenuManagerProps {
  categories: MenuCategory[];
  onMenuChange?: () => void;
}

export function WeeklyMenuManager({ categories, onMenuChange }: WeeklyMenuManagerProps) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY');
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [sourceDay, setSourceDay] = useState<DayOfWeek>('MONDAY');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  // Mock data for now - will be replaced with actual API calls
  const [weeklyMenus, setWeeklyMenus] = useState<Record<DayOfWeek, any[]>>({
    MONDAY: [],
    TUESDAY: [],
    WEDNESDAY: [],
    THURSDAY: [],
    FRIDAY: [],
    SATURDAY: [],
    SUNDAY: []
  });

  // Add new hook for category import functionality
  const {
    categoriesWithItems,
    isLoading: isLoadingCategories,
    isImporting,
    loadCategoriesWithItems,
    importCategories
  } = useCategoryImport();

  const currentDayMenu = weeklyMenus[selectedDay] || [];
  const hasMenus = Object.keys(weeklyMenus).reduce((acc, day) => {
    acc[day as DayOfWeek] = weeklyMenus[day as DayOfWeek].length > 0;
    return acc;
  }, {} as Record<string, boolean>);

  const handleCreateFreshMenu = () => {
    // Clear current day's menu and start with empty state ready for adding items
    setWeeklyMenus(prev => ({
      ...prev,
      [selectedDay]: []
    }));
    console.log(`Created fresh menu for ${selectedDay}`);
  };

  const handleCopyFromDay = () => {
    const sourceItems = weeklyMenus[sourceDay] || [];
    setWeeklyMenus(prev => ({
      ...prev,
      [selectedDay]: [...sourceItems]
    }));
    setIsCopyDialogOpen(false);
    console.log(`Copied ${sourceItems.length} items from ${sourceDay} to ${selectedDay}`);
  };

  const handleAddItem = () => {
    if (categories.length === 0) {
      alert('Please create categories first before adding items to daily menus.');
      return;
    }
    
    const itemName = prompt('Enter item name:');
    if (!itemName || !itemName.trim()) return;
    
    const newItem = {
      id: `temp-${Date.now()}`,
      name: itemName.trim(),
      categoryId: categories[0]?.id || '',
      categoryName: categories[0]?.name || 'Uncategorized'
    };
    
    setWeeklyMenus(prev => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), newItem]
    }));
    
    console.log(`Added item "${itemName}" to ${selectedDay} menu`);
  };

  const handleDeleteItem = (itemId: string) => {
    setWeeklyMenus(prev => ({
      ...prev,
      [selectedDay]: prev[selectedDay].filter(item => item.id !== itemId)
    }));
  };

  const handleSaveMenu = async () => {
    // TODO: Implement API call to save menu
    console.log('Saving menu for', selectedDay, currentDayMenu);
    if (onMenuChange) {
      onMenuChange();
    }
  };

  const handleOpenImportDialog = async () => {
    if (isLoadingCategories) return; // Prevent multiple clicks
    console.log('Opening import dialog...'); // Debug log
    await loadCategoriesWithItems();
    console.log('Categories loaded, setting dialog open'); // Debug log
    setIsImportDialogOpen(true);
  };

  const handleImportCategories = async (categoryIds: string[], selectedDays?: DayOfWeek[]) => {
    try {
      // Use selectedDays if provided, otherwise default to current selectedDay
      const targetDays = selectedDays || [selectedDay];
      
      // For now, just import to the first target day (we can enhance for multi-day later)
      const targetDay = targetDays[0];
      
      const result = await importCategories(targetDay, categoryIds);
      if (result) {
        // Add imported items to target day menu
        setWeeklyMenus(prev => ({
          ...prev,
          [targetDay]: [...(prev[targetDay] || []), ...result.data.importedItems]
        }));

        setIsImportDialogOpen(false);
        console.log(`Imported ${result.data.itemsImported} items from ${result.data.categoriesProcessed} categories to ${targetDay}`);
      }
    } catch (error) {
      console.error('Failed to import categories:', error);
      alert('Failed to import categories. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold tracking-tight">Weekly Menu Management</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Create and manage daily menus for each day of the week
        </p>
      </div>

      {/* Day Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Day</CardTitle>
          <CardDescription>Choose which day's menu to view and edit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="day-select">Day of Week:</Label>
            <Select 
              id="day-select"
              value={selectedDay} 
              onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
              className="w-48"
            >
              {DAYS_OF_WEEK.map((day) => (
                <option key={day} value={day}>
                  {DAY_LABELS[day]} {hasMenus[day] ? `(${weeklyMenus[day]?.length || 0} items)` : ''}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Menu Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{DAY_LABELS[selectedDay]} Menu</CardTitle>
          <CardDescription>
            {currentDayMenu.length === 0 
              ? 'No menu created for this day yet'
              : `${currentDayMenu.length} items in menu`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Always show menu editing interface now */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {currentDayMenu.length === 0 ? `Create Menu for ${DAY_LABELS[selectedDay]}` : `${DAY_LABELS[selectedDay]} Menu (${currentDayMenu.length} items)`}
              </h3>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleOpenImportDialog}
                  disabled={isLoadingCategories}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isLoadingCategories ? 'Loading...' : 'Import Categories'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsCopyDialogOpen(true)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy from Day
                </Button>
                <Button size="sm" onClick={handleSaveMenu}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Menu
                </Button>
              </div>
            </div>

            {currentDayMenu.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-muted-foreground mb-4">No items in this menu yet</p>
                <Button onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Item
                </Button>
              </div>
            ) : (
              /* Items List */
              <div className="space-y-2">
                {currentDayMenu.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.categoryName}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Copy Menu Dialog */}
      <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy Menu from Another Day</DialogTitle>
            <DialogDescription>
              Select which day's menu to copy to {DAY_LABELS[selectedDay]}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="source-day">Copy from:</Label>
            <Select 
              id="source-day"
              value={sourceDay} 
              onChange={(e) => setSourceDay(e.target.value as DayOfWeek)}
              className="w-full mt-2"
            >
              {DAYS_OF_WEEK.filter(day => day !== selectedDay).map((day) => (
                <option key={day} value={day}>
                  {DAY_LABELS[day]} {hasMenus[day] ? `(${weeklyMenus[day]?.length || 0} items)` : '(Empty)'}
                </option>
              ))}
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCopyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCopyFromDay} disabled={!hasMenus[sourceDay]}>
              Copy Menu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Import Dialog */}
      <CategoryImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        categories={categoriesWithItems}
        onImport={handleImportCategories}
        isImporting={isImporting}
        selectedDay={selectedDay}
      />
    </div>
  );
}
