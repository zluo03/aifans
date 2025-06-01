import { NextRequest, NextResponse } from 'next/server';
import { baseUrl, checkAuth, createAuthHeaders, handleApiError } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const authorization = await checkAuth();
    
    const response = await fetch(`${baseUrl}/api/spirit-posts`, {
      headers: createAuthHeaders(authorization),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, '获取灵贴列表失败');
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorization = await checkAuth();
    const body = await request.json();
    
    const response = await fetch(`${baseUrl}/api/spirit-posts`, {
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
    return handleApiError(error, '创建灵贴失败');
  }
} 