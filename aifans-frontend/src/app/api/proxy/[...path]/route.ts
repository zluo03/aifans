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
    
    console.log(`代理GET请求: ${targetUrl}`);
    
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
    console.error('代理GET请求出错:', error);
    return NextResponse.json(
      { error: `代理请求出错: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // 获取API基础URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // 构建目标URL
    const targetPath = params.path.join('/');
    const targetUrl = `${apiUrl}/api/${targetPath}`;
    
    console.log(`代理POST请求: ${targetUrl}`);
    
    // 获取请求头和请求体
    const headers = new Headers();
    
    // 复制原始请求的头信息
    request.headers.forEach((value, key) => {
      // 只复制必要的头信息
      if (key.toLowerCase() === 'authorization' || 
          key.toLowerCase() === 'content-type') {
        headers.append(key, value);
      }
    });
    
    // 确保有Authorization头
    if (!headers.has('Authorization')) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader) {
        headers.set('Authorization', authHeader);
      }
    }
    
    // 获取请求体
    let body;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = JSON.stringify(await request.json());
    } else {
      body = await request.text();
    }
    
    console.log('代理POST请求头:', Object.fromEntries(headers.entries()));
    
    // 转发请求
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body
    });
    
    // 获取响应内容
    const responseData = await response.json().catch(() => response.text());
    
    // 返回响应
    return NextResponse.json(responseData, { status: response.status });
  } catch (error: any) {
    console.error('代理POST请求出错:', error);
    return NextResponse.json(
      { error: `代理请求出错: ${error.message}` },
      { status: 500 }
    );
  }
} 