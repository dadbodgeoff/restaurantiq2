import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route Template for RestaurantIQ
 *
 * Standardizes API route creation for all restaurant modules
 * Handles authentication, error handling, and backend proxying
 */
export class RestaurantApiRouteTemplate {
  private static getBackendUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  private static getAuthHeaders(request: NextRequest): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-correlation-id': request.headers.get('x-correlation-id') || '',
      'Authorization': request.headers.get('authorization') || '',
    };
  }

  static async proxyToBackend(
    request: NextRequest,
    backendPath: string,
    options: {
      method?: string;
      body?: any;
      restaurantId?: string;
    } = {}
  ) {
    try {
      const backendUrl = this.getBackendUrl();
      const method = options.method || request.method;
      const headers = this.getAuthHeaders(request);

      // If restaurantId is provided in options, use it; otherwise use from params
      const restaurantId = options.restaurantId || (request as any).params?.restaurantId;

      if (!restaurantId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MISSING_RESTAURANT_ID',
              message: 'Restaurant ID is required',
              correlationId: request.headers.get('x-correlation-id') || ''
            }
          },
          { status: 400 }
        );
      }

      const fullBackendPath = `/api/v1/restaurants/${restaurantId}${backendPath}`;

      const backendResponse = await fetch(`${backendUrl}${fullBackendPath}`, {
        method,
        headers,
        body: method !== 'GET' && options.body ? JSON.stringify(options.body) : undefined,
      });

      const data = await backendResponse.json();

      if (!backendResponse.ok) {
        return NextResponse.json(data, { status: backendResponse.status });
      }

      return NextResponse.json(data);
    } catch (error) {
      console.error('API route error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
            correlationId: request.headers.get('x-correlation-id') || ''
          }
        },
        { status: 500 }
      );
    }
  }

  /**
   * Standard error response template
   */
  static errorResponse(
    code: string,
    message: string,
    correlationId: string,
    status: number = 500
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code,
          message,
          correlationId
        }
      },
      { status }
    );
  }

  /**
   * Standard success response template
   */
  static successResponse(data: any, correlationId: string) {
    return NextResponse.json({
      success: true,
      data,
      correlationId
    });
  }
}

/**
 * USAGE EXAMPLES:
 *
 * // For a simple GET endpoint
 * export async function GET(request: NextRequest, { params }: any) {
 *   return RestaurantApiRouteTemplate.proxyToBackend(request, '/users');
 * }
 *
 * // For a POST endpoint with custom data
 * export async function POST(request: NextRequest, { params }: any) {
 *   const body = await request.json();
 *   return RestaurantApiRouteTemplate.proxyToBackend(request, '/users', {
 *     method: 'POST',
 *     body
 *   });
 * }
 */
