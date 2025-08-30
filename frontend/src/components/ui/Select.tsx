// frontend/src/components/ui/Select.tsx
// Select Component - Following RestaurantIQ patterns

import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

export function Select({ className = '', ...props }: SelectProps) {
  const baseClasses = 'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm';
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <select className={combinedClasses} {...props} />
  );
}
