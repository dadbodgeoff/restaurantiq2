import { NextRequest, NextResponse } from 'next/server';

// PUT /api/restaurants/[restaurantId]/users/[userId]/role - Update user role
export async function PUT(
  request: NextRequest,
  { params }: { params: { restaurantId: string; userId: string } }
) {
  try {
    const { restaurantId, userId } = await params;
    const body = await request.json();

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const backendResponse = await fetch(
      `${backendUrl}/api/v1/restaurants/${restaurantId}/users/${userId}/role`,
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
    console.error('Update user role API error:', error);
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
