import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 存储统计接口
interface StorageStats {
  localStorage: {
    totalFiles: number;
    totalSize: number; // bytes
    location: string;
  };
  ossStorage: {
    totalFiles: number;
    totalSize: number; // bytes
    bucket: string;
  };
}

// 递归计算目录文件统计
function getDirectoryStats(dirPath: string): { fileCount: number; totalSize: number } {
  let fileCount = 0;
  let totalSize = 0;
  
  try {
    if (!fs.existsSync(dirPath)) {
      return { fileCount: 0, totalSize: 0 };
    }
    
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        const subStats = getDirectoryStats(itemPath);
        fileCount += subStats.fileCount;
        totalSize += subStats.totalSize;
      } else {
        fileCount++;
        totalSize += stats.size;
      }
    }
  } catch (error) {
    console.error('读取目录统计失败:', error);
  }
  
  return { fileCount, totalSize };
}

export async function GET(request: NextRequest) {
  try {
    // 计算本地存储统计
    const backendUploadsPath = path.join(process.cwd(), '..', 'aifans-backend', 'uploads');
    const localStats = getDirectoryStats(backendUploadsPath);
    
    // 模拟OSS统计（实际项目中应调用OSS API）
    const ossStats = {
      fileCount: 0,
      totalSize: 0
    };
    
    const stats: StorageStats = {
      localStorage: {
        totalFiles: localStats.fileCount,
        totalSize: localStats.totalSize,
        location: 'aifans-backend/uploads/',
      },
      ossStorage: {
        totalFiles: ossStats.fileCount,
        totalSize: ossStats.totalSize,
        bucket: '未配置',
      },
    };
    
    return NextResponse.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('获取存储统计失败:', error);
    return NextResponse.json(
      { success: false, message: '获取存储统计失败' },
      { status: 500 }
    );
  }
} 