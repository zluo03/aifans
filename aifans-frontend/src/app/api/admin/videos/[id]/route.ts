import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = parseInt(params.id);
    
    if (isNaN(videoId)) {
      return NextResponse.json(
        { success: false, message: '无效的视频ID' },
        { status: 400 }
      );
    }
    
    // 模拟删除操作
    console.log(`删除视频 ID: ${videoId}`);
    
    return NextResponse.json({
      success: true,
      message: '视频删除成功',
      deletedId: videoId
    });
  } catch (error) {
    console.error('删除视频失败:', error);
    return NextResponse.json(
      { success: false, message: '删除视频失败' },
      { status: 500 }
    );
  }
} 