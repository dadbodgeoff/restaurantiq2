// Next.js API Route - Get Categories With Items for Import
// Proxies to backend API with authentication

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params;
    
    // Get authorization header from frontend request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: { message: 'Authorization header required' } },
        { status: 401 }
      );
    }

    // Proxy to backend API
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const backendUrl = `${BACKEND_URL}/api/v1/restaurants/${restaurantId}/menu/categories/with-items`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    console.error('Backend URL:', backendUrl);
    return NextResponse.json(
      { error: { message: 'Failed to fetch categories from backend' } },
      { status: 500 }
    );
  }
}
