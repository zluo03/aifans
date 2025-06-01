import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 模拟统计数据
    const stats = {
      totalVideos: 12,
      totalSize: 524288000, // 500MB
      totalViews: 1250,
      recentUploads: [
        {
          id: 1,
          title: '示例视频1',
          uploadDate: new Date().toISOString(),
          size: 15728640
        },
        {
          id: 2,
          title: '示例视频2',
          uploadDate: new Date(Date.now() - 86400000).toISOString(),
          size: 25165824
        },
        {
          id: 3,
          title: '示例视频3',
          uploadDate: new Date(Date.now() - 172800000).toISOString(),
          size: 31457280
        }
      ]
    };
    
    return NextResponse.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('获取视频统计失败:', error);
    return NextResponse.json(
      { success: false, message: '获取视频统计失败' },
      { status: 500 }
    );
  }
} 