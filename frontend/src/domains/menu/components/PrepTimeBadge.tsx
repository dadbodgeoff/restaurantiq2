// frontend/src/domains/menu/components/PrepTimeBadge.tsx
// Prep Time Badge Component - RestaurantIQ Prep Workflow Focus

'use client';

import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Clock } from 'lucide-react';

interface PrepTimeBadgeProps {
  prepTimeMinutes: number;
  size?: 'sm' | 'md' | 'lg';
}

export function PrepTimeBadge({ prepTimeMinutes, size = 'md' }: PrepTimeBadgeProps) {
  // Determine color based on prep time
  const getPrepTimeColor = (minutes: number) => {
    if (minutes <= 5) return 'bg-green-100 text-green-800 border-green-200';
    if (minutes <= 15) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (minutes <= 30) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getPrepTimeLabel = (minutes: number) => {
    if (minutes <= 5) return 'Quick';
    if (minutes <= 15) return 'Medium';
    if (minutes <= 30) return 'Slow';
    return 'Very Slow';
  };

  const colorClass = getPrepTimeColor(prepTimeMinutes);
  const label = getPrepTimeLabel(prepTimeMinutes);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  return (
    <Badge
      variant="outline"
      className={`${colorClass} ${sizeClasses[size]} font-medium flex items-center gap-1`}
    >
      <Clock className="h-3 w-3" />
      {prepTimeMinutes}m ({label})
    </Badge>
  );
}
