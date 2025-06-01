import { NextRequest, NextResponse } from 'next/server';
import { createAuthHeaders, handleApiError } from '@/lib/utils/api-helpers';

// 获取后端 API 地址 - 完全使用环境变量，不设置默认值
const BACKEND_API = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest) {
  try {
    console.log('[API Route] 收到发送测试邮件请求');
    console.log('[API Route] 使用后端地址:', BACKEND_API);
    
    // 获取认证信息
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('[API Route] 发送测试邮件请求未提供认证信息');
      return NextResponse.json(
        { error: '未授权操作' },
        { status: 401 }
      );
    }
    
    // 获取请求数据
    const body = await request.json();
    if (!body.email) {
      console.error('[API Route] 发送测试邮件请求缺少邮箱地址');
      return NextResponse.json(
        { error: '请提供有效的邮箱地址' },
        { status: 400 }
      );
    }
    
    // 构建API URL - 确保URL路径正确
    const url = `${BACKEND_API}/admin/settings/mail/test`;
    console.log(`[API Route] 转发测试邮件请求到: ${url}, 邮箱: ${body.email}`);
    
    const headers: HeadersInit = createAuthHeaders(authHeader);
    
    // 发送请求到后端API
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    console.log(`[API Route] 接收到响应: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API Route] 发送测试邮件失败: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json(
        { 
          error: `发送测试邮件失败: ${response.status}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    let data;
    try {
      data = await response.json();
      console.log(`[API Route] 发送测试邮件成功:`, data);
    } catch (e) {
      console.warn('[API Route] 响应不是JSON格式:', e);
      data = { success: true, message: `测试邮件已发送到 ${body.email}，但响应不是JSON格式` };
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API Route] 处理发送测试邮件请求错误:', error);
    return handleApiError(error, '发送测试邮件失败');
  }
} 