import { ApiService } from '../../shared/services/api.service';
import { LoginRequest, RegisterRequest, AuthTokens, User } from './auth.service';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  correlationId: string;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export class AuthApiService {
  constructor(private readonly apiService: ApiService) {}

  async login(request: LoginRequest): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    return this.apiService.post('/auth/login', request);
  }

  async register(request: RegisterRequest): Promise<ApiResponse<User>> {
    return this.apiService.post('/auth/register', request);
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    return this.apiService.post('/auth/logout', {});
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
    return this.apiService.post('/auth/refresh', { refreshToken });
  }

  async forgotPassword(email: string, restaurantId: string): Promise<ApiResponse<{ message: string }>> {
    return this.apiService.post('/auth/forgot-password', { email, restaurantId });
  }

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.apiService.post('/auth/reset-password', { token, newPassword });
  }
}
