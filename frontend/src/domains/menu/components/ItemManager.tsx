// frontend/src/domains/menu/components/ItemManager.tsx
// Item Management Component - RestaurantIQ Prep Workflow Focus

'use client';

import React, { useState } from 'react';
import { useMenuItems, useMenuPermissions } from '../hooks/useMenu';
import { MenuItem, CreateMenuItemRequest, UpdateMenuItemRequest, ItemManagerProps } from '../types';
import { ItemForm } from './ItemForm';
import { CategorySelect } from './CategorySelect';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Badge } from '../../../components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/Dialog';
import {
  Plus,
  Edit,
  Trash2,
  ChefHat,
  Clock,
  Package,
  Search,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export function ItemManager({ categories, onItemChange }: Readonly<ItemManagerProps>) {
  const {
    items,
    createItem,
    updateItem,
    deleteItem,
    toggleAvailability,
    isCreating,
    isUpdating,
    isDeleting,
    isToggling
  } = useMenuItems();
  const { data: permissions } = useMenuPermissions();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items based on selected category and search query
  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
  };

  const handleCreateItem = async (data: CreateMenuItemRequest) => {
    try {
      console.log('Creating item with data:', data);
      await createItem(data);
      onItemChange();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create item:', error);
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
  };

  const handleUpdateItem = async (data: CreateMenuItemRequest) => {
    if (!editingItem) return;

    try {
      const updateData: UpdateMenuItemRequest = {
        name: data.name,
        description: data.description,
        prepTimeMinutes: data.prepTimeMinutes,
        categoryId: data.categoryId,
        allergens: data.allergens,
        station: data.station,
        isAvailable: data.isAvailable,
      };

      await updateItem({ itemId: editingItem.id, data: updateData });
      onItemChange();
      setEditingItem(null);
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteItem(itemId);
      onItemChange();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleToggleAvailability = async (itemId: string, currentAvailability: boolean) => {
    try {
      await toggleAvailability({ itemId, isAvailable: !currentAvailability });
      onItemChange();
    } catch (error) {
      console.error('Failed to toggle availability:', error);
    }
  };

  if (!permissions?.canViewMenu) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">You don&apos;t have permission to manage menu items.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button and Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Menu Items</h2>
          <p className="text-muted-foreground">
            Manage individual menu items with prep details and availability control
          </p>
        </div>

        {permissions.canManageMenu && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Menu Item</DialogTitle>
                <DialogDescription>
                  Add a new menu item with prep details and category assignment.
                </DialogDescription>
              </DialogHeader>
              <ItemForm
                categories={categories}
                onSubmit={handleCreateItem}
                onCancel={() => setIsCreateDialogOpen(false)}
                isLoading={isCreating}
                mode="create"
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search" className="text-sm font-medium">Search Items</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, description, or category..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="sm:w-64">
          <CategorySelect
            value={selectedCategory}
            onChange={setSelectedCategory}
            categories={[{ id: 'all', name: 'All Categories', displayOrder: 0, isActive: true }, ...categories]}
            placeholder="Filter by category"
            label="Category Filter"
          />
        </div>

        {(selectedCategory !== 'all' || searchQuery) && (
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={resetFilters}
              className="whitespace-nowrap"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2 flex-1">
                  <ChefHat className="h-5 w-5 text-orange-600 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </CardTitle>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={item.isAvailable ? 'default' : 'secondary'}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </Badge>
                  {permissions.canManageMenu && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              {item.description && (
                <CardDescription className="line-clamp-2">{item.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Category */}
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Category:</span>
                  <Badge variant="outline">{item.category?.name || 'Uncategorized'}</Badge>
                </div>

                {/* Prep Time */}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Prep Time:</span>
                  <span>{item.prepTimeMinutes} minutes</span>
                </div>

                {/* Allergens */}
                {item.allergens && (
                  <div className="text-sm">
                    <span className="font-medium">Allergens:</span>
                    <span className="text-orange-600 ml-1">{item.allergens}</span>
                  </div>
                )}

                {/* Station */}
                {item.station && (
                  <div className="text-sm">
                    <span className="font-medium">Station:</span>
                    <span className="ml-1">{item.station}</span>
                  </div>
                )}

                {/* Availability Toggle */}
                {permissions.canToggleAvailability && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Quick Toggle:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                      disabled={isToggling}
                      className="flex items-center gap-1"
                    >
                      {item.isAvailable ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-xs">
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32">
            <ChefHat className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-muted-foreground text-center">
              {items.length === 0
                ? 'No menu items found. Create your first item to get started.'
                : 'No items match your current filters.'
              }
            </p>
            {items.length > 0 && (selectedCategory !== 'all' || searchQuery) && (
              <Button
                variant="outline"
                onClick={resetFilters}
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>
              Update item details and prep information.
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <ItemForm
              categories={categories}
              onSubmit={handleUpdateItem}
              onCancel={() => setEditingItem(null)}
              isLoading={isUpdating}
              initialData={{
                name: editingItem.name,
                description: editingItem.description,
                prepTimeMinutes: editingItem.prepTimeMinutes,
                categoryId: editingItem.categoryId,
                allergens: editingItem.allergens,
                station: editingItem.station,
                isAvailable: editingItem.isAvailable,
              }}
              mode="edit"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
