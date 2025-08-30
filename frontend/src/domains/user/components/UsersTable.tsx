// frontend/src/domains/user/components/UsersTable.tsx
// Users Table Component - Following RestaurantIQ patterns

'use client';

import { UserRow } from './UserRow';
import { UsersTableProps, UserRole } from '../types';
import { useModal } from '@/contexts/ModalContext';
import { AssignRoleModal } from './modals/AssignRoleModal';

// Following existing table patterns from the system
export function UsersTable({ users, restaurantId, onRoleChange, loading }: UsersTableProps) {
  const { openModal } = useModal();

  const openAssignRole = async (userId: string, currentRole: UserRole, restId: string) => {
    await openModal<void>({
      title: 'Assign Role',
      size: 'sm',
      render: (resolve) => (
        <AssignRoleModal
          userId={userId}
          currentRole={currentRole}
          restaurantId={restId}
          onAssigned={() => resolve(undefined)}
        />
      ),
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Login
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              restaurantId={restaurantId}
              onRoleChange={async (userId, newRole) => {
                await onRoleChange(userId, newRole);
              }}
            />
          ))}
        </tbody>
      </table>

      {/* Loading state overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Updating...</span>
          </div>
        </div>
      )}
    </div>
  );
}
