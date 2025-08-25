'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Not Authorized</h1>
          <p className="text-gray-600 mb-4">Please log in to access the dashboard.</p>
          <a href="/login" className="text-blue-600 hover:text-blue-500">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">RestaurantIQ Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.firstName}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Restaurant ID: {user.restaurantId}
              </span>
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* User Info Card */}
        <div className="mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">User Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{user.firstName} {user.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 text-sm text-gray-900">{user.role}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Permissions</label>
                <p className="mt-1 text-sm text-gray-900">{user.permissions.length} permissions</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Menu Management</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create and manage your restaurant's menu items, categories, and pricing.
            </p>
            <Button className="w-full">
              Manage Menu
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Prep Management</h3>
            <p className="text-sm text-gray-600 mb-4">
              Track inventory, manage prep schedules, and monitor stock levels.
            </p>
            <Button className="w-full">
              Manage Prep
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Reports & Analytics</h3>
            <p className="text-sm text-gray-600 mb-4">
              View sales reports, inventory analytics, and performance metrics.
            </p>
            <Button className="w-full">
              View Reports
            </Button>
          </Card>
        </div>

        {/* API Status */}
        <div className="mt-8">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Backend API: Connected and running
              </span>
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Authentication: Active
              </span>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
