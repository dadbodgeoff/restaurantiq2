'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';

interface RestaurantSetupFormProps {
  onSubmit: (data: {
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
  }) => Promise<void>;
}

export function RestaurantSetupForm({ onSubmit }: RestaurantSetupFormProps) {
  const [formData, setFormData] = useState({
    restaurant: {
      name: '',
      timezone: 'America/New_York',
      locale: 'en-US',
      currency: 'USD',
    },
    user: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log('Form data being submitted:', formData);
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
      setError(error instanceof Error ? error.message : 'Setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (section: 'restaurant' | 'user', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  return (
    <Card className="max-w-md w-full space-y-8 p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert type="error" message={error} />
        )}

        {/* Restaurant Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Restaurant Information</h3>

          <Input
            label="Restaurant Name"
            name="name"
            type="text"
            required
            value={formData.restaurant.name}
            onChange={(e) => handleChange('restaurant', 'name', e.target.value)}
            placeholder="Enter your restaurant name"
            disabled={isLoading}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Timezone"
              name="timezone"
              type="text"
              value={formData.restaurant.timezone}
              onChange={(e) => handleChange('restaurant', 'timezone', e.target.value)}
              placeholder="America/New_York"
              disabled={isLoading}
            />

            <Input
              label="Currency"
              name="currency"
              type="text"
              value={formData.restaurant.currency}
              onChange={(e) => handleChange('restaurant', 'currency', e.target.value)}
              placeholder="USD"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Owner Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Owner Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="firstName"
              type="text"
              required
              value={formData.user.firstName}
              onChange={(e) => handleChange('user', 'firstName', e.target.value)}
              placeholder="John"
              disabled={isLoading}
            />

            <Input
              label="Last Name"
              name="lastName"
              type="text"
              required
              value={formData.user.lastName}
              onChange={(e) => handleChange('user', 'lastName', e.target.value)}
              placeholder="Doe"
              disabled={isLoading}
            />
          </div>

          <Input
            label="Email Address"
            name="email"
            type="email"
            required
            value={formData.user.email}
            onChange={(e) => handleChange('user', 'email', e.target.value)}
            placeholder="owner@restaurant.com"
            disabled={isLoading}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            required
            value={formData.user.password}
            onChange={(e) => handleChange('user', 'password', e.target.value)}
            placeholder="Enter a strong password"
            disabled={isLoading}
            helperText="Must contain at least 8 characters with uppercase, lowercase, number, and special character"
          />
        </div>

        <div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Setting up...' : 'Create Restaurant & Account'}
          </Button>
        </div>

        <div className="text-center">
          <span className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-500">
              Sign in
            </a>
          </span>
        </div>
      </form>
    </Card>
  );
}
