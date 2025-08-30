// frontend/src/domains/menu/components/AvailabilityBadge.tsx
// Availability Status Badge Component - RestaurantIQ Prep Workflow Focus

'use client';

import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { CheckCircle, XCircle } from 'lucide-react';

interface AvailabilityBadgeProps {
  isAvailable: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function AvailabilityBadge({
  isAvailable,
  size = 'md',
  showIcon = true
}: AvailabilityBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  if (isAvailable) {
    return (
      <Badge
        variant="default"
        className={`bg-green-100 text-green-800 border-green-200 hover:bg-green-200 ${sizeClasses[size]} font-medium flex items-center gap-1`}
      >
        {showIcon && <CheckCircle className="h-3 w-3" />}
        Available
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={`bg-red-100 text-red-800 border-red-200 hover:bg-red-200 ${sizeClasses[size]} font-medium flex items-center gap-1`}
    >
      {showIcon && <XCircle className="h-3 w-3" />}
      Unavailable
    </Badge>
  );
}
