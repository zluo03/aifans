import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl, getAuthHeader, handleApiError } from '@/lib/utils/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const authorization = getAuthHeader();
    if (!authorization) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const sortData = await request.json();
    console.log('[社交媒体管理API] 更新排序:', sortData);

    const apiUrl = buildApiUrl('social-media/sort');
    console.log('[社交媒体管理API] 排序URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(sortData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[社交媒体管理API] 排序更新失败:', response.status, errorText);
      throw new Error(`排序更新失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, '更新社交媒体排序失败');
  }
} 