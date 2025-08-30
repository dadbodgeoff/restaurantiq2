// frontend/src/domains/user/components/modals/AssignRoleModal.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '../../types';
import { UserService } from '../../services/user.service';
import { UserApiService } from '../../services/user.api.service';

interface AssignRoleModalProps {
  userId: string;
  currentRole: UserRole;
  restaurantId: string;
  onAssigned?: (data: { userId: string; oldRole: UserRole; newRole: UserRole }) => void;
}

export function AssignRoleModal({ userId, currentRole, restaurantId, onAssigned }: AssignRoleModalProps) {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(currentRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userService = useMemo(() => {
    // Following AuthService pattern - using fetch directly
    const api = new UserApiService();
    return new UserService(api, {
      id: user!.id,
      role: user!.role as UserRole,
      restaurantId: user!.restaurantId
    });
  }, [user]);

  const assign = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.assignRole(restaurantId, userId, role);
      onAssigned?.(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to assign role';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">New Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="OWNER">Owner</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="STAFF">Staff</option>
        </select>
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <div className="flex items-center justify-end space-x-3">
        <Button
          onClick={assign}
          disabled={loading || role === currentRole}
        >
          {loading ? 'Assigning…' : 'Assign Role'}
        </Button>
      </div>
    </div>
  );
}
