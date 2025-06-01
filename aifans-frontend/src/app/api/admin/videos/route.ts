import { NextRequest, NextResponse } from 'next/server';

// 模拟视频数据
const mockVideos = [
  {
    id: 1,
    title: '示例视频1',
    filename: 'sample1.mp4',
    path: '/uploads/notes/videos/sample1.mp4',
    size: 15728640, // 15MB
    duration: 120, // 2分钟
    thumbnail: '/uploads/notes/covers/sample1.jpg',
    uploadDate: new Date().toISOString(),
    viewsCount: 25,
    status: 'active',
    noteId: 1,
    noteTitle: '示例笔记',
    author: {
      id: 1,
      username: 'admin',
      nickname: '管理员'
    }
  },
  {
    id: 2,
    title: '示例视频2',
    filename: 'sample2.mp4',
    path: '/uploads/notes/videos/sample2.mp4',
    size: 25165824, // 24MB
    duration: 180, // 3分钟
    uploadDate: new Date(Date.now() - 86400000).toISOString(), // 昨天
    viewsCount: 12,
    status: 'active',
    noteId: 2,
    noteTitle: '另一个笔记',
    author: {
      id: 2,
      username: 'user1',
      nickname: '用户1'
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      videos: mockVideos,
      total: mockVideos.length
    });
  } catch (error) {
    console.error('获取视频列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取视频列表失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 处理单个视频删除
    const url = new URL(request.url);
    const videoId = url.searchParams.get('id');
    
    if (!videoId) {
      return NextResponse.json(
        { success: false, message: '视频ID不能为空' },
        { status: 400 }
      );
    }

    // TODO: 实现删除视频文件和数据库记录的逻辑
    console.log('删除视频:', videoId);
    
    return NextResponse.json({
      success: true,
      message: '视频删除成功'
    });
  } catch (error) {
    console.error('删除视频失败:', error);
    return NextResponse.json(
      { success: false, message: '删除视频失败' },
      { status: 500 }
    );
  }
} 