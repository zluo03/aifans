import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    const response = await fetch(`${BACKEND_URL}/api/creators/user/${userId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return new Response(null);
      }
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    if (!data) {
      return new Response(null);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching creator by userId:', error);
    return new Response(null);
  }
} 