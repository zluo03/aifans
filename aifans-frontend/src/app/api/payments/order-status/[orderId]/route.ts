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

export async function GET(request: NextRequest, context: { params: { orderId: string } }) {
  try {
    const { params } = context;
    const orderId = params?.orderId;
    const authHeader = getAuthHeader(request);
    console.log(`API路由 - GET /api/payments/order-status/${orderId} - 认证头:`, authHeader ? '存在' : '不存在');
    
    if (!authHeader) {
      console.error('API路由 - 获取订单状态失败: 未提供认证信息');
      return NextResponse.json(
        { message: '未授权，请先登录' },
        { status: 401 }
      );
    }

    const response = await fetch(`http://localhost:3001/api/payments/order-status/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      console.error(`API路由 - 获取订单状态失败: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { message: '获取订单状态失败' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API路由 - 获取订单状态失败:', error);
    return NextResponse.json(
      { message: '获取订单状态失败' },
      { status: 500 }
    );
  }
} 