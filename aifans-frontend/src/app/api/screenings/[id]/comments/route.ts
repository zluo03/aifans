import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'http://localhost:3001';

// 获取影片评论/弹幕
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的影片ID' },
        { status: 400 }
      );
    }

    // 获取Authorization头
    const authHeader = request.headers.get('Authorization');
    
    // 调用后端API获取评论
    const backendResponse = await fetch(`${BACKEND_URL}/api/screenings/${id}/comments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader })
      }
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text();
      return NextResponse.json(
        { error: '获取评论失败' },
        { status: backendResponse.status }
      );
    }

    const comments = await backendResponse.json();
    return NextResponse.json(comments);
  } catch (error) {
    console.error('获取评论失败:', error);
    return NextResponse.json(
      { error: '获取评论失败' },
      { status: 500 }
    );
  }
}

// 添加评论/弹幕
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的影片ID' },
        { status: 400 }
      );
    }

    // 获取Authorization头
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    // 获取请求体
    const body = await request.json();
    const { content } = body;
    
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: '弹幕内容不能为空' },
        { status: 400 }
      );
    }

    // 调用后端API添加评论（后端会进行敏感词检测）
    const backendResponse = await fetch(`${BACKEND_URL}/api/screenings/${id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({ content: content.trim() })
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ message: '添加评论失败' }));
      
      // 检查是否是敏感词检测失败
      if (backendResponse.status === 400 && errorData.message && errorData.message.includes('敏感词')) {
        return NextResponse.json(
          { error: '您的内容违反了站点政策。' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: errorData.message || '添加评论失败' },
        { status: backendResponse.status }
      );
    }

    const comment = await backendResponse.json();
    return NextResponse.json(comment);
  } catch (error) {
    console.error('添加评论失败:', error);
    return NextResponse.json(
      { error: '添加评论失败' },
      { status: 500 }
    );
  }
} 