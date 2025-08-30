// frontend/src/domains/menu/components/CategorySelect.tsx
// Category Select Component - RestaurantIQ Prep Workflow Focus

'use client';

import React from 'react';
import { MenuCategory } from '../types';
import { Select } from '../../../components/ui/Select';
import { Label } from '../../../components/ui/Label';

export interface CategorySelectProps {
  readonly value: string;
  readonly onChange: (categoryId: string) => void;
  readonly categories: MenuCategory[];
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly className?: string;
}

export function CategorySelect({
  value,
  onChange,
  categories,
  placeholder = "Select a category",
  required = false,
  disabled = false,
  label,
  className = ''
}: CategorySelectProps) {
  // Filter to only show active categories
  const activeCategories = categories.filter(category => category.isActive);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor="category-select" className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Select
        id="category-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
      >
        <option value="">{placeholder}</option>
        {activeCategories
          .toSorted((a, b) => a.displayOrder - b.displayOrder) // Sort by display order
          .map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
      </Select>
    </div>
  );
}
