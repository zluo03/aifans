import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // 获取API基础URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // 构建目标URL
    const targetPath = params.path.join('/');
    const targetUrl = `${apiUrl}/${targetPath}`;
    
    console.log(`代理请求: ${targetUrl}`);
    
    // 转发请求
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    // 检查响应
    if (!response.ok) {
      console.error(`代理请求失败: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `无法获取资源: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // 获取响应内容
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();
    
    // 构建响应
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=86400');
    
    return new NextResponse(buffer, {
      status: 200,
      headers
    });
  } catch (error: any) {
    console.error('代理请求出错:', error);
    return NextResponse.json(
      { error: `代理请求出错: ${error.message}` },
      { status: 500 }
    );
  }
} 