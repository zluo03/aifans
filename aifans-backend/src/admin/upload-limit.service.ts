import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface UploadLimitData {
  imageMaxSizeMB: number;
  videoMaxSizeMB: number;
  audioMaxSizeMB: number;
}

@Injectable()
export class UploadLimitService {
  constructor(private readonly prisma: PrismaService) {}

  async getLimitByModule(module: string): Promise<UploadLimitData> {
    const limit = await this.prisma.uploadLimit.findUnique({ where: { module } });
    if (!limit) {
      // 返回默认值
      return {
        imageMaxSizeMB: module === 'notes' ? 5 : module === 'inspiration' ? 10 : 0,
        videoMaxSizeMB: module === 'notes' ? 50 : module === 'inspiration' ? 100 : module === 'screenings' ? 500 : 0,
        audioMaxSizeMB: module === 'creator' ? 20 : 0,
      };
    }
    return limit;
  }

  async setLimitByModule(module: string, data: UploadLimitData): Promise<UploadLimitData> {
    return this.prisma.uploadLimit.upsert({
      where: { module },
      update: data,
      create: { module, ...data },
    });
  }

  // 获取指定模块的图片数量
  async getImageCount(module: string): Promise<number> {
    const uploadDir = join(process.cwd(), 'uploads', module);
    try {
      const files = await fs.readdir(uploadDir);
      return files.filter(file => 
        file.toLowerCase().endsWith('.jpg') || 
        file.toLowerCase().endsWith('.jpeg') || 
        file.toLowerCase().endsWith('.png') || 
        file.toLowerCase().endsWith('.gif') || 
        file.toLowerCase().endsWith('.webp')
      ).length;
    } catch (error) {
      return 0;
    }
  }

  // 获取指定模块的视频数量
  async getVideoCount(module: string): Promise<number> {
    const uploadDir = join(process.cwd(), 'uploads', module);
    try {
      const files = await fs.readdir(uploadDir);
      return files.filter(file => 
        file.toLowerCase().endsWith('.mp4') || 
        file.toLowerCase().endsWith('.webm') || 
        file.toLowerCase().endsWith('.mov')
      ).length;
    } catch (error) {
      return 0;
    }
  }

  // 获取指定模块的总存储大小
  async getTotalSize(module: string): Promise<number> {
    const uploadDir = join(process.cwd(), 'uploads', module);
    try {
      let totalSize = 0;
      const files = await fs.readdir(uploadDir);
      
      for (const file of files) {
        const filePath = join(uploadDir, file);
        try {
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            totalSize += stats.size;
          }
        } catch (error) {
          console.error(`获取文件大小失败: ${filePath}`, error);
        }
      }
      
      return totalSize;
    } catch (error) {
      return 0;
    }
  }
} 