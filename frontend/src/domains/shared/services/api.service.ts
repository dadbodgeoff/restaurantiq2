// frontend/src/domains/shared/services/api.service.ts
// Lightweight API client used by frontend services

'use client';

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

  constructor(baseUrl: string, logger?: LoggerService) {
    this.baseUrl = baseUrl;
    this.logger = logger ?? new LoggerService();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const correlationId = this.generateCorrelationId();

    // DEBUG: Log request details
    console.log(`🔵 API Request Starting:`, {
      url,
      method: options.method || 'GET',
      correlationId,
      baseUrl: this.baseUrl,
      endpoint,
      headers: options.headers,
      hasBody: !!options.body,
      windowDefined: typeof window !== 'undefined'
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': correlationId,
          ...options.headers,
        },
      });

      // DEBUG: Log response details
      console.log(`🟢 API Response Received:`, {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        correlationId,
        headers: Object.fromEntries(response.headers.entries())
      });

      const data = await response.json();

      // DEBUG: Log response data
      console.log(`📄 API Response Data:`, {
        url,
        success: data.success,
        hasData: !!data.data,
        hasError: !!data.error,
        correlationId: data.correlationId,
        dataKeys: data.data ? Object.keys(data.data) : [],
        errorCode: data.error?.code,
        errorMessage: data.error?.message
      });

      if (!response.ok) {
        console.error(`🔴 API Request Failed:`, {
          url,
          status: response.status,
          statusText: response.statusText,
          errorData: data,
          correlationId
        });
        
        this.logger.error('API Request Failed', new Error(data.error?.message || 'Request failed'), {
          correlationId,
          url,
          status: response.status,
          method: options.method || 'GET',
        });
        throw new Error(data.error?.message || 'Request failed');
      }

      this.logger.info('API Request Success', `${options.method || 'GET'} ${url}`, {
        correlationId,
        url,
        method: options.method || 'GET',
        status: response.status,
      });

      return data;
    } catch (error) {
      // Enhanced error logging for debugging
      console.error('🚨 API Request Failed:', {
        url,
        method: options.method || 'GET',
        correlationId,
        error: error,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
        fetchFailed: error?.message?.includes('Failed to fetch'),
        corsError: error?.message?.includes('CORS') || error?.toString?.()?.includes('CORS')
      });

      // Handle different types of errors properly
      const errorMessage = error instanceof Error 
        ? error.message 
        : (typeof error === 'string' ? error : 'Network request failed');
      
      const errorObj = error instanceof Error 
        ? error 
        : new Error(errorMessage);

      this.logger.error('API Request Error', errorObj, {
        correlationId,
        url,
        method: options.method || 'GET',
        originalError: error,
      });
      
      throw errorObj;
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
