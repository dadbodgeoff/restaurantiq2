// frontend/src/components/ui/Label.tsx
// Label component following existing UI patterns

'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface LabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export function Label({ htmlFor, children, className }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
    >
      {children}
    </label>
  );
}
