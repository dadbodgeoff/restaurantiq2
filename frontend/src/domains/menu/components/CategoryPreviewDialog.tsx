import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { CheckCircle2, Clock, Package } from 'lucide-react';
import { CategoryPreviewDialogProps } from '../types';

export function CategoryPreviewDialog({
  open,
  onOpenChange,
  categories,
  selectedCategoryIds,
  onProceedToImport
}: CategoryPreviewDialogProps) {
  const selectedCategories = categories.filter(cat =>
    selectedCategoryIds.includes(cat.id)
  );

  const totalItems = selectedCategories.reduce((sum, cat) => sum + cat.itemCount, 0);
  const avgPrepTime = selectedCategories.length > 0
    ? selectedCategories
        .flatMap(cat => cat.items)
        .reduce((sum, item) => sum + item.prepTimeMinutes, 0) / totalItems
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Import Preview
          </DialogTitle>
          <DialogDescription>
            Review {selectedCategories.length} categories with {totalItems} items before importing
          </DialogDescription>
        </DialogHeader>

        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{selectedCategories.length}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalItems}</div>
            <div className="text-sm text-muted-foreground">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{Math.round(avgPrepTime)}min</div>
            <div className="text-sm text-muted-foreground">Avg Prep Time</div>
          </div>
        </div>

        {/* Detailed Category Breakdown */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {selectedCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No categories selected for preview
            </div>
          ) : (
            selectedCategories.map(category => (
              <Card key={category.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <Badge variant="outline">{category.itemCount} items</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {category.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-48">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.prepTimeMinutes}min
                          </div>
                          <Badge
                            variant={item.isAvailable ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {item.isAvailable ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Back to Selection
          </Button>
          <Button onClick={onProceedToImport}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Import {totalItems} Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
