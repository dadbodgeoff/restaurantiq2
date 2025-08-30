// frontend/src/domains/user/components/UsersFilters.tsx
// Users Filters Component - Following RestaurantIQ patterns

'use client';

import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { UsersFiltersProps, UserRole, UserFilters } from '../types';

// Following existing form patterns from LoginForm and other components
export function UsersFilters({ filters, onChange }: UsersFiltersProps) {
  const [localFilters, setLocalFilters] = useState<UserFilters>(filters);

  // Handle input changes with debouncing for search
  const handleSearchChange = (value: string) => {
    const newFilters = { ...localFilters, search: value, page: 1 };
    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  // Handle role filter change
  const handleRoleChange = (role: string) => {
    const newFilters = {
      ...localFilters,
      role: role === 'ALL' ? undefined : role as UserRole,
      page: 1
    };
    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  // Handle active status filter change
  const handleActiveChange = (isActive: string) => {
    const newFilters = {
      ...localFilters,
      isActive: isActive === 'ALL' ? undefined : isActive === 'ACTIVE',
      page: 1
    };
    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  // Handle limit change
  const handleLimitChange = (limit: number) => {
    const newFilters = { ...localFilters, limit, page: 1 };
    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    const clearedFilters: UserFilters = {
      page: 1,
      limit: 20
    };
    setLocalFilters(clearedFilters);
    onChange(clearedFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = localFilters.search || localFilters.role || localFilters.isActive !== undefined;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {/* Search and Role/Status Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="lg:col-span-2">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Users
          </label>
          <Input
            id="search"
            type="text"
            placeholder="Search by email..."
            value={localFilters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Role Filter */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <Select
            id="role"
            value={localFilters.role || 'ALL'}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full"
          >
            <option value="ALL">All Roles</option>
            <option value="OWNER">Owner</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="STAFF">Staff</option>
          </Select>
        </div>

        {/* Active Status Filter */}
        <div>
          <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <Select
            id="isActive"
            value={
              localFilters.isActive === undefined ? 'ALL' :
              localFilters.isActive ? 'ACTIVE' : 'INACTIVE'
            }
            onChange={(e) => handleActiveChange(e.target.value)}
            className="w-full"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </div>

      {/* Items per page and Actions Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <label htmlFor="limit" className="text-sm font-medium text-gray-700">
            Show:
          </label>
          <Select
            id="limit"
            value={localFilters.limit?.toString() || '20'}
            onChange={(e) => handleLimitChange(parseInt(e.target.value, 10))}
            className="w-20"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </Select>
          <span className="text-sm text-gray-600">per page</span>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            onClick={handleClearFilters}
            variant="secondary"
            size="sm"
            className="text-gray-600 hover:text-gray-800"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="font-medium">Active filters:</span>
          {localFilters.search && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Search: &quot;{localFilters.search}&quot;
            </span>
          )}
          {localFilters.role && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Role: {localFilters.role}
            </span>
          )}
          {localFilters.isActive !== undefined && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Status: {localFilters.isActive ? 'Active' : 'Inactive'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
