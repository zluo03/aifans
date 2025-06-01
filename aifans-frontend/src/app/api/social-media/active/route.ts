import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest) {
  try {
    console.log('[社交媒体API] 请求活跃社交媒体列表');
    
    // 使用辅助函数构建API URL
    const apiUrl = buildApiUrl('social-media/active');
    
    console.log('[社交媒体API] 请求URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[社交媒体API] 获取活跃列表失败:', response.status, errorText);
      return NextResponse.json(
        { error: '获取社交媒体失败' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[社交媒体API] 获取活跃列表成功, 数量:', data.length);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[社交媒体API] 获取活跃列表错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 