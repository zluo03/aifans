import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/api-helpers';

// 获取后端 API 地址
const BACKEND_API = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest) {
  try {
    console.log('[API Route] 收到直接保存邮件配置请求');
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
      console.error(`[API Route] 直接保存邮件配置失败: ${response.status} ${response.statusText}`);
      let errorText = '';
      try {
        errorText = await response.text();
        console.error(`[API Route] 错误详情: ${errorText}`);
      } catch (e) {
        console.error('[API Route] 无法读取错误响应内容');
      }
      
      return NextResponse.json(
        { 
          error: `直接保存邮件配置失败: ${response.status}`, 
          details: errorText
        },
        { status: response.status }
      );
    }

    let data;
    try {
      data = await response.json();
      console.log(`[API Route] 直接保存邮件配置成功:`, data);
    } catch (e) {
      console.warn('[API Route] 响应不是JSON格式:', e);
      data = { success: true, message: '邮件配置已直接保存，但响应不是JSON格式' };
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API Route] 处理直接保存邮件配置请求错误:', error);
    return handleApiError(error, '直接保存邮件配置失败');
  }
} 