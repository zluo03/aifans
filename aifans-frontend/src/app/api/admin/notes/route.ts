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
    const { searchParams } = new URL(request.url);
    
    // 构建后端API URL
    const backendUrl = new URL('/api/admin/notes', baseUrl);
    
    // 转发所有查询参数
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    const response = await fetch(backendUrl.toString(), {
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
      { message: '获取笔记列表失败', error: error.message },
      { status: 500 }
    );
  }
} 