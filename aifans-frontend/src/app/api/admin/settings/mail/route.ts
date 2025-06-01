import { NextRequest, NextResponse } from 'next/server';
import { createAuthHeaders, handleApiError } from '@/lib/utils/api-helpers';

// 获取后端 API 地址 - 完全使用环境变量
const BACKEND_API = process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: NextRequest) {
  try {
    console.log('[API Route] 收到获取邮件配置请求');
    console.log('[API Route] 使用固定后端地址:', BACKEND_API);
    
    // 获取认证信息
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('[API Route] 获取邮件配置请求未提供认证信息');
      return NextResponse.json(
        { error: '未授权操作' },
        { status: 401 }
      );
    }
    
    // 构建API URL
    const url = `${BACKEND_API}/admin/settings/mail`;
    console.log(`[API Route] 转发请求到: ${url}`);
    
    const headers: HeadersInit = createAuthHeaders(authHeader);
    
    const response = await fetch(url, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`[API Route] 获取邮件配置失败: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`[API Route] 错误详情: ${errorText}`);
      return NextResponse.json(
        { error: `获取邮件配置失败: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[API Route] 获取邮件配置成功:`, data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API Route] 处理邮件配置请求错误:', error);
    return handleApiError(error, '获取邮件配置失败');
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API Route] 收到保存邮件配置请求');
    console.log('[API Route] 使用固定后端地址:', BACKEND_API);
    
    // 获取认证信息
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('[API Route] 保存邮件配置请求未提供认证信息');
      return NextResponse.json(
        { error: '未授权操作' },
        { status: 401 }
      );
    }
    
    console.log('[API Route] 认证头信息:', authHeader ? `Bearer ${authHeader.substring(7, 15)}...` : '无');
    
    // 获取请求数据
    const body = await request.json();
    
    // 构建API URL
    const url = `${BACKEND_API}/admin/settings/mail`;
    console.log(`[API Route] 转发请求到: ${url}, 数据:`, {
      host: body.host,
      port: body.port,
      secure: body.secure,
      user: body.user,
      from: body.from,
      // 不打印密码
    });
    
    const headers: HeadersInit = createAuthHeaders(authHeader);
    console.log('[API Route] 生成的请求头:', {
      'Content-Type': headers['Content-Type'] || '未设置',
      'Authorization': headers['Authorization'] ? `Bearer ${headers['Authorization'].toString().substring(7, 15)}...` : '无'
    });
    
    console.log('[API Route] 开始发送请求到后端...');
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    console.log(`[API Route] 接收到响应: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`[API Route] 保存邮件配置失败: ${response.status} ${response.statusText}`);
      let errorText = '';
      try {
        errorText = await response.text();
        console.error(`[API Route] 错误详情: ${errorText}`);
      } catch (e) {
        console.error('[API Route] 无法读取错误响应内容');
      }
      
      return NextResponse.json(
        { 
          error: `保存邮件配置失败: ${response.status}`, 
          details: errorText
        },
        { status: response.status }
      );
    }

    let data;
    try {
      data = await response.json();
      console.log(`[API Route] 保存邮件配置成功:`, data);
      
      // 额外验证 - 尝试立即获取配置
      console.log('[API Route] 额外验证 - 尝试立即获取配置');
      const verifyResponse = await fetch(`${BACKEND_API}/admin/settings/mail`, {
        headers,
        cache: 'no-store',
      });
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log('[API Route] 验证获取成功:', {
          host: verifyData.host,
          port: verifyData.port,
          user: verifyData.user,
          // 不打印敏感信息
        });
      } else {
        console.error('[API Route] 验证获取失败:', verifyResponse.status);
      }
    } catch (e) {
      console.warn('[API Route] 响应不是JSON格式:', e);
      data = { success: true, message: '邮件配置已保存，但响应不是JSON格式' };
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API Route] 处理保存邮件配置请求错误:', error);
    return handleApiError(error, '保存邮件配置失败');
  }
} 