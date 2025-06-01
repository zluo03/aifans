import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeader } from '@/lib/utils/api-helpers';
import { baseUrl } from '@/lib/utils/api-helpers';

// 删除社交媒体
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = getAuthHeader();
    if (!authHeader) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 401 }
      );
    }

    const response = await fetch(`${baseUrl}/api/admin/social-media/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    return NextResponse.json(
      { message: '删除成功' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('删除社交媒体失败:', error);
    return NextResponse.json(
      { message: '删除失败', error: error.message },
      { status: 500 }
    );
  }
}

// 更新社交媒体
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = getAuthHeader();
    if (!authHeader) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await fetch(`${baseUrl}/api/admin/social-media/${params.id}`, {
      method: 'PATCH',
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

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('更新社交媒体失败:', error);
    return NextResponse.json(
      { message: '更新失败', error: error.message },
      { status: 500 }
    );
  }
} 