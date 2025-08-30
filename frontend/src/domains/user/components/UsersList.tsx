// frontend/src/domains/user/components/UsersList.tsx
// Users List Component - Following RestaurantIQ patterns

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UsersTable } from './UsersTable';
import { UsersFilters } from './UsersFilters';
import { UsersPagination } from './UsersPagination';
import { CreateUserModal } from './modals/CreateUserModal';
import { Card } from '../../../components/ui/Card';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { UserService } from '../services/user.service';
import { UserApiService } from '../services/user.api.service';
import {
  UsersListProps,
  UserFilters,
  UserRole,
  UserManagementError
} from '../types';

// Following existing component patterns from UI components
export function UsersList({ restaurantId }: UsersListProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Initialize services following AuthService pattern
  const userApiService = new UserApiService();
  const userService = new UserService(userApiService, {
    id: user!.id,
    role: user!.role as UserRole,
    restaurantId: user!.restaurantId
  });

  // State for filters and loading
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 20
  });

  // State for create user modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // React Query for data fetching - following existing patterns
  const {
    data: usersData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['users', restaurantId, filters],
    queryFn: () => userService.loadUsers(restaurantId, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on permission errors
      if (error instanceof UserManagementError &&
          error.code === 'INSUFFICIENT_PERMISSIONS') {
        return false;
      }
      return failureCount < 3;
    },
    enabled: !!restaurantId && !!user // Only run when we have both restaurantId and authenticated user
  });

  // Mutation for role updates - following existing patterns
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      userService.assignRole(restaurantId, userId, role),
    onSuccess: (data) => {
      // Invalidate and refetch users data
      queryClient.invalidateQueries({ queryKey: ['users', restaurantId] });

      // Show success message following existing patterns
      console.log('✅ User Role Updated:', {
        userId: data.userId,
        oldRole: data.oldRole,
        newRole: data.newRole,
        assignedBy: data.assignedBy
      });
    },
    onError: (error: UserManagementError) => {
      // Error handling following existing patterns
      console.error('❌ Role Update Failed:', error, {
        code: error.code,
        correlationId: error.correlationId
      });
    }
  });

  // Handle role change with optimistic updates
  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role });
    } catch (error) {
      // Error is handled by the mutation
      throw error;
    }
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters({ ...newFilters, page: 1 }); // Reset to first page
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  // Handle successful user creation
  const handleUserCreated = (newUser: any) => {
    // Close modal
    setShowCreateModal(false);

    // Invalidate and refetch users data
    queryClient.invalidateQueries({ queryKey: ['users', restaurantId] });

    // Show success message following existing patterns
    console.log('✅ User created successfully:', newUser);
    // You could add a toast notification here if desired
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading users...</span>
          </div>
        </div>
      </Card>
    );
  }

  // Error state following existing patterns
  if (error) {
    const errorMessage = error instanceof UserManagementError
      ? error.message
      : 'Failed to load users';

    return (
      <Card>
        <div className="p-6">
          <Alert type="error" title="Error Loading Users" message={errorMessage} />
          <div className="mt-4">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </Card>
    );
  }

  // Safety check for usersData
  if (!usersData) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading user data...</span>
          </div>
        </div>
      </Card>
    );
  }

  // No data state
  if (usersData.users.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
            <p className="text-gray-600">
              {filters.search || filters.role
                ? 'Try adjusting your filters to see more users.'
                : 'No users have been added to this restaurant yet.'
              }
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {/* Header section */}
      <div className="px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
            <p className="text-sm text-gray-600">
              Manage user roles and permissions
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              {usersData?.pagination?.total ? `${usersData.pagination.total} total users` : 'Loading...'}
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add User
            </Button>
          </div>
        </div>
      </div>

      {/* Filters section */}
      <div className="p-6">
        <UsersFilters
          filters={filters}
          onChange={handleFiltersChange}
        />
      </div>

      {/* Table section */}
      <div className="px-6 pb-6">
        <UsersTable
          users={usersData.users}
          restaurantId={restaurantId}
          onRoleChange={handleRoleChange}
          loading={updateRoleMutation.isPending}
        />

        {/* Pagination */}
        <div className="mt-6">
          <UsersPagination
            pagination={usersData.pagination}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Loading overlay for mutations */}
      {updateRoleMutation.isPending && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Updating role...</span>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <CreateUserModal
              restaurantId={restaurantId}
              onUserCreated={handleUserCreated}
              onCancel={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
