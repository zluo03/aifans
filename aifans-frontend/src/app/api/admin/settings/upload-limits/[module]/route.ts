import { NextRequest, NextResponse } from 'next/server';
import { readFile, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// 上传限制配置接口
interface UploadLimits {
  notes: {
    imageSize: number;
    videoSize: number;
  };
  inspiration: {
    imageSize: number;
    videoSize: number;
  };
  screenings: {
    videoSize: number;
  };
  creator: {
    imageMaxSizeMB: number;
    videoMaxSizeMB: number;
    audioMaxSizeMB: number;
  };
}

// 默认配置
const defaultLimits: UploadLimits = {
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

const configDir = join(process.cwd(), 'data');
const configFile = join(configDir, 'upload-limits.json');

async function ensureConfigDir() {
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true });
  }
}

async function readConfig(): Promise<UploadLimits> {
  try {
    await ensureConfigDir();
    if (existsSync(configFile)) {
      const content = await readFile(configFile, 'utf-8');
      console.log('读取到配置文件:', content);
      return JSON.parse(content);
    }
    console.log('配置文件不存在，使用默认配置');
    return defaultLimits;
  } catch (error) {
    console.error('读取配置文件失败:', error);
    return defaultLimits;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: { module: string } }
) {
  // 在Next.js最新版本中，正确访问params
  const { module } = context.params;
  
  try {
    console.log(`处理模块 ${module} 的上传限制请求`);
    
    // 先从本地配置读取
    const limits = await readConfig();
    console.log('读取到的配置:', limits);
    
    // 返回本地配置
    let result;
    if (module === 'notes') {
      result = {
        imageMaxSizeMB: limits.notes.imageSize,
        videoMaxSizeMB: limits.notes.videoSize,
      };
    } else if (module === 'inspiration') {
      result = {
        imageMaxSizeMB: limits.inspiration.imageSize,
        videoMaxSizeMB: limits.inspiration.videoSize,
      };
    } else if (module === 'screenings') {
      result = {
        imageMaxSizeMB: 10, // 影院模块的封面图片限制
        videoMaxSizeMB: limits.screenings.videoSize,
      };
    } else if (module === 'creator') {
      // creator模块默认限制
      result = {
        imageMaxSizeMB: limits.creator?.imageMaxSizeMB ?? 5,
        videoMaxSizeMB: limits.creator?.videoMaxSizeMB ?? 50,
        audioMaxSizeMB: limits.creator?.audioMaxSizeMB ?? 20,
      };
    } else {
      console.warn(`未知的模块: ${module}`);
      return NextResponse.json(
        { error: '未知的模块' },
        { status: 400 }
      );
    }
    
    console.log(`返回${module}模块的上传限制:`, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('获取上传限制失败:', error);
    return NextResponse.json(
      { error: '获取上传限制失败' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { module: string } }
) {
  // 在Next.js最新版本中，正确访问params
  const { module } = context.params;
  
  if (module !== 'creator') {
    return NextResponse.json(
      { error: '只支持creator模块' },
      { status: 400 }
    );
  }
  try {
    const body = await request.json();
    const { imageMaxSizeMB, videoMaxSizeMB, audioMaxSizeMB } = body;

    // 读取原有配置
    const limits = await readConfig();

    // 合并新配置
    const newLimits = {
      ...limits,
      creator: {
        imageMaxSizeMB: Number(imageMaxSizeMB) || 5,
        videoMaxSizeMB: Number(videoMaxSizeMB) || 50,
        audioMaxSizeMB: Number(audioMaxSizeMB) || 20,
      },
    };

    // 写入文件
    await ensureConfigDir();
    await writeFile(configFile, JSON.stringify(newLimits, null, 2), 'utf-8');

    return NextResponse.json(newLimits.creator);
  } catch (error) {
    console.error('保存上传限制失败:', error);
    return NextResponse.json(
      { error: '保存失败' },
      { status: 500 }
    );
  }
} 