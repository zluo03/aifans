import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    // 转发请求到后端
    const response = await fetch(`${BACKEND_URL}/api/auth/captcha`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API Route] 获取验证码失败:', response.status, errorText);
      
      return NextResponse.json(
        { message: '获取验证码失败' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // 返回验证码数据
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('[API Route] 验证码处理错误:', error);
    return NextResponse.json(
      { message: '服务器内部错误', error: String(error) },
      { status: 500 }
    );
  }
} 