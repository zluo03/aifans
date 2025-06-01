import { NextRequest, NextResponse } from 'next/server';

// 上传统计接口
interface UploadStats {
  notes: {
    imageCount: number;
    videoCount: number;
    totalSize: number; // bytes
  };
  inspiration: {
    imageCount: number;
    videoCount: number;
    totalSize: number; // bytes
  };
  screenings: {
    videoCount: number;
    totalSize: number; // bytes
  };
}

export async function GET(request: NextRequest) {
  try {
    // 模拟统计数据
    const stats: UploadStats = {
      notes: {
        imageCount: 45,
        videoCount: 12,
        totalSize: 157286400, // ~150MB
      },
      inspiration: {
        imageCount: 234,
        videoCount: 67,
        totalSize: 2147483648, // ~2GB
      },
      screenings: {
        videoCount: 8,
        totalSize: 4294967296, // ~4GB
      },
    };
    
    return NextResponse.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('获取上传统计失败:', error);
    return NextResponse.json(
      { success: false, message: '获取上传统计失败' },
      { status: 500 }
    );
  }
} 