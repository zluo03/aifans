import { NextRequest, NextResponse } from 'next/server';
import { baseUrl, checkAuth, createAuthHeaders, handleApiError } from '@/lib/utils/api-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; receiverId: string } }
) {
  try {
    const { id, receiverId } = params;
    const authorization = await checkAuth();
    const body = await request.json();
    
    const response = await fetch(`${baseUrl}/api/spirit-posts/${id}/messages/reply/${receiverId}`, {
      method: 'POST',
      headers: createAuthHeaders(authorization),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, '回复灵贴消息失败');
  }
} 