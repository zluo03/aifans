import { NextRequest, NextResponse } from 'next/server';

// 从请求中提取认证信息
function getAuthHeader(request: NextRequest): string | null {
  // 首先尝试从Authorization头获取
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    return authHeader;
  }
  
  // 然后尝试从cookie获取
  const token = request.cookies.get('token')?.value;
  if (token) {
    return `Bearer ${token}`;
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = getAuthHeader(request);
    console.log('API路由 - POST /api/payments/create-order - 认证头:', authHeader ? '存在' : '不存在');
    
    if (!authHeader) {
      console.error('API路由 - 创建支付订单失败: 未提供认证信息');
      return NextResponse.json(
        { message: '未授权，请先登录' },
        { status: 401 }
      );
    }

    const response = await fetch('http://localhost:3001/api/payments/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '创建支付订单失败' }));
      console.error(`API路由 - 创建支付订单失败: ${response.status} ${response.statusText}`, errorData);
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API路由 - 创建支付订单失败:', error);
    return NextResponse.json(
      { message: '创建支付订单失败' },
      { status: 500 }
    );
  }
} 