import { NextRequest, NextResponse } from 'next/server';

// GET /api/restaurants/[restaurantId]/users - List users for a restaurant
export async function GET(
  request: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const { restaurantId } = await params;
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    // Build backend URL with query parameters
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(role && { role }),
      ...(isActive && { isActive }),
      ...(search && { search }),
    });

    const backendResponse = await fetch(
      `${backendUrl}/api/v1/restaurants/${restaurantId}/users?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': request.headers.get('x-correlation-id') || '',
          'Authorization': request.headers.get('authorization') || request.headers.get('Authorization') || '',
        },
      }
    );

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Users API error:', error);
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

// POST /api/restaurants/[restaurantId]/users - Create a new user
export async function POST(
  request: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const { restaurantId } = await params;
    const body = await request.json();

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const backendResponse = await fetch(`${backendUrl}/api/v1/restaurants/${restaurantId}/users`, {
      method: 'POST',
              headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': request.headers.get('x-correlation-id') || '',
          'Authorization': request.headers.get('authorization') || request.headers.get('Authorization') || '',
        },
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Create user API error:', error);
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
