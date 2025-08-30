// frontend/src/app/api/restaurants/[restaurantId]/prep/[date]/sync/route.ts
// Prep Sync API Route - POST sync prep from menu

import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string; date: string }> }
) {
  try {
    const { restaurantId, date } = await params;
    
    // Get authorization header from frontend request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: { message: 'No authorization header' } },
        { status: 401 }
      );
    }

    // Proxy to backend API
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const backendUrl = `${BACKEND_URL}/api/v1/restaurants/${restaurantId}/prep/${date}/sync`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(15000), // 15 second timeout for sync
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend prep sync API error:', errorText);
      return NextResponse.json(
        { success: false, error: { message: 'Failed to sync prep items from menu' } },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Prep sync API proxy error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
