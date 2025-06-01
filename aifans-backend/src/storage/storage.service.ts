import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as OSS from 'ali-oss';
import { StorageConfig } from './storage.config';
import { v4 as uuidv4 } from 'uuid';

// 定义迁移结果的详情类型
interface MigrationDetail {
  type: string;
  id: any;
  status: string;
  error?: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private ossClient: OSS;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly storageConfig: StorageConfig,
  ) {
    // 初始化OSS客户端（如果配置了OSS）
    this.initOssClient();
  }

  // 初始化OSS客户端
  private initOssClient() {
    if (this.storageConfig.isOssEnabled) {
      try {
        this.ossClient = new OSS({
          region: this.storageConfig.ossRegion,
          accessKeyId: this.storageConfig.ossAccessKeyId,
          accessKeySecret: this.storageConfig.ossAccessKeySecret,
          bucket: this.storageConfig.ossBucket,
        });
        this.logger.log('OSS客户端初始化成功');
      } catch (error) {
        this.logger.error('OSS客户端初始化失败', error);
      }
    }
  }

  // 上传文件
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<{ url: string; key: string }> {
    const uniqueFileName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    const key = `${folder}/${uniqueFileName}`;

    // 判断是否使用OSS
    if (this.storageConfig.isOssEnabled && this.ossClient) {
      return this.uploadToOSS(file.buffer, key);
    } else {
      return this.uploadToLocal(file.buffer, key);
    }
  }

  // 上传到本地存储
  private async uploadToLocal(
    buffer: Buffer,
    key: string,
  ): Promise<{ url: string; key: string }> {
    // 获取上传目录路径
    const uploadDir = path.join(process.cwd(), 'uploads');
    this.logger.log(`上传目录: ${uploadDir}`);
    
    // 获取文件完整路径
    const filePath = path.join(uploadDir, key);
    this.logger.log(`文件路径: ${filePath}`);
    
    // 获取目录路径
    const dirPath = path.dirname(filePath);
    this.logger.log(`目录路径: ${dirPath}`);

    // 确保目录存在
    if (!fs.existsSync(dirPath)) {
      this.logger.log(`目录不存在，创建目录: ${dirPath}`);
      try {
        fs.mkdirSync(dirPath, { recursive: true });
      } catch (error) {
        this.logger.error(`创建目录失败: ${error.message}`);
        throw new Error(`创建目录失败: ${error.message}`);
      }
    }

    // 写入文件
    try {
      await fs.promises.writeFile(filePath, buffer);
      this.logger.log(`文件已写入: ${filePath}`);
    } catch (error) {
      this.logger.error(`写入文件失败: ${error.message}`);
      throw new Error(`写入文件失败: ${error.message}`);
    }
    
    // 尝试修复文件权限 (非Windows环境)
    if (process.platform !== 'win32') {
      try {
        // 修改文件权限为644 (rw-r--r--)
        fs.chmodSync(filePath, 0o644);
        this.logger.log(`文件权限已修改: ${filePath}`);
      } catch (error) {
        this.logger.warn(`修改文件权限失败: ${error.message}`);
      }
    }

    // 返回完整的URL
    const baseUrl = this.configService.get<string>('SERVER_DOMAIN') || this.configService.get<string>('BASE_URL') || 'http://localhost:3001';
    const url = `${baseUrl}/uploads/${key}`;
    this.logger.log(`文件URL: ${url}`);
    
    return { url, key };
  }

  // 上传到OSS
  private async uploadToOSS(
    buffer: Buffer,
    key: string,
  ): Promise<{ url: string; key: string }> {
    try {
      const result = await this.ossClient.put(key, buffer);
      return {
        url: result.url || `${this.storageConfig.ossCdnDomain}/${key}`,
        key,
      };
    } catch (error) {
      this.logger.error(`上传到OSS失败: ${error.message}`, error.stack);
      throw new Error(`上传到OSS失败: ${error.message}`);
    }
  }

  // 删除文件
  async deleteFile(key: string): Promise<boolean> {
    try {
      if (this.storageConfig.isOssEnabled && this.ossClient) {
        await this.ossClient.delete(key);
      } else {
        const filePath = path.join(process.cwd(), 'uploads', key);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      }
      return true;
    } catch (error) {
      this.logger.error(`删除文件失败: ${error.message}`, error.stack);
      return false;
    }
  }

  // 获取文件URL
  getFileUrl(key: string): string {
    if (this.storageConfig.isOssEnabled) {
      return `${this.storageConfig.ossCdnDomain}/${key}`;
    } else {
      return `/uploads/${key}`;
    }
  }

  // 检查文件是否存在
  async checkFileExists(filePath: string): Promise<{ exists: boolean; path: string; stats?: any }> {
    try {
      // 确保文件路径不包含../ 或 ..\ 以防止路径遍历攻击
      if (filePath.includes('../') || filePath.includes('..\\')) {
        throw new Error('不允许的文件路径');
      }
      
      // 规范化文件路径
      const normalizedPath = filePath.replace(/\\/g, '/');
      
      // 构建完整文件路径
      const fullPath = path.join(process.cwd(), 'uploads', normalizedPath);
      this.logger.log(`检查文件是否存在: ${fullPath}`);
      
      // 检查文件是否存在
      if (!fs.existsSync(fullPath)) {
        return {
          exists: false,
          path: fullPath
        };
      }
      
      // 获取文件状态
      const stats = fs.statSync(fullPath);
      
      return {
        exists: true,
        path: fullPath,
        stats: {
          size: stats.size,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          accessedAt: stats.atime
        }
      };
    } catch (error) {
      this.logger.error(`检查文件失败: ${error.message}`, error.stack);
      throw new Error(`检查文件失败: ${error.message}`);
    }
  }

  // 迁移到OSS
  async migrateToOSS(): Promise<{
    total: number;
    migrated: number;
    failed: number;
    details: MigrationDetail[];
  }> {
    if (!this.storageConfig.isOssEnabled || !this.ossClient) {
      throw new Error('OSS未配置，无法迁移');
    }

    const result = {
      total: 0,
      migrated: 0,
      failed: 0,
      details: [] as MigrationDetail[],
    };

    try {
      // 1. 迁移帖子图片
      const posts = await this.prisma.post.findMany({
        select: {
          id: true,
          fileUrl: true,
          thumbnailUrl: true,
        },
      });

      result.total += posts.length;

      for (const post of posts) {
        try {
          // 迁移主文件
          if (post.fileUrl && post.fileUrl.startsWith('/uploads/')) {
            const localKey = post.fileUrl.replace('/uploads/', '');
            const localPath = path.join(process.cwd(), 'uploads', localKey);
            
            if (fs.existsSync(localPath)) {
              const buffer = await fs.promises.readFile(localPath);
              const { url } = await this.uploadToOSS(buffer, localKey);
              
              await this.prisma.post.update({
                where: { id: post.id },
                data: { fileUrl: url },
              });
            }
          }

          // 迁移缩略图
          if (post.thumbnailUrl && post.thumbnailUrl.startsWith('/uploads/')) {
            const localKey = post.thumbnailUrl.replace('/uploads/', '');
            const localPath = path.join(process.cwd(), 'uploads', localKey);
            
            if (fs.existsSync(localPath)) {
              const buffer = await fs.promises.readFile(localPath);
              const { url } = await this.uploadToOSS(buffer, localKey);
              
              await this.prisma.post.update({
                where: { id: post.id },
                data: { thumbnailUrl: url },
              });
            }
          }

          result.migrated++;
          result.details.push({
            type: 'post',
            id: post.id,
            status: 'success',
          });
        } catch (error) {
          result.failed++;
          result.details.push({
            type: 'post',
            id: post.id,
            status: 'failed',
            error: error.message,
          });
        }
      }

      // 2. 迁移用户头像
      const users = await this.prisma.user.findMany({
        where: {
          avatarUrl: {
            startsWith: '/uploads/',
          },
        },
        select: {
          id: true,
          avatarUrl: true,
        },
      });

      result.total += users.length;

      for (const user of users) {
        try {
          if (user.avatarUrl) {
            const localKey = user.avatarUrl.replace('/uploads/', '');
            const localPath = path.join(process.cwd(), 'uploads', localKey);
            
            if (fs.existsSync(localPath)) {
              const buffer = await fs.promises.readFile(localPath);
              const { url } = await this.uploadToOSS(buffer, localKey);
              
              await this.prisma.user.update({
                where: { id: user.id },
                data: { avatarUrl: url },
              });
            }
          }

          result.migrated++;
          result.details.push({
            type: 'user',
            id: user.id,
            status: 'success',
          });
        } catch (error) {
          result.failed++;
          result.details.push({
            type: 'user',
            id: user.id,
            status: 'failed',
            error: error.message,
          });
        }
      }

      // 3. 迁移笔记封面
      const notes = await this.prisma.note.findMany({
        where: {
          coverImageUrl: {
            startsWith: '/uploads/',
          },
        },
        select: {
          id: true,
          coverImageUrl: true,
        },
      });

      result.total += notes.length;

      for (const note of notes) {
        try {
          if (note.coverImageUrl) {
            const localKey = note.coverImageUrl.replace('/uploads/', '');
            const localPath = path.join(process.cwd(), 'uploads', localKey);
            
            if (fs.existsSync(localPath)) {
              const buffer = await fs.promises.readFile(localPath);
              const { url } = await this.uploadToOSS(buffer, localKey);
              
              await this.prisma.note.update({
                where: { id: note.id },
                data: { coverImageUrl: url },
              });
            }
          }

          result.migrated++;
          result.details.push({
            type: 'note',
            id: note.id,
            status: 'success',
          });
        } catch (error) {
          result.failed++;
          result.details.push({
            type: 'note',
            id: note.id,
            status: 'failed',
            error: error.message,
          });
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`迁移到OSS失败: ${error.message}`, error.stack);
      throw new Error(`迁移到OSS失败: ${error.message}`);
    }
  }
} 