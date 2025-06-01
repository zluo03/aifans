import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    console.log('收到微信验证码验证请求:', { code });

    if (!code) {
      console.log('验证码为空，返回400错误');
      return NextResponse.json({ success: false, message: '验证码不能为空' }, { status: 400 });
    }

    // 获取后端API地址
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
    console.log('使用后端API地址:', backendUrl);
    
    // 调用后端API验证验证码
    console.log('准备发送验证请求到后端:', `${backendUrl}/api/auth/wechat/verify-code`);
    
    try {
      const response = await fetch(`${backendUrl}/api/auth/wechat/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      });

      console.log('后端API响应状态码:', response.status);
      
      // 读取原始响应文本
      const responseText = await response.text();
      console.log('后端API原始响应:', responseText);
      
      // 尝试解析JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('解析后的响应数据:', data);
      } catch (parseError) {
        console.error('解析响应JSON失败:', parseError);
        return NextResponse.json(
          { success: false, message: '服务器返回的数据格式无效' },
          { status: 500 }
        );
      }
      
      if (!response.ok) {
        console.error('后端API返回错误:', response.status, response.statusText, data);
        return NextResponse.json(
          { success: false, message: data.message || '验证服务暂时不可用，请稍后重试' },
          { status: response.status }
        );
      }

      // 检查返回的数据是否完整
      if (data.success && data.token) {
        console.log('验证成功，返回token和用户数据');
        // 确保返回成功
        return NextResponse.json(data);
      } else if (data.success) {
        console.error('后端返回成功，但缺少token:', data);
        return NextResponse.json(
          { success: false, message: '验证成功但缺少令牌信息，请联系管理员' },
          { status: 500 }
        );
      } else {
        console.log('后端验证失败:', data.message);
        return NextResponse.json(data);
      }
    } catch (fetchError) {
      console.error('请求后端API失败:', fetchError);
      return NextResponse.json(
        { success: false, message: '连接验证服务失败，请检查网络连接' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('验证码验证失败，详细错误:', error);
    return NextResponse.json(
      { success: false, message: '验证失败，请重试' },
      { status: 500 }
    );
  }
} 