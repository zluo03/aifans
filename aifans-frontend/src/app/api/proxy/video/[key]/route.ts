import { NextRequest, NextResponse } from 'next/server';

/**
 * 视频代理接口，用于解决阿里云OSS视频跨域问题
 * 将通过服务端请求OSS资源并添加正确的CORS头部返回给前端
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // 获取视频key
    const key = params.key;
    if (!key) {
      return NextResponse.json(
        { error: '缺少视频key参数' },
        { status: 400 }
      );
    }

    // 构建阿里云OSS URL
    // 这里使用固定的OSS域名，实际应用中可以从环境变量获取
    const ossBaseUrl = 'https://aifansbeijing.oss-cn-beijing.aliyuncs.com/';
    const videoUrl = `${ossBaseUrl}${key}`;

    console.log(`代理视频请求: ${videoUrl}`);

    // 从OSS获取视频内容
    const ossResponse = await fetch(videoUrl);
    
    if (!ossResponse.ok) {
      console.error(`OSS请求失败: ${ossResponse.status} ${ossResponse.statusText}`);
      return NextResponse.json(
        { error: '视频资源不存在或无法访问' },
        { status: ossResponse.status }
      );
    }

    // 获取视频内容
    const videoBlob = await ossResponse.blob();
    
    // 创建响应并设置正确的头部
    const response = new NextResponse(videoBlob, {
      status: 200,
      headers: {
        'Content-Type': ossResponse.headers.get('Content-Type') || 'video/mp4',
        'Content-Length': ossResponse.headers.get('Content-Length') || '',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400', // 缓存1天
        'Access-Control-Allow-Origin': '*', // 允许任何来源访问
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
      }
    });

    return response;
  } catch (error) {
    console.error('视频代理请求失败:', error);
    return NextResponse.json(
      { error: '视频代理请求处理失败' },
      { status: 500 }
    );
  }
} 