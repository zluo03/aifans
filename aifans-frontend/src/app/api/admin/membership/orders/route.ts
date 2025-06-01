import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';

    const params = new URLSearchParams({
      page,
      limit,
      ...(search && { search }),
    });

    const response = await fetch(`http://localhost:3001/api/admin/membership/orders?${params}`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('获取订单列表失败:', error);
    return NextResponse.json(
      { message: '获取订单列表失败' },
      { status: 500 }
    );
  }
} 