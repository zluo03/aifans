import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// 默认上传限制配置
const defaultLimits = {
  notes: {
    imageMaxSizeMB: 5,
    videoMaxSizeMB: 50,
  },
  inspiration: {
    imageMaxSizeMB: 10,
    videoMaxSizeMB: 100,
  },
  screenings: {
    imageMaxSizeMB: 10,
    videoMaxSizeMB: 500,
  },
  creator: {
    imageMaxSizeMB: 5,
    videoMaxSizeMB: 50,
    audioMaxSizeMB: 20,
  },
  resources: {
    imageMaxSizeMB: 10,
    videoMaxSizeMB: 100,
    audioMaxSizeMB: 20,
    archiveMaxSizeMB: 500,
  }
};

/**
 * 获取指定模块的上传限制配置
 * 公开API，无需权限
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { module: string } }
) {
  const { module } = params;
  
  try {
    // 验证模块名称
    if (!['notes', 'inspiration', 'screenings', 'creator', 'resources'].includes(module)) {
      return NextResponse.json(
        { error: '无效的模块名称' },
        { status: 400 }
      );
    }
    
    // 尝试从后端获取上传限制
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/public/settings/upload-limits/${module}`);
    
    if (response?.data) {
      console.log(`成功获取${module}模块上传限制配置`);
      return NextResponse.json(response.data);
    } else {
      throw new Error(`获取${module}模块上传限制配置失败`);
    }
  } catch (error) {
    console.error(`获取${module}模块上传限制配置失败:`, error);
    // 返回默认值
    return NextResponse.json(
      defaultLimits[module as keyof typeof defaultLimits] || defaultLimits.resources,
      { status: 200 }
    );
  }
}
