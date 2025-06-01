import { NextRequest, NextResponse } from 'next/server';
import { baseUrl, checkAuth, createAuthHeaders, handleApiError } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const authorization = await checkAuth();
    
    const response = await fetch(`${baseUrl}/api/spirit-posts/my-claims`, {
      headers: createAuthHeaders(authorization),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, '获取我认领的灵贴失败');
  }
} 