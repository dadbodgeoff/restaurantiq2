import { NextRequest, NextResponse } from 'next/server';

// POST /api/restaurants/[restaurantId]/users/[userId]/reset-password - Reset user password
export async function POST(
  request: NextRequest,
  { params }: { params: { restaurantId: string; userId: string } }
) {
  try {
    const { restaurantId, userId } = await params;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const backendResponse = await fetch(
      `${backendUrl}/api/v1/restaurants/${restaurantId}/users/${userId}/reset-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': request.headers.get('x-correlation-id') || '',
          'Authorization': request.headers.get('authorization') || request.headers.get('Authorization') || '',
        },
        body: JSON.stringify({}), // Empty body as per backend expectation
      }
    );

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Reset password API error:', error);
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
