// frontend/src/components/ui/Progress.tsx
// Progress bar component following existing UI patterns

'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function Progress({
  value,
  max = 100,
  variant = 'default',
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variantClasses = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  };

  return (
    <div
      className={cn(
        'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'h-full w-full flex-1 transition-all duration-300 ease-in-out',
          variantClasses[variant]
        )}
        style={{
          transform: `translateX(-${100 - percentage}%)`,
        }}
      />
    </div>
  );
}
