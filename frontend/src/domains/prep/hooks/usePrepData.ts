// frontend/src/domains/prep/hooks/usePrepData.ts
// Prep Data Hook - Following RestaurantIQ patterns

'use client';

import { useState, useEffect, useCallback } from 'react';
import { PrepApiService } from '../services/prep.api.service';
import {
  PrepState,
  PrepFilters,
  UpdatePrepItemRequest,
  PrepSyncResponse
} from '../types';

interface UsePrepDataOptions {
  restaurantId: string;
  initialDate?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function usePrepData({
  restaurantId,
  initialDate,
  autoRefresh = false,
  refreshInterval = 30000 // 30 seconds
}: UsePrepDataOptions) {
  const [state, setState] = useState<PrepState>({
    items: [],
    loading: false,
    error: null,
    currentDate: initialDate || new Date().toISOString().split('T')[0],
    filters: {}
  });

  const prepApiService = new PrepApiService();

  // Load prep items for current date
  const loadPrepItems = useCallback(async (date?: string) => {
    const targetDate = date || state.currentDate;
    
    // Safety check: Don't make API calls without restaurant ID
    if (!restaurantId) {
      console.warn('⚠️ Cannot load prep items: missing restaurant ID');
      setState(prev => ({ ...prev, loading: false, error: 'Restaurant ID not available' }));
      return;
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const items = await prepApiService.getPrepItems(restaurantId, targetDate);
      
      // Calculate amount to prep for all items
      const itemsWithCalculations = prepApiService.calculateAmountToPrep(items);
      
      setState(prev => ({
        ...prev,
        items: itemsWithCalculations,
        loading: false,
        currentDate: targetDate
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load prep items'
      }));
    }
  }, [restaurantId, state.currentDate, prepApiService]);

  // Update a prep item
  const updatePrepItem = useCallback(async (
    itemId: string,
    updates: UpdatePrepItemRequest
  ) => {
    // Safety check: Don't make API calls without restaurant ID
    if (!restaurantId) {
      console.warn('⚠️ Cannot update prep item: missing restaurant ID');
      setState(prev => ({ ...prev, error: 'Restaurant ID not available' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const updatedItem = await prepApiService.updatePrepItem(
        restaurantId,
        itemId,
        updates
      );
      
      setState(prev => {
        const updatedItems = prev.items.map(item =>
          item.id === itemId 
            ? { 
                ...updatedItem, // Now includes full menuItem relation from backend
                amountToPrep: Math.max(0, updatedItem.par - updatedItem.onHand)
              }
            : item
        );
        
        return {
          ...prev,
          items: updatedItems,
          loading: false
        };
      });
      
      return updatedItem;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to update prep item'
      }));
      throw error;
    }
  }, [restaurantId, prepApiService]);

  // Sync prep items from menu
  const syncFromMenu = useCallback(async (): Promise<PrepSyncResponse> => {
    // Safety check: Don't make API calls without restaurant ID
    if (!restaurantId) {
      console.warn('⚠️ Cannot sync from menu: missing restaurant ID');
      setState(prev => ({ ...prev, error: 'Restaurant ID not available' }));
      throw new Error('Restaurant ID not available');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const syncResult = await prepApiService.syncFromMenu(restaurantId, state.currentDate);
      
      setState(prev => ({
        ...prev,
        lastSyncAt: new Date().toISOString()
      }));
      
      // Reload prep items after sync
      await loadPrepItems();
      
      return syncResult;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to sync prep items'
      }));
      throw error;
    }
  }, [restaurantId, state.currentDate, prepApiService, loadPrepItems]);

  // Change date
  const changeDate = useCallback(async (newDate: string) => {
    await loadPrepItems(newDate);
  }, [loadPrepItems]);

  // Apply filters
  const applyFilters = useCallback((filters: PrepFilters) => {
    setState(prev => ({ ...prev, filters }));
  }, []);

  // Get filtered items
  const filteredItems = (state.items || []).filter(item => {
    const { search, categoryId, hasNotes, needsPrep } = state.filters;
    
    if (search && !item.menuItem?.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    if (categoryId && item.menuItem?.categoryId !== categoryId) {
      return false;
    }
    
    if (hasNotes !== undefined && (!!item.notes) !== hasNotes) {
      return false;
    }
    
    if (needsPrep && item.amountToPrep <= 0) {
      return false;
    }
    
    return true;
  });

  // Get prep summary
  const summary = prepApiService.getPrepSummary(filteredItems);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        loadPrepItems();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, loadPrepItems]);

  // Initial load
  useEffect(() => {
    loadPrepItems();
  }, []);

  // No auto-loading - keep it simple

  // Save current prep items as preset
  const saveAsPreset = useCallback(async (dayOfWeek: string, itemsToSave?: any[]) => {
    if (!restaurantId) {
      console.warn('⚠️ Cannot save preset: missing restaurant ID');
      setState(prev => ({ ...prev, error: 'Restaurant ID not available' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const items = itemsToSave || state.items;
      await prepApiService.savePreset(restaurantId, dayOfWeek, items);
      setState(prev => ({ ...prev, loading: false }));
      console.log(`✅ Saved preset for ${dayOfWeek}`);
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to save preset'
      }));
      throw error;
    }
  }, [restaurantId, state.items, prepApiService]);

  // Load preset and apply to current date
  const loadPreset = useCallback(async (dayOfWeek: string) => {
    if (!restaurantId) {
      console.warn('⚠️ Cannot load preset: missing restaurant ID');
      setState(prev => ({ ...prev, error: 'Restaurant ID not available' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const presets = await prepApiService.loadPreset(restaurantId, dayOfWeek);
      
      if (presets.length === 0) {
        setState(prev => ({ ...prev, loading: false }));
        console.log(`No presets found for ${dayOfWeek}`);
        return;
      }

      let appliedCount = 0;
      let skippedCount = 0;

      // Apply presets to current date by updating existing prep items
      for (const preset of presets) {
        try {
          // Check if prep item exists for current date
          const existingItem = state.items.find(item => item.menuItemId === preset.menuItemId);
          
          if (existingItem) {
            // Update existing item with preset PAR value (keep current onHand)
            await prepApiService.updatePrepItem(restaurantId, existingItem.id, { 
              par: preset.presetPar 
            });
            appliedCount++;
          } else {
            // Item not synced for this date
            console.log(`Skipping ${preset.menuItem.name} - not synced for this date`);
            skippedCount++;
          }
        } catch (error) {
          console.error(`Failed to apply preset for ${preset.menuItem.name}:`, error);
          skippedCount++;
        }
      }

      // Reload prep items to get updated data
      await loadPrepItems();
      
      // Show detailed result
      const resultMessage = `Applied ${appliedCount} preset values${skippedCount > 0 ? `, skipped ${skippedCount} items (not synced for this date)` : ''}`;
      console.log(resultMessage);
      
      console.log(`✅ Applied preset for ${dayOfWeek}`);
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load preset'
      }));
      throw error;
    }
  }, [restaurantId, state.currentDate, state.items, prepApiService, loadPrepItems]);

  // Finalize prep list - save final values to database
  const finalizePrepList = useCallback(async (finalItems?: any[]) => {
    if (!restaurantId) {
      console.warn('⚠️ Cannot finalize prep list: missing restaurant ID');
      setState(prev => ({ ...prev, error: 'Restaurant ID not available' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const items = finalItems || state.items;
      const result = await prepApiService.finalizePrepList(restaurantId, state.currentDate, items);
      setState(prev => ({ ...prev, loading: false }));
      console.log(`✅ Finalized prep list for ${state.currentDate}`);
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to finalize prep list'
      }));
      throw error;
    }
  }, [restaurantId, state.currentDate, state.items, prepApiService]);

  return {
    // State
    items: filteredItems,
    allItems: state.items,
    loading: state.loading,
    error: state.error,
    currentDate: state.currentDate,
    filters: state.filters,
    lastSyncAt: state.lastSyncAt,
    summary,
    
    // Actions
    loadPrepItems,
    updatePrepItem,
    syncFromMenu,
    changeDate,
    applyFilters,
    saveAsPreset,
    loadPreset,
    finalizePrepList,
    
    // Helpers
    clearError: () => setState(prev => ({ ...prev, error: null }))
  };
}
