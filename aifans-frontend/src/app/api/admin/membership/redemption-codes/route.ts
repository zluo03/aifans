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

    const auth = request.headers.get('authorization') || '';
    const response = await fetch(`http://localhost:3001/api/admin/membership/redemption-codes?${params}`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        ...(auth ? { 'Authorization': auth } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('获取兑换码列表失败:', error);
    return NextResponse.json(
      { message: '获取兑换码列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const auth = request.headers.get('authorization') || '';
    const response = await fetch(`http://localhost:3001/api/admin/membership/redemption-codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
        ...(auth ? { 'Authorization': auth } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('生成兑换码失败:', error);
    return NextResponse.json(
      { message: '生成兑换码失败' },
      { status: 500 }
    );
  }
} 