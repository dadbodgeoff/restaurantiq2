// frontend/src/app/api/restaurants/[restaurantId]/prep/presets/[dayOfWeek]/load/route.ts
// Prep Preset Load API Route - GET load preset

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string; dayOfWeek: string }> }
) {
  try {
    const { restaurantId, dayOfWeek } = await params;
    
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
    const backendUrl = `${BACKEND_URL}/api/v1/restaurants/${restaurantId}/prep/presets/${dayOfWeek}/load`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend preset load API error:', errorText);
      return NextResponse.json(
        { success: false, error: { message: 'Failed to load preset from backend' } },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Preset load API proxy error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

