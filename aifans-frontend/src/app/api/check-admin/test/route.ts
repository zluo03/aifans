import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 收集环境信息
    const envInfo = {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '未设置',
      NODE_ENV: process.env.NODE_ENV || '未设置',
      VERCEL_ENV: process.env.VERCEL_ENV || '未设置',
      // 不要包含敏感信息，如密钥等
    };
    
    // 收集请求信息
    const requestInfo = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      cookies: Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value])),
    };
    
    // 隐藏敏感信息
    if (requestInfo.headers.authorization) {
      requestInfo.headers.authorization = '******';
    }
    
    if (requestInfo.cookies['auth-storage']) {
      requestInfo.cookies['auth-storage'] = '******';
    }
    
    return NextResponse.json({
      status: 'success',
      message: '测试端点正常工作',
      timestamp: new Date().toISOString(),
      environment: envInfo,
      request: requestInfo,
    });
  } catch (error) {
    console.error('测试端点错误:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: '测试端点出错',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 