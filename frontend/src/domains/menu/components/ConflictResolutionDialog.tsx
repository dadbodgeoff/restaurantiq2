import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/RadioGroup';
import { AlertTriangle } from 'lucide-react';
import { ConflictResolutionDialogProps, ConflictResolution, ConflictAction } from '../types';

export function ConflictResolutionDialog({
  open,
  onOpenChange,
  conflicts,
  onResolve
}: ConflictResolutionDialogProps) {
  const [resolutions, setResolutions] = useState<Record<string, ConflictResolution>>({});

  const handleResolutionChange = (conflictId: string, action: ConflictAction, newName?: string) => {
    setResolutions(prev => ({
      ...prev,
      [conflictId]: { conflictId, action, newName }
    }));
  };

  const handleResolve = () => {
    const resolutionArray = Object.values(resolutions);
    onResolve(resolutionArray);
  };

  const canResolve = conflicts.every(conflict => resolutions[conflict.itemId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Resolve Import Conflicts
          </DialogTitle>
          <DialogDescription>
            {conflicts.length} items have naming conflicts with existing menu items
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {conflicts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No conflicts to resolve
            </div>
          ) : (
            conflicts.map(conflict => (
              <Card key={conflict.itemId} className="border-orange-200">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-orange-800">{conflict.itemName}</h4>
                      <p className="text-sm text-muted-foreground">from {conflict.categoryName}</p>
                      {conflict.existingItem && (
                        <p className="text-xs text-muted-foreground">
                          Conflicts with: {conflict.existingItem.name} ({conflict.existingItem.categoryName})
                        </p>
                      )}
                    </div>
                    <Badge variant="destructive">Conflict</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Label>Choose resolution:</Label>
                    <RadioGroup
                      value={resolutions[conflict.itemId]?.action || ''}
                      onValueChange={(action) => handleResolutionChange(conflict.itemId, action as ConflictAction)}
                    >
                      <RadioGroupItem value="SKIP" id={`skip-${conflict.itemId}`}>
                        Skip this item
                      </RadioGroupItem>
                      <RadioGroupItem value="REPLACE" id={`replace-${conflict.itemId}`}>
                        Replace existing item
                      </RadioGroupItem>
                      <RadioGroupItem value="RENAME" id={`rename-${conflict.itemId}`}>
                        Rename and import
                      </RadioGroupItem>
                    </RadioGroup>

                    {resolutions[conflict.itemId]?.action === 'RENAME' && (
                      <div className="mt-2">
                        <Label htmlFor={`rename-input-${conflict.itemId}`}>New name:</Label>
                        <Input
                          id={`rename-input-${conflict.itemId}`}
                          placeholder="Enter new name"
                          value={resolutions[conflict.itemId]?.newName || ''}
                          onChange={(e) => handleResolutionChange(conflict.itemId, 'RENAME', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel Import
          </Button>
          <Button
            onClick={handleResolve}
            disabled={!canResolve}
          >
            Resolve and Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
