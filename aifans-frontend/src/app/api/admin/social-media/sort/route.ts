import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeader } from '@/lib/utils/api-helpers';
import { baseUrl } from '@/lib/utils/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const authHeader = getAuthHeader();
    if (!authHeader) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await fetch(`${baseUrl}/api/admin/social-media/sort`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    return NextResponse.json(
      { message: '排序更新成功' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('更新社交媒体排序失败:', error);
    return NextResponse.json(
      { message: '更新排序失败', error: error.message },
      { status: 500 }
    );
  }
} 