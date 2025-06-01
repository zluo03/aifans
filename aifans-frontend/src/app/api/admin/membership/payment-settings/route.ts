import { NextRequest, NextResponse } from 'next/server';

function extractToken(request: NextRequest) {
  // 1. 优先从Authorization头获取token
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  // 2. 没有再尝试cookie
  const cookie = request.headers.get('cookie') || '';
  try {
    const authData = cookie.split(';').find(c => c.trim().startsWith('auth-storage='));
    if (authData) {
      const decoded = decodeURIComponent(authData.split('=')[1]);
      const parsed = JSON.parse(decoded);
      return parsed?.state?.token || parsed?.state?.state?.token || parsed?.token || '';
    }
  } catch {}
  return '';
}

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`http://localhost:3001/api/admin/membership/payment-settings`, {
      headers,
    });
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { message: '获取支付设置失败', error: errorText, status: response.status },
        { status: response.status }
      );
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: '获取支付设置失败', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const token = extractToken(request);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`http://localhost:3001/api/admin/membership/payment-settings`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { message: '更新支付设置失败', error: errorText, status: response.status },
        { status: response.status }
      );
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: '更新支付设置失败', error: error.message },
      { status: 500 }
    );
  }
} 