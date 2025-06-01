import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// 上传限制配置接口（移除总数量限制）
interface UploadLimits {
  notes: {
    imageSize: number; // MB
    videoSize: number; // MB
  };
  inspiration: {
    imageSize: number; // MB
    videoSize: number; // MB
  };
  screenings: {
    videoSize: number; // MB
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
};

// 配置文件路径
const configDir = join(process.cwd(), 'data');
const configFile = join(configDir, 'upload-limits.json');

// 确保配置目录存在
async function ensureConfigDir() {
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true });
  }
}

// 读取配置
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

// 保存配置
async function saveConfig(limits: UploadLimits): Promise<void> {
  try {
    await ensureConfigDir();
    await writeFile(configFile, JSON.stringify(limits, null, 2), 'utf-8');
    console.log('配置已保存到:', configFile);
  } catch (error) {
    console.error('保存配置文件失败:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentLimits = await readConfig();
    return NextResponse.json({
      success: true,
      limits: currentLimits
    });
  } catch (error) {
    console.error('获取上传限制失败:', error);
    return NextResponse.json(
      { success: false, message: '获取上传限制失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { limits } = body;
    
    console.log('接收到的配置:', limits);
    
    if (!limits) {
      return NextResponse.json(
        { success: false, message: '无效的参数' },
        { status: 400 }
      );
    }
    
    // 验证和清理配置数据
    const newLimits: UploadLimits = {
      notes: {
        imageSize: Math.max(1, Math.min(20, Number(limits.notes?.imageSize) || 5)),
        videoSize: Math.max(10, Math.min(200, Number(limits.notes?.videoSize) || 50)),
      },
      inspiration: {
        imageSize: Math.max(1, Math.min(50, Number(limits.inspiration?.imageSize) || 10)),
        videoSize: Math.max(10, Math.min(200, Number(limits.inspiration?.videoSize) || 100)),
      },
      screenings: {
        videoSize: Math.max(50, Math.min(2000, Number(limits.screenings?.videoSize) || 500)),
      },
    };
    
    console.log('处理后的配置:', newLimits);
    
    // 保存配置到文件
    await saveConfig(newLimits);
    
    return NextResponse.json({
      success: true,
      message: '上传限制配置已更新',
      limits: newLimits
    });
  } catch (error) {
    console.error('保存上传限制失败:', error);
    return NextResponse.json(
      { success: false, message: '保存上传限制失败：' + (error as Error).message },
      { status: 500 }
    );
  }
} 