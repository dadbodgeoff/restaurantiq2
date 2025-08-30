// frontend/src/domains/menu/components/MenuOverview.tsx
// Menu Management Overview Dashboard - RestaurantIQ Prep Workflow Focus

'use client';

import React from 'react';
import { useMenuOverview, useMenuPermissions } from '../hooks/useMenu';
import { MenuOverviewProps } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { ChefHat, Clock, Package, TrendingUp } from 'lucide-react';

export function MenuOverview({ }: MenuOverviewProps) {
  const { data: overview, isLoading, error } = useMenuOverview();
  const { data: permissions } = useMenuPermissions();

  if (!permissions?.canViewMenu) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">You don&apos;t have permission to view the menu.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-red-600">Error loading menu overview: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!overview) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No menu data available.</p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      title: 'Total Categories',
      value: overview.totalCategories,
      icon: Package,
      description: 'Menu sections',
      color: 'text-blue-600'
    },
    {
      title: 'Total Items',
      value: overview.totalItems,
      icon: ChefHat,
      description: 'Menu items',
      color: 'text-green-600'
    },
    {
      title: 'Active Items',
      value: overview.activeItems,
      icon: TrendingUp,
      description: `${overview.inactiveItems} inactive`,
      color: 'text-orange-600'
    },
    {
      title: 'Avg Prep Time',
      value: `${overview.averagePrepTime}m`,
      icon: Clock,
      description: 'Per item',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Station Breakdown */}
      {Object.keys(overview.categoriesByStation).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Items by Prep Station</CardTitle>
            <CardDescription>
              Distribution of menu items across prep stations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(overview.categoriesByStation)
                .sort(([, a], [, b]) => b - a)
                .map(([station, count]) => (
                  <div key={station} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ChefHat className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{station}</span>
                    </div>
                    <Badge variant="secondary">{count} items</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common menu management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent transition-colors">
              <Package className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">Manage Categories</div>
                <div className="text-sm text-muted-foreground">Add/edit menu sections</div>
              </div>
            </button>

            <button className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent transition-colors">
              <ChefHat className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <div className="font-medium">Manage Items</div>
                <div className="text-sm text-muted-foreground">Add/edit menu items</div>
              </div>
            </button>

            <button className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent transition-colors">
              <Clock className="h-5 w-5 text-purple-600" />
              <div className="text-left">
                <div className="font-medium">Prep Planning</div>
                <div className="text-sm text-muted-foreground">View prep requirements</div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
