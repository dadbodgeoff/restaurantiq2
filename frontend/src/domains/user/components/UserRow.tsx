// frontend/src/domains/user/components/UserRow.tsx
// User Row Component - Following RestaurantIQ patterns

'use client';

import { useState } from 'react';
import { UserRole } from '../types';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';
import { UserRowProps } from '../types';
import { useModal } from '@/contexts/ModalContext';
import { AssignRoleModal } from './modals/AssignRoleModal';

// Following existing component patterns from LoginForm and other UI components
export function UserRow({ user, restaurantId, onRoleChange }: UserRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const { openModal } = useModal();

  // Format last login date following existing patterns
  const formatLastLogin = (lastLogin?: string | Date) => {
    if (!lastLogin) return 'Never';

    try {
      const date = typeof lastLogin === 'string' ? new Date(lastLogin) : lastLogin;
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return 'Today';
      if (diffDays === 2) return 'Yesterday';
      if (diffDays <= 7) return `${diffDays - 1} days ago`;

      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  const openAssignRole = async () => {
    await openModal<void>({
      title: 'Assign Role',
      size: 'sm',
      render: (resolve) => (
        <AssignRoleModal
          userId={user.id}
          currentRole={user.role}
          restaurantId={restaurantId}
          onAssigned={() => resolve(undefined)}
        />
      ),
    });
  };

  // Handle role change with optimistic updates (legacy inline)
  const handleRoleChange = async () => {
    try {
      await onRoleChange(user.id, selectedRole);
      setIsEditing(false);
    } catch (error) {
      setSelectedRole(user.role);
      throw error;
    }
  };

  const handleCancel = () => {
    setSelectedRole(user.role);
    setIsEditing(false);
  };

  return (
    <tr className="hover:bg-gray-50">
      {/* User Information Column */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {user.email.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {user.email}
            </div>
            <div className="text-sm text-gray-500">
              ID: {user.id.slice(0, 8)}...
            </div>
          </div>
        </div>
      </td>

      {/* Role Column */}
      <td className="px-6 py-4 whitespace-nowrap">
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {(['OWNER','ADMIN','MANAGER','STAFF'] as UserRole[]).map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <button onClick={handleRoleChange} className="text-green-600 hover:text-green-900 text-sm font-medium">Save</button>
            <button onClick={handleCancel} className="text-red-600 hover:text-red-900 text-sm font-medium">Cancel</button>
          </div>
        ) : (
          <RoleBadge role={user.role} />
        )}
      </td>

      {/* Status Column */}
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge isActive={user.isActive} />
      </td>

      {/* Last Login Column */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatLastLogin(user.lastLoginAt)}
      </td>

      {/* Actions Column */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center space-x-2">
          <button
            onClick={openAssignRole}
            className="text-blue-600 hover:text-blue-900"
          >
            Assign Role
          </button>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="text-gray-600 hover:text-gray-900">
              Edit Inline
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
