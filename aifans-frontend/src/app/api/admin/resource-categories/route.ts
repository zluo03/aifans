import { NextRequest, NextResponse } from 'next/server';
import { baseUrl } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 401 }
      );
    }

    const token = authorization.startsWith('Bearer ') ? authorization : `Bearer ${authorization}`;
    const response = await fetch(`${baseUrl}/resource-categories`, {
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

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { message: '获取资源分类列表失败', error: error.message },
      { status: 500 }
    );
  }
}

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
    const body = await request.json();

    const response = await fetch(`${baseUrl}/resource-categories`, {
      method: 'POST',
      headers: {
        'Authorization': token,
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
    return NextResponse.json(
      { message: '创建资源分类失败', error: error.message },
      { status: 500 }
    );
  }
} 