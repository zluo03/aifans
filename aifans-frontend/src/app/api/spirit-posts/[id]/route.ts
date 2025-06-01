import { NextRequest, NextResponse } from 'next/server';
import { baseUrl, checkAuth, createAuthHeaders, handleApiError } from '@/lib/utils/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const authorization = await checkAuth();
    
    const response = await fetch(`${baseUrl}/api/spirit-posts/${id}`, {
      headers: createAuthHeaders(authorization),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, '获取灵贴详情失败');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const authorization = await checkAuth();
    const body = await request.json();
    
    const response = await fetch(`${baseUrl}/api/spirit-posts/${id}`, {
      method: 'PATCH',
      headers: createAuthHeaders(authorization),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, '更新灵贴失败');
  }
} 