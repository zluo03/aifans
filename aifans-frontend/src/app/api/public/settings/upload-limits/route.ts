import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// 默认上传限制配置
const defaultLimits = {
  notes: {
    imageSize: 5,
    videoSize: 50,
  },
  inspiration: {
    imageSize: 10,
    videoSize: 100,
  },
  screenings: {
    videoSize: 500,
  },
  creator: {
    imageMaxSizeMB: 5,
    videoMaxSizeMB: 50,
    audioMaxSizeMB: 20,
  },
};

/**
 * 获取所有上传限制配置
 * 公开API，无需权限
 */
export async function GET(request: NextRequest) {
  try {
    // 尝试从后端获取上传限制
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/public/settings/upload-limits`);
    
    if (response?.data) {
      console.log('成功获取上传限制配置');
      return NextResponse.json(response.data);
    } else {
      throw new Error('获取上传限制配置失败');
    }
  } catch (error) {
    console.error('获取上传限制配置失败:', error);
    return NextResponse.json(
      { success: false, limits: defaultLimits },
      { status: 200 }
    );
  }
}
