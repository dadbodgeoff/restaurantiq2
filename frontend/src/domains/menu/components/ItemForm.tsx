// frontend/src/domains/menu/components/ItemForm.tsx
// Item Form Component - RestaurantIQ Prep Workflow Focus

'use client';

import React, { useState } from 'react';
import { MenuCategory, CreateMenuItemRequest, MenuItemFormData } from '../types';
import { CategorySelect } from './CategorySelect';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Textarea } from '../../../components/ui/Textarea';
import { Switch } from '../../../components/ui/Switch';

export interface ItemFormProps {
  readonly categories: MenuCategory[];
  readonly onSubmit: (data: CreateMenuItemRequest) => void;
  readonly onCancel: () => void;
  readonly isLoading?: boolean;
  readonly initialData?: Partial<MenuItemFormData>;
  readonly mode?: 'create' | 'edit';
}

export function ItemForm({
  categories,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
  mode = 'create'
}: ItemFormProps) {
  const [formData, setFormData] = useState<MenuItemFormData>({
    name: initialData?.name || '',
    categoryId: initialData?.categoryId || '',
  });

  const [errors, setErrors] = useState<Partial<MenuItemFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<MenuItemFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }



    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData: CreateMenuItemRequest = {
      name: formData.name.trim(),
      categoryId: formData.categoryId,
    };

    console.log('Submitting item data:', submitData);
    onSubmit(submitData);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      categoryId: '',
    });
    setErrors({});
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  let submitButtonText: string;
  if (isLoading) {
    submitButtonText = 'Saving...';
  } else if (mode === 'create') {
    submitButtonText = 'Create Item';
  } else {
    submitButtonText = 'Update Item';
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Name *
        </Label>
        <div className="col-span-3">
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={errors.name ? 'border-red-500' : ''}
            placeholder="e.g., Caesar Salad, Grilled Salmon"
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right pt-2">
          Category *
        </Label>
        <div className="col-span-3">
          <CategorySelect
            value={formData.categoryId}
            onChange={(categoryId) => setFormData({ ...formData, categoryId })}
            categories={categories}
            placeholder="Select a category"
            required
          />
          {errors.categoryId && (
            <p className="text-sm text-red-500 mt-1">{errors.categoryId}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !formData.name.trim() || !formData.categoryId}
        >
          {submitButtonText}
        </Button>
      </div>
    </form>
  );
}
