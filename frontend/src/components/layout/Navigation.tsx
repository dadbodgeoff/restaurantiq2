// frontend/src/components/layout/Navigation.tsx
// Navigation Component - Following RestaurantIQ patterns

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '../ui/Button';

// Following existing component patterns from the system
interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  roles: string[]; // Roles that can access this item
  description: string;
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: '📊',
    roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'],
    description: 'Overview and quick actions'
  },
  {
    name: 'Menu',
    href: '/menu',
    icon: '🍽️',
    roles: ['OWNER', 'ADMIN', 'MANAGER'],
    description: 'Manage menu items and categories'
  },
  {
    name: 'Prep',
    href: '/prep',
    icon: '📝',
    roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'],
    description: 'Track inventory and prep schedules'
  },
  {
    name: 'Users',
    href: '/users',
    icon: '👥',
    roles: ['OWNER', 'ADMIN', 'MANAGER'],
    description: 'Manage team members and roles'
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: '📈',
    roles: ['OWNER', 'ADMIN', 'MANAGER'],
    description: 'Analytics and performance metrics'
  },
  {
    name: 'Pricing',
    href: '/pricing',
    icon: '💰',
    roles: ['OWNER', 'ADMIN', 'MANAGER'],
    description: 'Price intelligence and vendor tracking'
  }
];

export function Navigation() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Filter navigation items based on user role
  const accessibleItems = navigationItems.filter(item =>
    user?.role && item.roles.includes(user.role)
  );

  // Check if a navigation item is active
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                RestaurantIQ
              </Link>
            </div>

            {/* Navigation Items */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {accessibleItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive(item.href)
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="hidden md:flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </div>

                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                >
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {accessibleItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive(item.href)
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-3">{item.icon}</span>
                  <div>
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                  </div>
                </div>
              </Link>
            ))}

            {user && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center px-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
