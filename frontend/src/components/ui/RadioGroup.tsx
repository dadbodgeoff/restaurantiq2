// frontend/src/components/ui/RadioGroup.tsx
// Radio group component following existing UI patterns

'use client';

import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';

interface RadioGroupContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextType | undefined>(undefined);

interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function RadioGroup({ value, onValueChange, children, className }: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className={cn('space-y-2', className)}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

interface RadioGroupItemProps {
  value: string;
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function RadioGroupItem({ value, id, children, className }: RadioGroupItemProps) {
  const context = useContext(RadioGroupContext);
  if (!context) {
    throw new Error('RadioGroupItem must be used within RadioGroup');
  }

  const { value: selectedValue, onValueChange } = context;
  const isSelected = selectedValue === value;

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <button
        type="button"
        id={id}
        onClick={() => onValueChange(value)}
        className={cn(
          'w-4 h-4 rounded-full border-2 transition-colors',
          isSelected
            ? 'bg-blue-600 border-blue-600'
            : 'border-gray-300 hover:border-gray-400'
        )}
      >
        {isSelected && (
          <div className="w-2 h-2 bg-white rounded-full mx-auto" />
        )}
      </button>
      <label htmlFor={id} className="text-sm font-medium cursor-pointer">
        {children}
      </label>
    </div>
  );
}
