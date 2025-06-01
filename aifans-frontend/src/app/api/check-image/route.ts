import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: '缺少url参数' }, { status: 400 });
  }

  try {
    console.log(`检查图片URL: ${url}`);
    
    // 尝试HEAD请求获取图片信息
    const headResponse = await fetch(url, {
      method: 'HEAD',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      next: { revalidate: 0 } // 禁用缓存
    }).catch(error => {
      console.error('HEAD请求失败:', error);
      return null;
    });
    
    // 如果HEAD请求成功
    if (headResponse && headResponse.ok) {
      const contentType = headResponse.headers.get('content-type') || '';
      const contentLength = headResponse.headers.get('content-length');
      
      return NextResponse.json({
        accessible: true,
        method: 'HEAD',
        status: headResponse.status,
        contentType,
        contentLength: contentLength ? parseInt(contentLength, 10) : undefined,
        isImage: contentType.startsWith('image/'),
        headers: Object.fromEntries(headResponse.headers.entries())
      });
    }
    
    // 如果HEAD请求失败，尝试GET请求
    console.log('HEAD请求失败，尝试GET请求');
    const getResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      next: { revalidate: 0 } // 禁用缓存
    }).catch(error => {
      console.error('GET请求失败:', error);
      return null;
    });
    
    if (getResponse && getResponse.ok) {
      const contentType = getResponse.headers.get('content-type') || '';
      const contentLength = getResponse.headers.get('content-length');
      
      // 检查内容类型是否为图片
      const isImage = contentType.startsWith('image/');
      
      // 如果是图片，尝试获取图片尺寸（但不读取全部内容）
      let imageInfo = {};
      if (isImage) {
        try {
          // 只读取前几个字节，足够识别图片格式
          const buffer = await getResponse.arrayBuffer();
          imageInfo = {
            byteLength: buffer.byteLength
          };
        } catch (error) {
          console.error('读取图片数据失败:', error);
        }
      }
      
      return NextResponse.json({
        accessible: true,
        method: 'GET',
        status: getResponse.status,
        contentType,
        contentLength: contentLength ? parseInt(contentLength, 10) : undefined,
        isImage,
        imageInfo,
        headers: Object.fromEntries(getResponse.headers.entries())
      });
    }
    
    // 两种请求都失败
    return NextResponse.json({
      accessible: false,
      error: '图片不可访问',
      headStatus: headResponse?.status,
      getStatus: getResponse?.status
    });
  } catch (error: any) {
    console.error('检查图片失败:', error);
    
    return NextResponse.json({
      accessible: false,
      error: '检查图片失败',
      message: error.message
    }, { status: 500 });
  }
} 