import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数中的openId
    const { searchParams } = new URL(request.url);
    const openId = searchParams.get('openId');

    if (!openId) {
      return NextResponse.json(
        { error: '缺少必要的openId参数' },
        { status: 400 }
      );
    }

    console.log('检查微信登录状态:', openId);

    // 调用后端API检查用户是否已存在
    const apiUrl = process.env.API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/auth/wechat/check-status?openId=${openId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`检查登录状态失败: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      isLoggedIn: data.exists,
      token: data.token,
      user: data.user
    });
  } catch (error) {
    console.error('检查微信登录状态失败:', error);
    return NextResponse.json(
      { error: '检查登录状态失败' },
      { status: 500 }
    );
  }
} 