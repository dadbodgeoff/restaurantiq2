// frontend/src/domains/user/components/RoleBadge.tsx
// Role Badge Component - Following RestaurantIQ patterns

import { UserRole } from '../types';
import { RoleBadgeProps } from '../types';

// Following existing component patterns from UI components
export function RoleBadge({ role }: RoleBadgeProps) {
  // Role styling following existing badge patterns
  const getRoleStyles = (role: UserRole) => {
    switch (role) {
      case 'OWNER':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-800',
          border: 'border-purple-200',
          label: 'Owner'
        };
      case 'ADMIN':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200',
          label: 'Admin'
        };
      case 'MANAGER':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          border: 'border-blue-200',
          label: 'Manager'
        };
      case 'STAFF':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200',
          label: 'Staff'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          label: role
        };
    }
  };

  const styles = getRoleStyles(role);

  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      border ${styles.bg} ${styles.text} ${styles.border}
    `}>
      {styles.label}
    </span>
  );
}
