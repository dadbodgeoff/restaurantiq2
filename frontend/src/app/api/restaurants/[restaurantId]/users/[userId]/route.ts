import { NextRequest, NextResponse } from 'next/server';

// GET /api/restaurants/[restaurantId]/users/[userId] - Get specific user details
export async function GET(
  request: NextRequest,
  { params }: { params: { restaurantId: string; userId: string } }
) {
  try {
    const { restaurantId, userId } = await params;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const backendResponse = await fetch(
      `${backendUrl}/api/v1/restaurants/${restaurantId}/users/${userId}`,
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
    console.error('Get user API error:', error);
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

// PUT /api/restaurants/[restaurantId]/users/[userId] - Update user details
export async function PUT(
  request: NextRequest,
  { params }: { params: { restaurantId: string; userId: string } }
) {
  try {
    const { restaurantId, userId } = await params;
    const body = await request.json();

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const backendResponse = await fetch(
      `${backendUrl}/api/v1/restaurants/${restaurantId}/users/${userId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': request.headers.get('x-correlation-id') || '',
          'Authorization': request.headers.get('authorization') || request.headers.get('Authorization') || '',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update user API error:', error);
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

// DELETE /api/restaurants/[restaurantId]/users/[userId] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { restaurantId: string; userId: string } }
) {
  try {
    const { restaurantId, userId } = await params;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const backendResponse = await fetch(
      `${backendUrl}/api/v1/restaurants/${restaurantId}/users/${userId}`,
      {
        method: 'DELETE',
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
    console.error('Delete user API error:', error);
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
