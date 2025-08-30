import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// MANDATORY: Next.js API route structure
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params; // MANDATORY: await params
    const authHeader = request.headers.get('Authorization'); // MANDATORY: Authorization header

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';

    // MANDATORY: Proxy to backend
    const response = await fetch(`${BACKEND_URL}/api/v1/restaurants/${restaurantId}/menu/items?page=${page}&limit=${limit}`, {
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
    console.error('Menu items API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'API_ERROR',
          message: 'Failed to fetch menu items'
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params; // MANDATORY: await params
    const authHeader = request.headers.get('Authorization'); // MANDATORY: Authorization header

    const body = await request.json();

    // MANDATORY: Proxy to backend
    const response = await fetch(`${BACKEND_URL}/api/v1/restaurants/${restaurantId}/menu/items`, {
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
    console.error('Create menu item API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'API_ERROR',
          message: 'Failed to create menu item'
        }
      },
      { status: 500 }
    );
  }
}
