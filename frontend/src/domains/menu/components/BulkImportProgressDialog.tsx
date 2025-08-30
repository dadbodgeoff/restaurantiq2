import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Progress } from '../../../components/ui/Progress';
import { Badge } from '../../../components/ui/Badge';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { BulkImportProgressDialogProps, DAY_LABELS } from '../types';

export function BulkImportProgressDialog({
  open,
  onOpenChange,
  importOperations,
  onComplete
}: BulkImportProgressDialogProps) {
  const overallProgress = importOperations.length > 0
    ? (importOperations.filter(op => op.status === 'SUCCESS').length / importOperations.length) * 100
    : 0;

  const successCount = importOperations.filter(op => op.status === 'SUCCESS').length;
  const errorCount = importOperations.filter(op => op.status === 'ERROR').length;
  const processingCount = importOperations.filter(op => op.status === 'PROCESSING').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'PROCESSING':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'default';
      case 'ERROR':
        return 'destructive';
      case 'PROCESSING':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const totalItemsImported = importOperations
    .filter(op => op.status === 'SUCCESS')
    .reduce((sum, op) => sum + (op.importedCount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Import Progress</DialogTitle>
          <DialogDescription>
            Importing categories to {importOperations.length} days
          </DialogDescription>
        </DialogHeader>

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="w-full" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{successCount} completed</span>
            <span>{processingCount} processing</span>
            <span>{errorCount} errors</span>
            <span>{totalItemsImported} items imported</span>
          </div>
        </div>

        {/* Individual Day Progress */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {importOperations.map(operation => (
            <div key={operation.dayOfWeek} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(operation.status)}
                <div>
                  <div className="font-medium">{DAY_LABELS[operation.dayOfWeek]}</div>
                  <div className="text-sm text-muted-foreground">
                    {operation.categoryIds.length} categories
                    {operation.importedCount && ` • ${operation.importedCount} items`}
                  </div>
                  {operation.error && (
                    <div className="text-xs text-red-600 mt-1">{operation.error}</div>
                  )}
                </div>
              </div>
              <Badge variant={getStatusBadgeVariant(operation.status)}>
                {operation.status}
              </Badge>
            </div>
          ))}
        </div>

        <DialogFooter>
          {overallProgress < 100 && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {processingCount > 0 ? 'Importing...' : 'Cancel'}
            </Button>
          )}
          {overallProgress === 100 && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={onComplete}>
                View Results
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
