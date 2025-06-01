import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const params = new URLSearchParams({
      page,
      limit,
      ...(search && { search }),
      ...(role && { role }),
    });

    const response = await fetch(`http://localhost:3001/api/admin/membership/members?${params}`, {
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
    console.error('获取会员列表失败:', error);
    return NextResponse.json(
      { message: '获取会员列表失败' },
      { status: 500 }
    );
  }
} 