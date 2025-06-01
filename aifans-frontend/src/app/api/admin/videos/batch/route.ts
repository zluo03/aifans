import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation, videoIds } = body;
    
    if (!operation || !videoIds || !Array.isArray(videoIds)) {
      return NextResponse.json(
        { success: false, message: '参数无效' },
        { status: 400 }
      );
    }
    
    // 模拟批量操作
    console.log(`批量${operation}视频:`, videoIds);
    
    return NextResponse.json({
      success: true,
      message: `成功${operation} ${videoIds.length} 个视频`,
      processedCount: videoIds.length
    });
  } catch (error) {
    console.error('批量操作失败:', error);
    return NextResponse.json(
      { success: false, message: '批量操作失败' },
      { status: 500 }
    );
  }
} 