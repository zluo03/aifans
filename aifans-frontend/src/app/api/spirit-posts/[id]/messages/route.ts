import { NextRequest, NextResponse } from 'next/server';
import { baseUrl, checkAuth, createAuthHeaders, handleApiError } from '@/lib/utils/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const authorization = await checkAuth();
    
    const response = await fetch(`${baseUrl}/api/spirit-posts/${id}/messages`, {
      headers: createAuthHeaders(authorization),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, '获取灵贴消息失败');
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const authorization = await checkAuth();
    const body = await request.json();
    
    const response = await fetch(`${baseUrl}/api/spirit-posts/${id}/messages`, {
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
    return handleApiError(error, '发送灵贴消息失败');
  }
} 