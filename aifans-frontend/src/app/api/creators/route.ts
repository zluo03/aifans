import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/utils/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/creators`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creators' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 定义错误响应接口
    interface ErrorResponse {
      message: string;
      details?: string;
      statusCode?: number;
      error?: string;
    }

    // 获取认证token
    const token = getAuthToken(request);
    
    if (!token) {
      console.error('创作者API代理: 未找到认证token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 添加认证token详细日志
    const hasBearer = token.startsWith('Bearer ');
    console.log('创作者API代理: 认证详情', {
      tokenLength: token.length,
      hasBearer,
      tokenPrefix: token.substring(0, 20) + '...',
      authHeader: hasBearer ? token : `Bearer ${token}`
    });

    // 获取请求体
    const body = await request.json();
    
    // 确保body符合后端期望的格式，并移除不需要的字段
    const payload = {
      nickname: body.nickname || '',
      backgroundUrl: body.backgroundUrl || null,
      avatarUrl: body.avatarUrl || null,
      bio: body.bio || null,
      expertise: body.expertise || null,
      images: Array.isArray(body.images) ? body.images : [],
      videos: Array.isArray(body.videos) ? body.videos : [],
      audios: Array.isArray(body.audios) ? body.audios : []
    };
    
    // 确保请求体不包含userId字段，因为后端从token中获取
    if ('userId' in payload) {
      delete (payload as any).userId;
    }
    
    console.log('创作者API代理: 请求体', { 
      nickname: payload.nickname, 
      hasAvatarUrl: !!payload.avatarUrl,
      backgroundUrl: payload.backgroundUrl?.substring(0, 20) + '...',
      hasImages: Array.isArray(payload.images) && payload.images.length > 0,
      hasVideos: Array.isArray(payload.videos) && payload.videos.length > 0,
      hasAudios: Array.isArray(payload.audios) && payload.audios.length > 0
    });

    // 构建正确的API URL
    const apiUrl = `${BACKEND_URL}/api/creators`;
    console.log('创作者API代理: 目标URL', apiUrl);

    // 调用后端API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      },
      body: JSON.stringify(payload)
    });

    console.log('创作者API代理: 响应状态', response.status);

    if (!response.ok) {
      let errorInfo: ErrorResponse = { message: '创作者信息更新失败' };
      
      try {
        // 获取完整的错误响应文本
        const errorText = await response.text();
        console.error('服务器返回的原始错误信息:', errorText);
        
        try {
          if (errorText && errorText.trim()) {
            const errorJson = JSON.parse(errorText);
            console.error('解析后的错误JSON:', errorJson);
            
            // 提取常见错误字段
            errorInfo = {
              message: errorJson.message || errorJson.error || '创作者信息更新失败',
              details: errorJson.details || errorJson.error || errorJson.message || errorText,
              statusCode: response.status,
              error: errorJson.error || '请求失败'
            };
          }
        } catch (parseError) {
          console.error('解析错误JSON失败:', parseError);
          errorInfo.details = errorText;
        }
      } catch (e) {
        console.error('读取错误响应失败:', e);
        errorInfo.details = `HTTP错误 ${response.status}`;
      }
      
      console.error('创作者API代理失败:', {
        status: response.status,
        statusText: response.statusText,
        errorInfo,
        requestPayload: {
          nickname: payload.nickname
        }
      });
      
      return NextResponse.json(errorInfo, { status: response.status });
    }

    // 解析成功响应
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // 如果响应不是JSON但请求成功，返回简单成功消息
      data = { message: '创作者信息更新成功' };
    }
    
    console.log('创作者API代理: 成功更新创作者信息');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('创作者API代理错误:', error.message);
    return NextResponse.json(
      { error: '创作者信息更新失败', message: error.message },
      { status: 500 }
    );
  }
} 