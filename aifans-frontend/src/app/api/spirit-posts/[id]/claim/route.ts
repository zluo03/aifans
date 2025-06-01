import { NextRequest, NextResponse } from 'next/server';
import { baseUrl, checkAuth, createAuthHeaders, handleApiError } from '@/lib/utils/api-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const authorization = await checkAuth();
    
    const response = await fetch(`${baseUrl}/api/spirit-posts/${id}/claim`, {
      method: 'POST',
      headers: createAuthHeaders(authorization),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, '认领灵贴失败');
  }
}