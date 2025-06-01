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
      return JSON.parse(content);
    }
    return defaultLimits;
  } catch (error) {
    console.error('读取配置文件失败:', error);
    return defaultLimits;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ module: string }> }
) {
  const { module } = await params;
  try {
    const limits = await readConfig();
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
      return NextResponse.json(
        { success: false, message: '未知的模块' },
        { status: 400 }
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '获取上传限制失败' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ module: string }> }
) {
  const { module } = await params;
  if (module !== 'creator') {
    return NextResponse.json(
      { success: false, message: '只支持creator模块' },
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

    return NextResponse.json({ success: true, limits: newLimits.creator });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '保存失败' },
      { status: 500 }
    );
  }
} 