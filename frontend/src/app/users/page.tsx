// frontend/src/app/users/page.tsx
// User Management Page - Following RestaurantIQ patterns

'use client';

import { UsersList } from '../../domains/user/components/UsersList';
import { Navigation } from '../../components/layout/Navigation';
import { useAuth } from '../../contexts/AuthContext';

// Following existing page patterns from dashboard/page.tsx
export default function UsersPage() {
  const { user } = useAuth();

  // Check if user has permission to view users
  if (!user || !['OWNER', 'ADMIN', 'MANAGER'].includes(user.role)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to manage users.</p>
        </div>
      </div>
    );
  }

  const restaurantId = user.restaurantId;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Page header following existing patterns */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-lg text-gray-600">Manage team members and their roles</p>
        </div>

        {/* Main content area */}
        <div className="bg-white rounded-lg shadow">
          <UsersList restaurantId={restaurantId} />
        </div>

        {/* Footer information */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Restaurant: <span className="font-medium">{user.restaurantId}</span> |
            Your Role: <span className="font-medium">{user.role}</span>
          </p>
        </div>
      </main>
    </div>
  );
}
