import { NextRequest, NextResponse } from 'next/server';
import { BASE_URL } from '@/lib/api/api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: '缺少path参数' }, { status: 400 });
  }

  try {
    // 构建API URL
    const apiUrl = `${BASE_URL}/api/storage/check-file?path=${encodeURIComponent(path)}`;
    
    console.log(`检查后端文件: ${apiUrl}`);
    
    // 调用后端API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      next: { revalidate: 0 } // 禁用缓存
    });

    // 获取响应数据
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('检查后端文件失败:', error);
    
    return NextResponse.json({
      error: '检查文件失败',
      message: error.message,
      exists: false
    }, { status: 500 });
  }
} 