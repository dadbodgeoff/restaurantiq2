import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// MANDATORY: Next.js API route structure
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string; itemId: string }> }
) {
  try {
    const { restaurantId, itemId } = await params; // MANDATORY: await params
    const authHeader = request.headers.get('Authorization'); // MANDATORY: Authorization header

    // MANDATORY: Proxy to backend
    const response = await fetch(`${BACKEND_URL}/api/v1/restaurants/${restaurantId}/menu/items/${itemId}/options`, {
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Get item options API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'API_ERROR',
          message: 'Failed to fetch item options'
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string; itemId: string }> }
) {
  try {
    const { restaurantId, itemId } = await params; // MANDATORY: await params
    const authHeader = request.headers.get('Authorization'); // MANDATORY: Authorization header

    const body = await request.json();

    // MANDATORY: Proxy to backend
    const response = await fetch(`${BACKEND_URL}/api/v1/restaurants/${restaurantId}/menu/items/${itemId}/options`, {
      method: 'POST',
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

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Create item option API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'API_ERROR',
          message: 'Failed to create item option'
        }
      },
      { status: 500 }
    );
  }
}
