import { NextRequest, NextResponse } from 'next/server';

// 简化的存储配置
interface StorageConfig {
  oss: {
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    region: string;
    endpoint: string;
    domain: string;
  };
  storage: {
    defaultStorage: 'local' | 'oss';
    maxFileSize: number; // MB
    enableCleanup: boolean;
    cleanupDays: number;
  };
}

// 模拟配置存储（实际项目中应存储在数据库）
let currentConfig: StorageConfig = {
  oss: {
    accessKeyId: '',
    accessKeySecret: '',
    bucket: '',
    region: 'cn-hangzhou',
    endpoint: '',
    domain: '',
  },
  storage: {
    defaultStorage: 'local',
    maxFileSize: 100,
    enableCleanup: false,
    cleanupDays: 30,
  }
};

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      ...currentConfig
    });
  } catch (error) {
    console.error('获取存储配置失败:', error);
    return NextResponse.json(
      { success: false, message: '获取存储配置失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 更新OSS配置
    if (body.oss) {
      currentConfig.oss = {
        accessKeyId: body.oss.accessKeyId || '',
        accessKeySecret: body.oss.accessKeySecret || '',
        bucket: body.oss.bucket || '',
        region: body.oss.region || 'cn-hangzhou',
        endpoint: body.oss.endpoint || '',
        domain: body.oss.domain || '',
      };
    }
    
    // 更新存储配置
    if (body.storage) {
      currentConfig.storage = {
        defaultStorage: body.storage.defaultStorage || 'local',
        maxFileSize: Math.max(1, Math.min(1000, body.storage.maxFileSize || 100)),
        enableCleanup: Boolean(body.storage.enableCleanup),
        cleanupDays: Math.max(1, Math.min(365, body.storage.cleanupDays || 30)),
      };
    }

    // TODO: 保存配置到数据库
    console.log('保存存储配置:', currentConfig);
    
    return NextResponse.json({
      success: true,
      message: '存储配置已更新',
      config: currentConfig
    });
  } catch (error) {
    console.error('保存存储配置失败:', error);
    return NextResponse.json(
      { success: false, message: '保存存储配置失败' },
      { status: 500 }
    );
  }
} 