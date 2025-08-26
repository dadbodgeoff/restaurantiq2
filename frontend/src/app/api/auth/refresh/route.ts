import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    // Use your actual backend URL (port 3000)
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const backendResponse = await fetch(`${backendUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': request.headers.get('x-correlation-id') || '',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    // Return the response from your backend
    return NextResponse.json(data);
  } catch (error) {
    console.error('Refresh API error:', error);
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
