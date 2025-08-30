// frontend/src/domains/user/hooks/useUsers.ts
// React Query hooks for user management - Following RestaurantIQ patterns

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { UserService } from '../services/user.service';
import { UserApiService } from '../services/user.api.service';
import {
  User,
  UserFilters,
  UserRole,
  PaginatedUsers,
  UserRoleUpdate,
  UpdateRoleResponse,
  UserManagementError
} from '../types';

// Following existing hook patterns from the system
export function useUsers(filters?: UserFilters) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Initialize services following AuthService pattern
  const userApiService = new UserApiService();
  const userService = new UserService(userApiService, {
    id: user!.id,
    role: user!.role as UserRole,
    restaurantId: user!.restaurantId
  });

  // Query for users list
  const usersQuery = useQuery({
    queryKey: ['users', user!.restaurantId, filters],
    queryFn: () => userService.loadUsers(user!.restaurantId, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      if (error instanceof UserManagementError && error.code === 'INSUFFICIENT_PERMISSIONS') {
        return false;
      }
      return failureCount < 3;
    }
  });

  // Mutation for updating user role
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      userService.assignRole(user!.restaurantId, userId, role),
    onSuccess: (data: UserRoleUpdate) => {
      queryClient.invalidateQueries({ queryKey: ['users', user!.restaurantId] });
      loggerService.info('User Role Updated', `Successfully updated role for user ${data.userId}`, {
        userId: data.userId,
        oldRole: data.oldRole,
        newRole: data.newRole,
        assignedBy: data.assignedBy
      });
    },
    onError: (error: UserManagementError) => {
      loggerService.error('Role Update Failed', error, {
        code: error.code,
        correlationId: error.correlationId
      });
    }
  });

  // Mutation for updating user details
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: Partial<User> }) =>
      userService.updateUser(user!.restaurantId, userId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', user!.restaurantId] });
    }
  });

  // Mutation for deleting user
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => userService.deleteUser(user!.restaurantId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', user!.restaurantId] });
    }
  });

  return {
    users: usersQuery.data?.users || [],
    pagination: usersQuery.data?.pagination,
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    updateRole: updateRoleMutation.mutateAsync,
    updateUser: updateUserMutation.mutateAsync,
    deleteUser: deleteUserMutation.mutateAsync,
    isUpdatingRole: updateRoleMutation.isPending,
    isUpdatingUser: updateUserMutation.isPending,
    isDeletingUser: deleteUserMutation.isPending,
    refetch: usersQuery.refetch
  };
}

export function useUser(userId: string) {
  const { user } = useAuth();

  const userApiService = new UserApiService();
  const userService = new UserService(userApiService, {
    id: user!.id,
    role: user!.role as UserRole,
    restaurantId: user!.restaurantId
  });

  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getUser(user!.restaurantId, userId),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!userId
  });
}

export function useUserPermissions() {
  const { user } = useAuth();

  const userApiService = new UserApiService();
  const userService = new UserService(userApiService, {
    id: user!.id,
    role: user!.role as UserRole,
    restaurantId: user!.restaurantId
  });

  return useQuery({
    queryKey: ['user-permissions', user!.id],
    queryFn: () => userService.getUserPermissions(),
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
