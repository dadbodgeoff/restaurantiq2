import { container } from '../../../lib/container';
import { LoggerService } from '../../../infrastructure/logging/logger.service';

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

export class ApiService {
  private baseUrl: string;
  private logger: LoggerService;

  constructor() {
    this.baseUrl = container.resolve('apiBaseUrl') as string;
    this.logger = container.resolve('loggerService') as LoggerService;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const correlationId = this.generateCorrelationId();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': correlationId,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API Request Failed', data.error?.message || 'Request failed', {
          correlationId,
          url,
          status: response.status,
          method: options.method || 'GET',
        });
        throw new Error(data.error?.message || 'Request failed');
      }

      console.log(`API Request Success: ${options.method || 'GET'} ${url}`, {
        correlationId,
        url,
        method: options.method || 'GET',
        status: response.status,
      });

      return data;
    } catch (error) {
      console.error('API Request Error', error, {
        correlationId,
        url,
        method: options.method || 'GET',
      });
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  private generateCorrelationId(): string {
    return `frontend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
