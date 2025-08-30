import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// MANDATORY: Next.js API route structure
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string; itemId: string }> }
) {
  try {
    const { restaurantId, itemId } = await params; // MANDATORY: await params
    const authHeader = request.headers.get('Authorization'); // MANDATORY: Authorization header

    const body = await request.json();

    // MANDATORY: Proxy to backend
    const response = await fetch(`${BACKEND_URL}/api/v1/restaurants/${restaurantId}/menu/items/${itemId}/availability`, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update item availability API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'API_ERROR',
          message: 'Failed to update item availability'
        }
      },
      { status: 500 }
    );
  }
}
