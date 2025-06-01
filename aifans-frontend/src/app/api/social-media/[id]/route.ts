import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeader } from '@/lib/utils/api-helpers';
import { baseUrl } from '@/lib/utils/api-helpers';

export async function GET(
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

    const response = await fetch(`${baseUrl}/api/social-media/${params.id}`, {
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

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('获取社交媒体详情失败:', error);
    return NextResponse.json(
      { message: '获取详情失败', error: error.message },
      { status: 500 }
    );
  }
}

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

    const formData = await request.formData();

    const response = await fetch(`${baseUrl}/api/social-media/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': authHeader
      },
      body: formData
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 401 }
      );
    }

    const token = authorization.startsWith('Bearer ') ? authorization : `Bearer ${authorization}`;
    const response = await fetch(`${baseUrl}/api/social-media/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token,
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { message: '删除失败', error: error.message },
      { status: 500 }
    );
  }
} 