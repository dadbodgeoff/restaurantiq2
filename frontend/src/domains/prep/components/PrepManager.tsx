// frontend/src/domains/prep/components/PrepManager.tsx
// Main Prep Manager Component - 3-Tab CRUD Interface

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  RefreshCw, 
  Calendar, 
  Search, 
  Filter,
  TrendingUp,
  Package,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { usePrepData } from '../hooks/usePrepData';
import { PrepTab, PrepItem, UpdatePrepItemRequest } from '../types';

const PREP_TABS = [
  {
    id: 'par' as PrepTab,
    label: 'Par Levels',
    description: 'Set required amounts for next business day',
    editable: true,
    field: 'par' as keyof PrepItem,
    icon: TrendingUp
  },
  {
    id: 'onHand' as PrepTab,
    label: 'On Hand',
    description: 'Current inventory available for next business day',
    editable: true,
    field: 'onHand' as keyof PrepItem,
    icon: Package
  },
  {
    id: 'amountToPrep' as PrepTab,
    label: 'Amount to Prep',
    description: 'Calculated prep requirements (Par - On Hand)',
    editable: false,
    field: 'amountToPrep' as keyof PrepItem,
    icon: CheckCircle2
  }
];

export function PrepManager() {
  const { user } = useAuth();
  const restaurantId = user?.restaurantId;

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS - ENTERPRISE PATTERN
  
  // 1. ALL useState FIRST
  const [activeTab, setActiveTab] = useState<PrepTab>('par');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedPresetDay, setSelectedPresetDay] = useState<string>('');
  const [previewPresets, setPreviewPresets] = useState<any[]>([]);
  const [localChanges, setLocalChanges] = useState<Record<string, Partial<PrepItem>>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 2. CUSTOM HOOKS
  const {
    items,
    loading,
    error,
    summary,
    lastSyncAt,
    updatePrepItem,
    syncFromMenu,
    changeDate,
    applyFilters,
    clearError,
    saveAsPreset,
    loadPreset,
    finalizePrepList
  } = usePrepData({
    restaurantId: restaurantId || '',
    initialDate: selectedDate
  });

  // 3. useEffect - Clear local changes when date changes
  useEffect(() => {
    setLocalChanges({});
    setHasUnsavedChanges(false);
  }, [selectedDate]);

  // 4. CONDITIONAL RENDERING AFTER ALL HOOKS
  if (!restaurantId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading prep manager...</p>
        </div>
      </div>
    );
  }

  // 5. CONSTANTS AND REGULAR FUNCTIONS AFTER HOOKS
  const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    changeDate(newDate);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters({ search: term });
  };

  const handleDaySelection = async (day: string) => {
    setSelectedPresetDay(day);
    
    if (day) {
      try {
        // Load preview data for selected day
        const presets = await loadPreset(day);
        setPreviewPresets(presets);
        console.log(`📋 Loaded ${presets.length} presets for ${day} preview`);
      } catch (error) {
        console.error('Failed to load preset preview:', error);
        setPreviewPresets([]);
      }
    } else {
      setPreviewPresets([]);
    }
  };

  const handleUpdateItem = (itemId: string, field: string, value: number) => {
    // Update local state immediately (no API call)
    setLocalChanges(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  // Manual save function
  const handleSaveChanges = async () => {
    try {
      const promises = Object.entries(localChanges).map(([itemId, changes]) =>
        updatePrepItem(itemId, changes as any)
      );
      
      await Promise.all(promises);
      
      // Clear local changes after successful save
      setLocalChanges({});
      setHasUnsavedChanges(false);
      alert('✅ All changes saved successfully!');
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert('❌ Failed to save some changes. Please try again.');
    }
  };

  // Get display value (local change or original value)
  const getDisplayValue = (item: PrepItem, field: string): number => {
    return localChanges[item.id]?.[field] ?? item[field];
  };

  const handleSync = async () => {
    try {
      const result = await syncFromMenu();
      console.log('Sync completed:', result);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const handleSavePreset = async () => {
    if (!selectedPresetDay) return;
    
    // Include local changes in the preset save
    const itemsToSave = items.map(item => ({
      ...item,
      par: getDisplayValue(item, 'par'),
      onHand: getDisplayValue(item, 'onHand')
    }));
    
    const confirmed = confirm(
      `Save current PAR values as ${selectedPresetDay} defaults?\n\nThis will save ${itemsToSave.length} items as the default prep list for ${selectedPresetDay}.`
    );
    
    if (!confirmed) return;
    
    try {
      await saveAsPreset(selectedPresetDay, itemsToSave);
      alert(`✅ Saved ${itemsToSave.length} items as ${selectedPresetDay} defaults`);
    } catch (error) {
      console.error('Save preset failed:', error);
      alert(`❌ Failed to save preset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImportPreset = async () => {
    if (!selectedPresetDay) return;
    
    const confirmed = confirm(
      `Import ${selectedPresetDay} prep list?\n\nThis will fill today's PAR levels with the saved ${selectedPresetDay} defaults.`
    );
    
    if (!confirmed) return;
    
    try {
      await loadPreset(selectedPresetDay);
      alert(`✅ Imported ${selectedPresetDay} prep list - PAR levels updated`);
    } catch (error) {
      console.error('Import preset failed:', error);
      alert(`❌ Failed to import preset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };



  const handleFinalizePrepList = async () => {
    // Include all current values (local changes + original values)
    const finalItems = items.map(item => ({
      ...item,
      par: getDisplayValue(item, 'par'),
      onHand: getDisplayValue(item, 'onHand'),
      amountToPrep: Math.max(0, getDisplayValue(item, 'par') - getDisplayValue(item, 'onHand'))
    }));
    
    const confirmed = confirm(
      `Finalize prep list for ${selectedDate}?\n\nThis will save the complete prep list to the database so other users can view it during prep.\n\n${finalItems.length} items will be saved.`
    );
    
    if (!confirmed) return;
    
    try {
      const result = await finalizePrepList(finalItems);
      // Clear local changes since everything is now saved
      setLocalChanges({});
      setHasUnsavedChanges(false);
      alert(`✅ Prep list finalized!\n\n${result.message}`);
    } catch (error) {
      console.error('Finalize failed:', error);
      alert(`❌ Failed to finalize prep list: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!restaurantId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Restaurant not found. Please log in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prep Management</h1>
          <p className="text-sm text-gray-600">
            Manage daily prep requirements and inventory
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Day Preset Selector */}
          <div className="flex items-center gap-2">
            <select 
              value={selectedPresetDay} 
              onChange={(e) => handleDaySelection(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="">Select Day</option>
              {DAYS.map(day => (
                <option key={day} value={day}>
                  {day.charAt(0) + day.slice(1).toLowerCase()}
                </option>
              ))}
            </select>

            {/* Simple Save and Import Buttons */}
            {selectedPresetDay && (
              <>
                <Button 
                  onClick={handleSavePreset}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  💾 Save {selectedPresetDay.charAt(0) + selectedPresetDay.slice(1).toLowerCase()} Defaults
                </Button>
                
                <Button 
                  onClick={handleImportPreset}
                  disabled={loading}
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  📥 Import {selectedPresetDay.charAt(0) + selectedPresetDay.slice(1).toLowerCase()} Prep List
                </Button>
              </>
            )}
          </div>

          {/* Preview Preset Data */}
          {selectedPresetDay && previewPresets.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                {selectedPresetDay} Default PAR Levels:
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {previewPresets.map((preset, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-blue-700">{preset.menuItem?.name || 'Unknown Item'}</span>
                    <span className="font-medium text-blue-900">PAR: {preset.presetPar}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-40"
            />
          </div>
          
          {/* Save Button */}
          {hasUnsavedChanges && (
            <Button
              onClick={handleSaveChanges}
              disabled={loading}
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              💾 Save Changes ({Object.keys(localChanges).length})
            </Button>
          )}

          {/* Finalize Prep List Button */}
          <Button
            onClick={handleFinalizePrepList}
            disabled={loading || items.length === 0}
            variant="default"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            📋 Finalize Prep List
          </Button>

          {/* Sync Button */}
          <Button
            onClick={handleSync}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync from Menu
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalItems}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Need Prep</p>
              <p className="text-2xl font-bold text-orange-600">{summary.itemsNeedingPrep}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total to Prep</p>
              <p className="text-2xl font-bold text-green-600">{summary.totalAmountToPrep.toFixed(1)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Complete</p>
              <p className="text-2xl font-bold text-blue-600">{summary.percentComplete.toFixed(0)}%</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Main Content - 3 Tabs */}
      <div className="bg-white rounded-lg border">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PrepTab)}>
          <TabsList className="grid w-full grid-cols-3">
            {PREP_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {PREP_TABS.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-0">
              <div className="p-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{tab.label}</h3>
                    <p className="text-sm text-gray-600">{tab.description}</p>
                  </div>
                  
                  {tab.editable && (
                    <Badge variant="secondary">Editable</Badge>
                  )}
                  {!tab.editable && (
                    <Badge variant="outline">Read Only</Badge>
                  )}
                </div>

                {/* Prep Items Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Menu Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {tab.label}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                              <span className="ml-2 text-gray-600">Loading prep items...</span>
                            </div>
                          </td>
                        </tr>
                      ) : items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No prep items found</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Try syncing from menu to create prep items
                            </p>
                          </td>
                        </tr>
                      ) : (
                        (items || []).map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {item.menuItem?.name || 'Unknown Item'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {item.menuItem?.category?.name || 'Uncategorized'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {tab.editable ? (
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={getDisplayValue(item, tab.field)}
                                  onChange={(e) => 
                                    handleUpdateItem(item.id, tab.field, parseFloat(e.target.value) || 0)
                                  }
                                  className="w-20"
                                />
                              ) : (
                                <span className={
                                  tab.id === 'amountToPrep' && 
                                  (getDisplayValue(item, 'par') - getDisplayValue(item, 'onHand')) > 0
                                    ? 'text-sm font-medium text-orange-600' 
                                    : 'text-sm font-medium text-green-600'
                                }>
                                  {tab.id === 'amountToPrep' 
                                    ? Math.max(0, getDisplayValue(item, 'par') - getDisplayValue(item, 'onHand')).toFixed(1)
                                    : getDisplayValue(item, tab.field).toFixed(1)
                                  }
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {item.unit || 'each'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {item.notes || '-'}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Footer Info */}
      {lastSyncAt && (
        <div className="text-center text-sm text-gray-500">
          Last synced: {new Date(lastSyncAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}
