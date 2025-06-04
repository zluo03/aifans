import { NextRequest, NextResponse } from 'next/server';
import { getClientAuthToken } from '@/lib/utils/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const token = await getClientAuthToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';
    const offset = searchParams.get('offset') || '0';

    const response = await fetch(
      `${BACKEND_URL}/api/users/messages/with/${params.userId}?limit=${limit}&offset=${offset}`, 
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
} 