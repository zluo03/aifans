import { NextRequest, NextResponse } from 'next/server';
import { baseUrl, createAuthHeaders, handleApiError } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest) {
  try {
    console.log('[API Route] 收到获取活跃公告列表请求');
    
    // 构建API URL
    const url = `${baseUrl}/api/announcements/active`;
    console.log(`[API Route] 转发请求到: ${url}`);
    
    // 获取认证信息
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = createAuthHeaders(authHeader || '');
    
    console.log('[API Route] 请求头:', {
      hasAuth: !!authHeader,
      contentType: headers['Content-Type']
    });
    
    const response = await fetch(url, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`[API Route] 获取活跃公告列表失败: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      return NextResponse.json(
        { error: `获取活跃公告列表失败: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[API Route] 获取活跃公告列表成功: ${data.length}条记录`);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API Route] 处理活跃公告列表请求错误:', error);
    return handleApiError(error, '获取活跃公告列表失败');
  }
} 