import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    console.log('[API Route] 收到登录请求');
    console.log('[API Route] 使用后端URL:', BACKEND_URL);
    
    // 解析请求体
    let body;
    try {
      body = await request.json();
      console.log('[API Route] 登录请求数据:', {
        login: body.login, 
        captchaId: body.captchaId,
        captcha: body.captcha,
        passwordProvided: !!body.password
      });
    } catch (parseError) {
      console.error('[API Route] 解析请求体失败:', parseError);
      return NextResponse.json(
        { message: '无效的请求数据' },
        { status: 400 }
      );
    }
    
    // 验证必要字段
    if (!body.login || !body.password) {
      console.error('[API Route] 缺少必要的登录字段');
      return NextResponse.json(
        { message: '请提供用户名/邮箱和密码' },
        { status: 400 }
      );
    }
    
    // 开发环境下的特殊处理
    if (process.env.NODE_ENV === 'development') {
      // 如果没有提供验证码，使用默认值
      if (!body.captcha) {
        console.log('[API Route] 开发环境下使用默认验证码');
        body.captcha = '1234';
      }
      
      // 如果没有提供验证码ID，使用默认值
      if (!body.captchaId) {
        console.log('[API Route] 开发环境下使用默认验证码ID');
        body.captchaId = 'dev-captcha-id';
      }
    }
    
    // 构建API URL
    const apiUrl = `${BACKEND_URL}/api/auth/login`;
    console.log('[API Route] 转发登录请求到:', apiUrl);
    
    // 构建请求头
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    console.log('[API Route] 请求头:', Object.keys(headers));
    
    try {
      // 转发请求到后端
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        // 不设置credentials: 'include'，避免CORS问题
      });
      
      console.log('[API Route] 登录响应状态:', response.status, response.statusText);
      
      // 添加原始响应内容的日志
      const responseText = await response.text();
      console.log('[API Route] 原始响应内容:', responseText);
      
      let responseData: any;
      try {
        // 尝试解析JSON
        responseData = JSON.parse(responseText);
        console.log('[API Route] 解析后的响应数据:', responseData);
      } catch (e) {
        console.error('[API Route] 解析响应JSON失败:', e);
        console.log('[API Route] 无法解析的响应文本:', responseText);
        responseData = { message: '服务器返回的数据格式无效' };
      }

      if (!response.ok) {
        console.error('[API Route] 登录失败:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
        
        return NextResponse.json(
          responseData,
          { status: response.status }
        );
      }
      
      // 检查响应数据
      if (!responseData.token || !responseData.user) {
        console.error('[API Route] 登录响应缺少必要数据:', responseData);
        return NextResponse.json(
          { message: '服务器返回的数据无效，缺少token或用户信息' },
          { status: 500 }
        );
      }
      
      console.log('[API Route] 登录成功，用户:', responseData.user.username);
      
      // 设置响应头，确保不会被缓存
      const responseHeaders = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      // 登录成功
      return NextResponse.json(responseData, {
        headers: responseHeaders
      });
    } catch (fetchError) {
      console.error('[API Route] 请求后端API失败:', fetchError);
      return NextResponse.json(
        { message: '连接服务器失败，请检查网络连接或服务器状态' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('[API Route] 登录处理错误:', error);
    return NextResponse.json(
      { message: '服务器内部错误', error: String(error) },
      { status: 500 }
    );
  }
} 