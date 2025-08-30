import { NextRequest, NextResponse } from 'next/server';

// GET /api/restaurants/[restaurantId]/roles - Get available roles and assignment permissions
export async function GET(
  request: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const { restaurantId } = await params;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const backendResponse = await fetch(
      `${backendUrl}/api/v1/restaurants/${restaurantId}/roles`,
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
    console.error('Roles API error:', error);
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
