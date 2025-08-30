import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Switch } from '../../../components/ui/Switch';
import { Select } from '../../../components/ui/Select';
import { Package, Users, CheckCircle2, Eye } from 'lucide-react';
import { CategoryImportDialogProps, ConflictDetectionResponse, ConflictResolution, DayOfWeek, DAYS_OF_WEEK, DAY_LABELS } from '../types';
import { CategoryPreviewDialog } from './CategoryPreviewDialog';
import { ConflictResolutionDialog } from './ConflictResolutionDialog';

export function CategoryImportDialog({
  open,
  onOpenChange,
  categories,
  onImport,
  isImporting,
  selectedDay,
  enableMultiDay = false
}: Readonly<CategoryImportDialogProps>) {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [conflictData, setConflictData] = useState<ConflictDetectionResponse | null>(null);
  const [showConflictResolution, setShowConflictResolution] = useState(false);
  const [isDetectingConflicts, setIsDetectingConflicts] = useState(false);

  // Multi-day selection state
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(
    selectedDay ? [selectedDay] : ['MONDAY']
  );
  const [isMultiDayMode, setIsMultiDayMode] = useState(false);

  // Reset dialog state when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      // Reset all state when dialog closes
      setSelectedCategoryIds([]);
      setShowPreview(false);
      setConflictData(null);
      setShowConflictResolution(false);
      setIsDetectingConflicts(false);
      setIsMultiDayMode(false);
      setSelectedDays(selectedDay ? [selectedDay] : ['MONDAY']);
    }
  }, [open, selectedDay]);

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    setSelectedCategoryIds(prev =>
      checked
        ? [...prev, categoryId]
        : prev.filter(id => id !== categoryId)
    );
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCategoryIds(categories.map(cat => cat.id));
  };

  const handleSelectNone = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCategoryIds([]);
  };

  const handleShowPreview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedCategoryIds.length === 0) return;
    setShowPreview(true);
  };

  const detectConflicts = async () => {
    setIsDetectingConflicts(true);
    try {
      // In a real implementation, this would call the backend API
      // For now, we'll simulate no conflicts
      const mockConflictData: ConflictDetectionResponse = {
        hasConflicts: false,
        conflicts: [],
        safeItems: [],
        summary: {
          totalItems: totalItemsToImport,
          conflictCount: 0,
          safeCount: totalItemsToImport
        }
      };

      setConflictData(mockConflictData);

      if (mockConflictData.hasConflicts) {
        setShowConflictResolution(true);
      } else {
        // No conflicts, proceed directly
        await proceedWithImport([]);
      }
    } catch (error) {
      console.error('Failed to detect conflicts:', error);
    } finally {
      setIsDetectingConflicts(false);
    }
  };

  const handleProceedToImport = async () => {
    setShowPreview(false);
    await detectConflicts();
  };

  const proceedWithImport = async (conflictResolutions: ConflictResolution[]) => {
    try {
      // In a real implementation, we'd process the resolved conflicts
      // const allItemsToImport = [...(conflictData?.safeItems || []), ...processedConflicts];

      const importResult = onImport(selectedCategoryIds, selectedDays);
      // Handle both Promise and non-Promise returns
      if (importResult && typeof importResult === 'object' && 'then' in importResult) {
        await importResult;
      }
      
      // Only reset and close dialog if import was successful
      setSelectedCategoryIds([]);
      setConflictData(null);
      setShowConflictResolution(false);
      setShowPreview(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Import failed:', error);
      // Don't close dialog on error, let user retry
    }
  };

  const handleConflictResolution = async (resolutions: ConflictResolution[]) => {
    await proceedWithImport(resolutions);
  };

  const totalItemsToImport = categories
    .filter(cat => selectedCategoryIds.includes(cat.id))
    .reduce((sum, cat) => sum + cat.itemCount, 0);

  console.log('CategoryImportDialog render:', { open, categoriesLength: categories.length }); // Debug log
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        aria-labelledby="import-dialog-title"
        aria-describedby="import-dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="import-dialog-title" className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Import Categories & Items
          </DialogTitle>
          <DialogDescription id="import-dialog-description">
            Select categories to import all their menu items into the daily menu.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center py-2 border-b">
          <div className="text-sm text-muted-foreground">
            {selectedCategoryIds.length} categories selected • {totalItemsToImport} items to import
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSelectNone}>
              Select None
            </Button>
          </div>
        </div>

        {/* Multi-day selection */}
        {enableMultiDay && (
          <div className="space-y-3 p-4 border-b">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Import to Days:</span>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isMultiDayMode}
                  onCheckedChange={setIsMultiDayMode}
                />
                <span className="text-sm text-muted-foreground">Multiple Days</span>
              </div>
            </div>

            {isMultiDayMode ? (
              <div className="grid grid-cols-4 gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="flex items-center space-x-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(day)}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedDays(prev =>
                            e.target.checked
                              ? [...prev, day]
                              : prev.filter(d => d !== day)
                          );
                        }}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedDays.includes(day)
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}>
                        {selectedDays.includes(day) && (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                      </div>
                    </label>
                    <span className="text-sm">{DAY_LABELS[day]}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Select
                value={selectedDays[0] || 'MONDAY'}
                onChange={(e) => setSelectedDays([e.target.value as DayOfWeek])}
              >
                {DAYS_OF_WEEK.map(day => (
                  <option key={day} value={day}>{DAY_LABELS[day]}</option>
                ))}
              </Select>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 py-2">
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No categories available to import
            </div>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
              >
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(category.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleCategoryToggle(category.id, e.target.checked);
                    }}
                    className="sr-only"
                    aria-describedby={`category-${category.id}-info`}
                    aria-label={`Select ${category.name} category for import`}
                  />
                  <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${
                    selectedCategoryIds.includes(category.id)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}>
                    {selectedCategoryIds.includes(category.id) && (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                  </div>
                </label>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category.name}</span>
                    <div 
                      id={`category-${category.id}-info`}
                      className="flex items-center gap-1 text-sm text-muted-foreground"
                    >
                      <Users className="h-3 w-3" />
                      {category.itemCount} items
                    </div>
                  </div>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShowPreview}
            disabled={selectedCategoryIds.length === 0 || isImporting || isDetectingConflicts}
          >
            {isImporting || isDetectingConflicts ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 mr-2 border-b-2 border-current"></div>
                {isImporting ? 'Importing...' : 'Processing...'}
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Preview Import ({selectedCategoryIds.length} categories)
              </>
            )}
          </Button>
        </DialogFooter>

        {/* CategoryPreviewDialog */}
        <CategoryPreviewDialog
          open={showPreview}
          onOpenChange={setShowPreview}
          categories={categories}
          selectedCategoryIds={selectedCategoryIds}
          onProceedToImport={handleProceedToImport}
        />

        {/* ConflictResolutionDialog */}
        <ConflictResolutionDialog
          open={showConflictResolution}
          onOpenChange={setShowConflictResolution}
          conflicts={conflictData?.conflicts || []}
          onResolve={handleConflictResolution}
        />
      </DialogContent>
    </Dialog>
  );
}
