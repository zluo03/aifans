import { NextRequest, NextResponse } from 'next/server';
import { BASE_URL } from '@/lib/api/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // 获取文件名
    const { filename } = params;
    console.log(`头像代理请求: ${filename}`);
    
    if (!filename) {
      console.error('缺少文件名参数');
      return NextResponse.redirect(new URL('/images/default-avatar.png', request.url));
    }
    
    // 获取API基础URL
    const apiUrl = BASE_URL;
    
    // 尝试不同的路径格式
    const possibleUrls = [
      // 1. 新的专用头像API
      `${apiUrl}/api/storage/avatar/${filename}`,
      // 2. 标准静态文件URL
      `${apiUrl}/uploads/avatar/${filename}`,
      // 3. 相对路径格式 (用于Nginx反代场景)
      `/uploads/avatar/${filename}`,
      // 4. 如果是dev.aifans.pro，直接使用完整URL
      `http://dev.aifans.pro/uploads/avatar/${filename}`,
    ];
    
    // 记录当前尝试的URL
    let currentUrl = '';
    let response: Response | null = null;
    
    // 依次尝试不同URL格式
    for (const url of possibleUrls) {
      try {
        currentUrl = url;
        console.log(`尝试头像URL: ${url}`);
        
        const fetchResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          next: { revalidate: 0 } // 禁用缓存
        });
        
        if (fetchResponse.ok) {
          response = fetchResponse;
          console.log(`头像URL成功: ${url}`);
          break;
        } else {
          console.log(`头像URL失败: ${url}, 状态码: ${fetchResponse.status}`);
        }
      } catch (fetchError) {
        console.error(`尝试URL失败: ${url}`, fetchError);
      }
    }
    
    // 如果所有URL都失败
    if (!response || !response.ok) {
      console.error(`所有头像URL尝试失败`);
      return NextResponse.redirect(new URL('/images/default-avatar.png', request.url));
    }
    
    // 获取响应内容
    const contentType = response.headers.get('content-type') || 'image/jpeg';
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
    console.error('头像代理请求出错:', error);
    
    // 出错时返回默认头像
    return NextResponse.redirect(new URL('/images/default-avatar.png', request.url));
  }
} 