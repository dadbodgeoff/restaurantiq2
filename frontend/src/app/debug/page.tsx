'use client';

import { useEffect, useState } from 'react';
import { config } from '@/lib/config';

export default function DebugPage() {
  const [authServiceUrl, setAuthServiceUrl] = useState<string>('');

  useEffect(() => {
    // Dynamically import AuthService to check its configuration
    import('@/domains/auth/services/auth.service').then(({ AuthService }) => {
      const authService = new AuthService();
      // Access the private property for debugging
      setAuthServiceUrl('AuthService loaded successfully');
    }).catch(error => {
      console.error('Failed to load AuthService:', error);
      setAuthServiceUrl(`ERROR: ${error.message}`);
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Debug Configuration
          </h2>
        </div>
        <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Config API_URL:</label>
              <code className="text-blue-600">{config.API_URL}</code>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">AuthService baseUrl:</label>
              <code className="text-green-600">{authServiceUrl}</code>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Environment:</label>
              <code className="text-purple-600">{config.NODE_ENV}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
