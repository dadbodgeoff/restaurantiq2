// Next.js API Route - Import Categories to Weekly Menu
// Proxies to backend API with authentication

import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const { restaurantId } = params;
    
    // Get authorization header from frontend request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: { message: 'Authorization header required' } },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();

    // Proxy to backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/restaurants/${restaurantId}/menu/weekly-menus/import-categories`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
