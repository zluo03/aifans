import { NextRequest, NextResponse } from 'next/server';
import { baseUrl, createAuthHeaders } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest) {
  try {
    console.log('[API Route] 收到获取灵贴未读消息数量请求');
    
    // 获取认证信息
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('[API Route] 未提供认证信息，返回默认值');
      // 未登录时直接返回空数据，不报错
      return NextResponse.json({ total: 0, myPosts: 0, myClaims: 0 });
    }
    
    const headers: HeadersInit = createAuthHeaders(authHeader);
    
    try {
      // 转发请求到后端
      console.log(`[API Route] 转发请求到: ${baseUrl}/api/spirit-posts/unread-count`);
      const response = await fetch(`${baseUrl}/api/spirit-posts/unread-count`, {
        headers,
        cache: 'no-store',
      });

      if (!response.ok) {
        console.warn(`[API Route] 获取灵贴未读消息数量失败: ${response.status} ${response.statusText}`);
        // 如果是404错误，说明后端API可能不存在，返回默认值
        if (response.status === 404) {
          console.log('[API Route] 后端API不存在，返回默认值');
          return NextResponse.json({ total: 0, myPosts: 0, myClaims: 0 });
        }
        
        // 如果是认证错误，返回默认值
        if (response.status === 401 || response.status === 403) {
          console.log('[API Route] 认证错误，返回默认值');
          return NextResponse.json({ total: 0, myPosts: 0, myClaims: 0 });
        }
        
        // 其他错误
        console.error(`[API Route] 获取灵贴未读消息数量失败: ${response.status}`);
        return NextResponse.json({ total: 0, myPosts: 0, myClaims: 0 });
      }

      const data = await response.json();
      console.log(`[API Route] 获取灵贴未读消息数量成功:`, data);
      return NextResponse.json(data);
    } catch (fetchError) {
      console.error('[API Route] 请求后端API失败:', fetchError);
      // 返回默认值
      return NextResponse.json({ total: 0, myPosts: 0, myClaims: 0 });
    }
  } catch (error: any) {
    console.error('[API Route] 处理灵贴未读消息数量请求错误:', error);
    // 任何错误都返回默认值，确保不阻断UI渲染
    return NextResponse.json({ total: 0, myPosts: 0, myClaims: 0 });
  }
} 