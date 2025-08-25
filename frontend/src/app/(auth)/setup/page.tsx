'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RestaurantSetupForm } from '@/domains/auth/components/RestaurantSetupForm';

export default function SetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSetup = async (data: {
    restaurant: {
      name: string;
      timezone?: string;
      locale?: string;
      currency?: string;
      settings?: Record<string, unknown>;
    };
    user: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    };
  }) => {
    setIsLoading(true);
    try {
      console.log('Making setup request with data:', data);

      // Use absolute URL to ensure we hit the frontend API route
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
      const apiUrl = `${baseUrl}/api/restaurants/setup-complete`;

      console.log('Making request to:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = 'Setup failed';
        try {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          errorMessage = errorData.error?.message || errorData.message || 'Setup failed';
        } catch (e) {
          console.error('Failed to parse error response:', e);
          // If we can't parse the error response, use the status text
          errorMessage = response.statusText || 'Setup failed';
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Setup successful:', result);

      // Redirect to login with the new restaurant ID
      router.push(`/login?restaurantId=${result.data.restaurant.id}&message=Account created successfully`);
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Setting up your restaurant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set up your Restaurant
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create your restaurant and owner account
          </p>
        </div>
        <RestaurantSetupForm onSubmit={handleSetup} />
      </div>
    </div>
  );
}
