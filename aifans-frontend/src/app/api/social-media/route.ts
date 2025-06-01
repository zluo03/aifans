import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeader } from '@/lib/utils/api-helpers';
import { baseUrl } from '@/lib/utils/api-helpers';

// 创建社交媒体
export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 401 }
      );
    }

    const token = authorization.startsWith('Bearer ') ? authorization : `Bearer ${authorization}`;
    const formData = await request.formData();

    const response = await fetch(`${baseUrl}/api/social-media`, {
      method: 'POST',
      headers: {
        'Authorization': token
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
    console.error('创建社交媒体失败:', error);
    return NextResponse.json(
      { message: '创建失败', error: error.message },
      { status: 500 }
    );
  }
}

// 获取社交媒体列表（管理员）
export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthHeader();
    if (!authHeader) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 401 }
      );
    }

    const response = await fetch(`${baseUrl}/api/social-media/admin`, {
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
    console.error('获取社交媒体列表失败:', error);
    return NextResponse.json(
      { message: '获取列表失败', error: error.message },
      { status: 500 }
    );
  }
} 