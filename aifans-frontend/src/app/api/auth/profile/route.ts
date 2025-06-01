import { NextRequest, NextResponse } from 'next/server';

/**
 * 用户资料API路由
 * GET /api/auth/profile
 */
export async function GET(request: NextRequest) {
  try {
    // 从请求头获取token
    const authHeader = request.headers.get('authorization');
    
    console.log('收到获取用户信息请求，token:', authHeader ? '存在' : '不存在');
    
    if (!authHeader) {
      return NextResponse.json({ error: '未授权，缺少token' }, { status: 401 });
    }

    // 提取token
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;
    
    if (!token) {
      return NextResponse.json({ error: '未授权，token格式错误' }, { status: 401 });
    }
    
    // 获取API基础URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // 转发请求到后端API
    console.log('转发请求到后端API:', `${apiUrl}/api/auth/profile`);
    
    const response = await fetch(`${apiUrl}/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader, // 使用原始认证头
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      cache: 'no-store'
    });
    
    console.log('后端API响应状态:', response.status);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: '获取用户信息失败', status: response.status }, 
        { status: response.status }
      );
    }

    // 返回用户数据
    const user = await response.json();
    
    // 头像URL处理已移至前端组件，使用代理URL方案
    
    // 删除微信相关字段，统一使用标准头像字段
    if (user.isWechatUser) {
      // 记录信息但不使用微信头像
      console.log('微信用户信息:', {
        isWechatUser: user.isWechatUser,
        wechatAvatar: user.wechatAvatar ? '存在' : '不存在'
      });
    }
    
    console.log('成功获取用户信息:', {
      id: user.id,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl ? '已设置' : '未设置'
    });
    
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('处理profile请求时出错:', error);
    return NextResponse.json(
      { error: '服务器内部错误', message: error.message }, 
      { status: 500 }
    );
  }
} 