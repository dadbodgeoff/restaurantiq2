// frontend/src/domains/user/components/modals/CreateUserModal.tsx
// Create User Modal Component - Following RestaurantIQ patterns

'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '../../services/user.service';
import { UserApiService } from '../../services/user.api.service';
import {
  CreateUserRequest,
  UserRole,
  UserManagementError,
  UserFormData,
  UserFormErrors
} from '../../types';

interface CreateUserModalProps {
  restaurantId: string;
  onUserCreated: (user: any) => void;
  onCancel: () => void;
}

export function CreateUserModal({ restaurantId, onUserCreated, onCancel }: CreateUserModalProps) {
  const { user } = useAuth();

  // Initialize services following existing pattern
  const userApiService = useMemo(() => new UserApiService(), []);
  const userService = useMemo(() => {
    if (!user) return null;
    return new UserService(userApiService, {
      id: user.id,
      role: user.role as UserRole,
      restaurantId: user.restaurantId
    });
  }, [user, userApiService]);

  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'STAFF' as UserRole,
    isActive: true
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<UserFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Get assignable roles from service
  const assignableRoles = useMemo(() => {
    if (!userService) return ['STAFF'] as UserRole[];
    return userService.getAssignableRoles();
  }, [userService]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: UserFormErrors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length > 50) {
      newErrors.firstName = 'First name must be less than 50 characters';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length > 50) {
      newErrors.lastName = 'Last name must be less than 50 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (formData.email.length > 255) {
      newErrors.email = 'Email must be less than 255 characters';
    }

    // Password validation
    if (!password) {
      newErrors.isActive = 'Password is required'; // Reusing isActive field for password error
    } else if (password.length < 8) {
      newErrors.isActive = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
      newErrors.isActive = 'Password must contain uppercase, lowercase, number, and special character';
    }

    // Confirm password validation
    if (password !== confirmPassword) {
      newErrors.role = 'Passwords do not match'; // Reusing role field for confirm password error
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required';
    } else if (!assignableRoles.includes(formData.role)) {
      newErrors.role = 'You do not have permission to assign this role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userService) {
      setSubmitError('Authentication service not available');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const userData: CreateUserRequest = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password,
        role: formData.role
      };

      const result = await userService.createUser(restaurantId, userData);

      // Success - call the callback
      onUserCreated(result.user);

    } catch (error) {
      console.error('❌ Create user failed:', error);

      if (error instanceof UserManagementError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Failed to create user. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof UserFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.isActive) {
      setErrors(prev => ({ ...prev, isActive: undefined }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (errors.role) {
      setErrors(prev => ({ ...prev, role: undefined }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
        <p className="text-sm text-gray-600">Create a new user account for your restaurant</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First Name & Last Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className={errors.firstName ? 'border-red-500' : ''}
              placeholder="Enter first name"
            />
            {errors.firstName && (
              <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className={errors.lastName ? 'border-red-500' : ''}
              placeholder="Enter last name"
            />
            {errors.lastName && (
              <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={errors.email ? 'border-red-500' : ''}
            placeholder="Enter email address"
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <Select
            id="role"
            value={formData.role}
            onChange={(e) => handleInputChange('role', e.target.value as UserRole)}
            className={errors.role ? 'border-red-500' : ''}
          >
            {assignableRoles.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
          {errors.role && (
            <p className="text-sm text-red-600 mt-1">{errors.role}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            className={errors.isActive ? 'border-red-500' : ''}
            placeholder="Enter password (min 8 characters)"
          />
          {errors.isActive && (
            <p className="text-sm text-red-600 mt-1">{errors.isActive}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password *
          </label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
            className={errors.role ? 'border-red-500' : ''}
            placeholder="Confirm password"
          />
          {errors.role && (
            <p className="text-sm text-red-600 mt-1">{errors.role}</p>
          )}
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating User...' : 'Create User'}
          </Button>
        </div>
      </form>
    </div>
  );
}
