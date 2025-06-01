import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`http://localhost:3001/api/admin/membership/products`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        ...(request.headers.get('authorization') ? { 'Authorization': request.headers.get('authorization')! } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('获取会员产品失败:', error);
    return NextResponse.json(
      { message: '获取会员产品失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`http://localhost:3001/api/admin/membership/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
        ...(request.headers.get('authorization') ? { 'Authorization': request.headers.get('authorization')! } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('创建会员产品失败:', error);
    return NextResponse.json(
      { message: '创建会员产品失败' },
      { status: 500 }
    );
  }
} 