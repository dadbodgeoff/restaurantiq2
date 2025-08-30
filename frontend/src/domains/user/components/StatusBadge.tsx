// frontend/src/domains/user/components/StatusBadge.tsx
// Status Badge Component - Following RestaurantIQ patterns

import { StatusBadgeProps } from '../types';

// Following existing component patterns from UI components
export function StatusBadge({ isActive }: StatusBadgeProps) {
  // Status styling following existing badge patterns
  const getStatusStyles = (isActive: boolean) => {
    return isActive ? {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      label: 'Active'
    } : {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      label: 'Inactive'
    };
  };

  const styles = getStatusStyles(isActive);

  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      border ${styles.bg} ${styles.text} ${styles.border}
    `}>
      {styles.label}
    </span>
  );
}
