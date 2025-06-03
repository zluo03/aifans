import { NextRequest, NextResponse } from 'next/server';

// 默认上传限制配置
const defaultLimits = {
  imageMaxSizeMB: 5,
  videoMaxSizeMB: 50,
  audioMaxSizeMB: 20
};

/**
 * 获取创作者上传限制配置
 * 公开API，无需权限
 */
export async function GET(request: NextRequest) {
  try {
    // 这里可以根据需要添加从数据库或配置文件获取实际限制的逻辑
    // 现在简单返回默认配置
    return NextResponse.json(defaultLimits);
  } catch (error) {
    console.error('获取创作者上传限制失败:', error);
    return NextResponse.json(
      defaultLimits,
      { status: 200 }
    );
  }
} 