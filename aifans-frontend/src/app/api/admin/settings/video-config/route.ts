import { NextRequest, NextResponse } from 'next/server';

// 全局视频配置
const globalVideoConfig = {
  // 全局默认设置
  global: {
    allowedFormats: ['mp4', 'webm', 'avi'],
    enableThumbnails: true,
    autoCleanup: false,
    cleanupDays: 30,
  },
  // 各模块特定设置
  modules: {
    notes: {
      maxVideoSize: 50, // MB - 笔记中的视频相对较小
      description: '笔记编辑器中的视频文件'
    },
    inspiration: {
      maxVideoSize: 100, // MB - 灵感作品可以更大
      description: 'AI生成的灵感视频作品'
    },
    screenings: {
      maxVideoSize: 500, // MB - 影院视频可以很大
      description: '影院放映的完整视频'
    }
  }
};

export async function GET(request: NextRequest) {
  try {
    // 返回完整的视频配置结构
    // TODO: 从数据库或配置文件中读取实际配置
    
    return NextResponse.json({
      success: true,
      ...globalVideoConfig
    });
  } catch (error) {
    console.error('获取视频配置失败:', error);
    return NextResponse.json(
      { success: false, message: '获取视频配置失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证全局配置参数
    const updatedConfig = {
      global: {
        allowedFormats: body.global?.allowedFormats || ['mp4', 'webm', 'avi'],
        enableThumbnails: Boolean(body.global?.enableThumbnails ?? true),
        autoCleanup: Boolean(body.global?.autoCleanup ?? false),
        cleanupDays: Math.max(1, Math.min(365, body.global?.cleanupDays || 30)),
      },
      modules: {
        notes: {
          maxVideoSize: Math.max(10, Math.min(200, body.modules?.notes?.maxVideoSize || 50)),
          description: '笔记编辑器中的视频文件'
        },
        inspiration: {
          maxVideoSize: Math.max(10, Math.min(200, body.modules?.inspiration?.maxVideoSize || 100)),
          description: 'AI生成的灵感视频作品'
        },
        screenings: {
          maxVideoSize: Math.max(50, Math.min(1000, body.modules?.screenings?.maxVideoSize || 500)),
          description: '影院放映的完整视频'
        }
      }
    };

    // TODO: 保存配置到数据库或配置文件
    console.log('保存视频配置:', updatedConfig);
    
    return NextResponse.json({
      success: true,
      message: '视频配置已更新',
      config: updatedConfig
    });
  } catch (error) {
    console.error('保存视频配置失败:', error);
    return NextResponse.json(
      { success: false, message: '保存视频配置失败' },
      { status: 500 }
    );
  }
} 