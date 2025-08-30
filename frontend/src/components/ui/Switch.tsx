// frontend/src/components/ui/Switch.tsx
// Switch component following existing UI patterns

'use client';

import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  id?: string;
}

export function Switch({ checked = false, onCheckedChange, className, id }: SwitchProps) {
  const [internalChecked, setInternalChecked] = useState(checked);

  const isChecked = onCheckedChange ? checked : internalChecked;

  const handleClick = () => {
    const newChecked = !isChecked;
    if (onCheckedChange) {
      onCheckedChange(newChecked);
    } else {
      setInternalChecked(newChecked);
    }
  };

  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={isChecked}
      onClick={handleClick}
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
        isChecked ? 'bg-primary' : 'bg-input',
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform',
          isChecked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}
