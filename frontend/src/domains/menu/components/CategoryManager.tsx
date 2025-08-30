// frontend/src/domains/menu/components/CategoryManager.tsx
// Category Management Component - RestaurantIQ Prep Workflow Focus

'use client';

import React, { useState } from 'react';
import { useMenuCategories, useMenuPermissions } from '../hooks/useMenu';
import { CategoryManagerProps, MenuCategory, CreateMenuCategoryRequest, UpdateMenuCategoryRequest } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Textarea } from '../../../components/ui/Textarea';
import { Badge } from '../../../components/ui/Badge';
import { Switch } from '../../../components/ui/Switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/Dialog';
import {
  Plus,
  Edit,
  Trash2,
  Package,
  ChefHat
} from 'lucide-react';

export function CategoryManager({ categories, onCategoryChange }: CategoryManagerProps) {
  const { createCategory, updateCategory, deleteCategory, isCreating, isUpdating, isDeleting } = useMenuCategories();
  const { data: permissions } = useMenuPermissions();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    displayOrder: 0,
    isActive: true
  });
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    displayOrder: 0,
    isActive: true
  });

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      description: '',
      displayOrder: 0,
      isActive: true
    });
  };

  const handleCreateCategory = async () => {
    if (!createForm.name.trim()) return;

    try {
      const categoryData: CreateMenuCategoryRequest = {
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        displayOrder: createForm.displayOrder,
        isActive: createForm.isActive
      };

      console.log('Creating category with data:', categoryData);
      await createCategory(categoryData);
      onCategoryChange();
      setIsCreateDialogOpen(false);
      resetCreateForm();
    } catch (error) {
      console.error('Failed to create category:', error);
      console.error('Error details:', error);
    }
  };

  const handleEditCategory = (category: MenuCategory) => {
    setEditingCategory(category);
    setEditForm({
      name: category.name,
      description: category.description || '',
      displayOrder: category.displayOrder,
      isActive: category.isActive
    });
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editForm.name.trim()) return;

    try {
      const categoryData: UpdateMenuCategoryRequest = {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        displayOrder: editForm.displayOrder,
        isActive: editForm.isActive
      };

      await updateCategory({ categoryId: editingCategory.id, data: categoryData });
      onCategoryChange();
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This will not delete the items, but they will become uncategorized.')) {
      return;
    }

    try {
      await deleteCategory(categoryId);
      onCategoryChange();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  if (!permissions?.canViewMenu) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">You don&apos;t have permission to manage categories.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Menu Categories</h2>
          <p className="text-muted-foreground">
            Organize your menu items into categories for prep workflow management
          </p>
        </div>

        {permissions.canManageCategories && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <Button
              onClick={() => {
                resetCreateForm();
                setIsCreateDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Menu Category</DialogTitle>
                <DialogDescription>
                  Add a new category to organize your menu items for prep workflows.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name *
                  </Label>
                  <Input
                    id="name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="col-span-3"
                    placeholder="e.g., Appetizers, Main Courses"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="col-span-3"
                    placeholder="Optional prep instructions for this category"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="displayOrder" className="text-right">
                    Display Order
                  </Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={createForm.displayOrder}
                    onChange={(e) => setCreateForm({ ...createForm, displayOrder: parseInt(e.target.value) || 0 })}
                    className="col-span-3"
                    min="0"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isActive" className="text-right">
                    Active
                  </Label>
                  <Switch
                    id="isActive"
                    checked={createForm.isActive}
                    onCheckedChange={(checked) => setCreateForm({ ...createForm, isActive: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCategory} disabled={isCreating || !createForm.name.trim()}>
                  {isCreating ? 'Creating...' : 'Create Category'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card key={category.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  {category.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={category.isActive ? 'default' : 'secondary'}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {permissions.canManageCategories && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              {category.description && (
                <CardDescription>{category.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Display Order: {category.displayOrder}</span>
                <span className="flex items-center gap-1">
                  <ChefHat className="h-4 w-4" />
                  {category.itemCount || 0} items
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Menu Category</DialogTitle>
            <DialogDescription>
              Update category details for prep workflow management.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name *
              </Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-displayOrder" className="text-right">
                Display Order
              </Label>
              <Input
                id="edit-displayOrder"
                type="number"
                value={editForm.displayOrder}
                onChange={(e) => setEditForm({ ...editForm, displayOrder: parseInt(e.target.value) || 0 })}
                className="col-span-3"
                min="0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-isActive" className="text-right">
                Active
              </Label>
              <Switch
                id="edit-isActive"
                checked={editForm.isActive}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory} disabled={isUpdating || !editForm.name.trim()}>
              {isUpdating ? 'Updating...' : 'Update Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
