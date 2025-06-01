import { NextRequest, NextResponse } from 'next/server';
import { createAuthHeaders, handleApiError } from '@/lib/utils/api-helpers';

// 这是一个临时的测试API端点，用于直接测试与后端API的连接
export async function GET(request: NextRequest) {
  console.log('===== 开始直接API测试 =====');
  console.log('baseUrl:', baseUrl);
  
  try {
    // 测试直接调用后端API
    const directUrl = 'http://localhost:3001/api/admin/settings/mail';
    console.log(`尝试直接访问: ${directUrl}`);
    
    const directResponse = await fetch(directUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log(`直接访问响应: ${directResponse.status} ${directResponse.statusText}`);
    const directText = await directResponse.text();
    console.log('直接访问响应内容:', directText);
    
    // 测试通过baseUrl调用后端API
    const baseUrlPath = `${baseUrl}/admin/settings/mail`;
    console.log(`尝试通过baseUrl访问: ${baseUrlPath}`);
    
    const baseUrlResponse = await fetch(baseUrlPath, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    console.log(`baseUrl访问响应: ${baseUrlResponse.status} ${baseUrlResponse.statusText}`);
    const baseUrlText = await baseUrlResponse.text();
    console.log('baseUrl访问响应内容:', baseUrlText);
    
    return NextResponse.json({
      message: '测试完成，请查看控制台日志',
      directTest: {
        url: directUrl,
        status: directResponse.status,
        response: directText,
      },
      baseUrlTest: {
        url: baseUrlPath,
        status: baseUrlResponse.status,
        response: baseUrlText,
      },
    });
  } catch (error: any) {
    console.error('API测试错误:', error);
    return NextResponse.json(
      { 
        error: '测试失败', 
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

// 获取后端 API 地址
const BACKEND_API = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest) {
  try {
    console.log('[API Route] 收到测试直接保存邮件配置请求');
    console.log('[API Route] 使用后端地址:', BACKEND_API);
    
    // 获取请求数据
    const body = await request.json();
    console.log('[API Route] 请求数据:', {
      host: body.host,
      port: body.port,
      secure: body.secure,
      user: body.user,
      from: body.from,
      // 不打印密码
    });
    
    // 构建API URL - 直接访问后端服务的端点
    const url = `${BACKEND_API}/admin/settings/mail/direct-save`;
    console.log(`[API Route] 转发请求到: ${url}`);
    
    // 这个端点不需要认证头
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    console.log(`[API Route] 接收到响应: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`[API Route] 测试直接保存邮件配置失败: ${response.status} ${response.statusText}`);
      let errorText = '';
      try {
        errorText = await response.text();
        console.error(`[API Route] 错误详情: ${errorText}`);
      } catch (e) {
        console.error('[API Route] 无法读取错误响应内容');
      }
      
      return NextResponse.json(
        { 
          error: `测试直接保存邮件配置失败: ${response.status}`, 
          details: errorText
        },
        { status: response.status }
      );
    }

    let data;
    try {
      data = await response.json();
      console.log(`[API Route] 测试直接保存邮件配置成功:`, data);
    } catch (e) {
      console.warn('[API Route] 响应不是JSON格式:', e);
      data = { success: true, message: '邮件配置已直接保存，但响应不是JSON格式' };
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API Route] 处理测试直接保存邮件配置请求错误:', error);
    return handleApiError(error, '测试直接保存邮件配置失败');
  }
} 