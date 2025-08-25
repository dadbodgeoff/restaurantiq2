'use client';

// useState not needed in this component
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/domains/auth/components/LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const handleLogin = async (email: string, password: string, restaurantId?: string) => {
    try {
      const result = await login(email, password, restaurantId);

      // If restaurant selection is required, let the form handle it
      if (result.requiresRestaurantSelection) {
        return result;
      }

      // Successful login - redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      // Error handling following your backend patterns
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to RestaurantIQ
          </h2>
        </div>
        <LoginForm onSubmit={handleLogin} />
      </div>
    </div>
  );
}
