import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl, getAuthHeader, handleApiError } from '@/lib/utils/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const authorization = getAuthHeader();
    if (!authorization) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const apiUrl = buildApiUrl(`social-media/${id}`);
    console.log('[社交媒体管理API] 获取详情URL:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': authorization,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, '获取社交媒体失败');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const authorization = getAuthHeader();
    if (!authorization) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    console.log('[社交媒体管理API] 更新社交媒体:', id);
    
    const formData = await request.formData();
    
    const apiUrl = buildApiUrl(`social-media/${id}`);
    console.log('[社交媒体管理API] 更新URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': authorization,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[社交媒体管理API] 更新失败:', response.status, errorText);
      throw new Error(`更新失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, '更新社交媒体失败');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const authorization = request.headers.get('authorization');
    
    if (!authorization) {
      console.error('[社交媒体管理API] 删除请求未找到认证头');
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    console.log('[社交媒体管理API] 发送删除请求，ID:', id);
    console.log('[社交媒体管理API] 认证头:', authorization.substring(0, 20) + '...');

    // 使用辅助函数构建API URL
    const apiUrl = buildApiUrl(`social-media/${id}`);
    
    console.log('[社交媒体管理API] 删除请求URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': authorization,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[社交媒体管理API] 删除失败:', response.status, errorText);
      throw new Error(`删除失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, '删除社交媒体失败');
  }
}
