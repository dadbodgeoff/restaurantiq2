'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';

interface LoginFormProps {
  onSubmit: (email: string, password: string, restaurantId?: string) => Promise<{
    requiresRestaurantSelection?: boolean;
    restaurants?: Array<{ id: string; name: string }>;
  }>;
}

// LoginForm component

export function LoginForm({ onSubmit }: LoginFormProps) {

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    restaurantId: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRestaurantSelection, setShowRestaurantSelection] = useState(false);
  const [availableRestaurants, setAvailableRestaurants] = useState<Array<{ id: string; name: string }>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setShowRestaurantSelection(false);

    try {
      const result = await onSubmit(formData.email, formData.password, formData.restaurantId || undefined);

      if (result.requiresRestaurantSelection && result.restaurants) {
        setAvailableRestaurants(result.restaurants);
        setShowRestaurantSelection(true);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
      setIsLoading(false);
    }
  };

  const handleRestaurantSelect = async (restaurantId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await onSubmit(formData.email, formData.password, restaurantId);
      setShowRestaurantSelection(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => {
      const fieldName = e.target.name || e.target.id || 'unknown';
      return {
        ...prev,
        [fieldName]: e.target.value
      };
    });
  };

  return (
    <Card className="max-w-md w-full space-y-8 p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert type="error" message={error} />
        )}

        {!showRestaurantSelection && (
          <>
            <div>
              <label htmlFor="restaurantId" className="block text-sm font-medium text-gray-700">
                Restaurant ID (Optional)
              </label>
              <Input
                id="restaurantId"
                name="restaurantId"
                type="text"
                value={formData.restaurantId}
                onChange={handleChange}
                placeholder="Leave empty for auto-detection"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </>
        )}

        {showRestaurantSelection && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">Select Your Restaurant</h3>
              <p className="text-sm text-gray-600 mt-1">
                Multiple restaurants found for {formData.email}
              </p>
            </div>

            <div className="space-y-2">
              {availableRestaurants.map((restaurant) => (
                <button
                  key={restaurant.id}
                  type="button"
                  onClick={() => handleRestaurantSelect(restaurant.id)}
                  className="w-full p-3 text-left border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                >
                  <div className="font-medium text-gray-900">{restaurant.name}</div>
                  <div className="text-sm text-gray-500">ID: {restaurant.id}</div>
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowRestaurantSelection(false)}
              disabled={isLoading}
            >
              Back to Login
            </Button>
          </div>
        )}

        {!showRestaurantSelection && (
          <>
            <div className="text-center">
              <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                Forgot your password?
              </a>
            </div>

            <div className="text-center">
              <span className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <a href="/setup" className="text-blue-600 hover:text-blue-500">
                  Set up your restaurant
                </a>
              </span>
            </div>
          </>
        )}
      </form>
    </Card>
  );
}
21