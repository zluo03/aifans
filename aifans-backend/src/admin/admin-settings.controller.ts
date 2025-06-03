import { Controller, Get, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../types/prisma-enums';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, OssConfig, StorageConfig as PrismaStorageConfig } from '@prisma/client';

// OSS配置接口
interface OSSConfig {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  region: string;
  endpoint: string;
  domain: string;
}

// 存储配置接口
interface StorageConfig {
  defaultStorage: 'local' | 'oss';
  maxFileSize: number; // MB
  enableCleanup: boolean;
  cleanupDays: number;
}

// 完整配置接口
interface AdminStorageConfig {
  oss: OSSConfig;
  storage: StorageConfig;
}

@ApiTags('管理员设置')
@Controller('admin/settings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class AdminSettingsController {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  @Get('storage')
  @ApiOperation({ summary: '获取存储配置' })
  @ApiResponse({ status: 200, description: '返回当前存储配置' })
  async getStorageConfig() {
    try {
      console.log('获取存储配置');
      const oss = await this.prisma.ossConfig.findFirst();
      const storage = await this.prisma.storageConfig.findFirst();
      console.log('数据库中的OSS配置:', JSON.stringify(oss));
      console.log('数据库中的存储配置:', JSON.stringify(storage));
      
      return {
        success: true,
        config: {
          oss: oss || {
            accessKeyId: '',
            accessKeySecret: '',
            bucket: '',
            region: 'cn-hangzhou',
            endpoint: '',
            domain: ''
          },
          storage: storage || {
            defaultStorage: 'local',
            maxFileSize: 100,
            enableCleanup: false,
            cleanupDays: 30
          },
        },
      };
    } catch (error) {
      console.error('获取存储配置失败:', error);
      return {
        success: false,
        message: '获取存储配置失败',
        error: error.message,
      };
    }
  }

  @Get('storage/config')
  @ApiOperation({ summary: '获取存储配置（专用端点）' })
  @ApiResponse({ status: 200, description: '返回当前存储配置' })
  async getStorageConfigSpecial() {
    try {
      console.log('获取存储配置（专用端点）');
      const oss = await this.prisma.ossConfig.findFirst();
      const storage = await this.prisma.storageConfig.findFirst();
      console.log('数据库中的OSS配置:', JSON.stringify(oss));
      console.log('数据库中的存储配置:', JSON.stringify(storage));
      
      // 直接返回oss和storage对象，不嵌套在config中
      return {
        oss: oss || {
          accessKeyId: 'LTAI5tJoFRVmfhFcYnM1234',
          accessKeySecret: 'YourAccessKeySecret',
          bucket: 'aifans-storage',
          region: 'cn-hangzhou',
          endpoint: 'oss-cn-hangzhou.aliyuncs.com',
          domain: 'storage.aifans.pro'
        },
        storage: storage || {
          defaultStorage: 'local',
          maxFileSize: 100,
          enableCleanup: false,
          cleanupDays: 30
        }
      };
    } catch (error) {
      console.error('获取存储配置（专用端点）失败:', error);
      return {
        success: false,
        message: '获取存储配置失败',
        error: error.message,
      };
    }
  }

  @Post('storage')
  @ApiOperation({ summary: '保存存储配置' })
  @ApiResponse({ status: 200, description: '保存成功返回更新后的配置' })
  async saveStorageConfig(@Body() config: any) {
    try {
      console.log('保存存储配置:', config);
      const { oss, storage } = config;
      // OSS
      if (oss) {
        const ossConfig = await this.prisma.ossConfig.findFirst();
        if (ossConfig) {
          console.log('更新现有OSS配置:', oss);
          await this.prisma.ossConfig.update({ where: { id: ossConfig.id }, data: oss });
        } else {
          console.log('创建新的OSS配置:', oss);
          await this.prisma.ossConfig.create({ data: oss });
        }
      }
      // 存储
      if (storage) {
        const storageConfig = await this.prisma.storageConfig.findFirst();
        if (storageConfig) {
          console.log('更新现有存储配置:', storage);
          await this.prisma.storageConfig.update({ where: { id: storageConfig.id }, data: storage });
        } else {
          console.log('创建新的存储配置:', storage);
          await this.prisma.storageConfig.create({ data: storage });
        }
      }
      // 返回数据库最新
      const newOss = await this.prisma.ossConfig.findFirst();
      const newStorage = await this.prisma.storageConfig.findFirst();
      console.log('保存后的OSS配置:', JSON.stringify(newOss));
      console.log('保存后的存储配置:', JSON.stringify(newStorage));
      return {
        success: true,
        message: '存储配置已更新',
        config: {
          oss: newOss || {
            accessKeyId: '',
            accessKeySecret: '',
            bucket: '',
            region: 'cn-hangzhou',
            endpoint: '',
            domain: ''
          },
          storage: newStorage || {
            defaultStorage: 'local',
            maxFileSize: 100,
            enableCleanup: false,
            cleanupDays: 30
          },
        },
      };
    } catch (error) {
      console.error('保存存储配置失败:', error);
      return {
        success: false,
        message: '保存存储配置失败',
        error: error.message,
      };
    }
  }

  @Post('storage/save-oss-config')
  @ApiOperation({ summary: '保存OSS配置（专用端点）' })
  @ApiResponse({ status: 200, description: '保存成功返回更新后的配置' })
  async saveOssConfig(@Body() config: any) {
    try {
      console.log('保存OSS配置(专用端点):', config);
      const { oss, storage } = config;
      // OSS
      if (oss) {
        const ossConfig = await this.prisma.ossConfig.findFirst();
        if (ossConfig) {
          console.log('更新现有OSS配置:', oss);
          await this.prisma.ossConfig.update({ where: { id: ossConfig.id }, data: oss });
        } else {
          console.log('创建新的OSS配置:', oss);
          await this.prisma.ossConfig.create({ data: oss });
        }
      }
      // 存储
      if (storage) {
        const storageConfig = await this.prisma.storageConfig.findFirst();
        if (storageConfig) {
          console.log('更新现有存储配置:', storage);
          await this.prisma.storageConfig.update({ where: { id: storageConfig.id }, data: storage });
        } else {
          console.log('创建新的存储配置:', storage);
          await this.prisma.storageConfig.create({ data: storage });
        }
      }
      // 返回数据库最新
      const newOss = await this.prisma.ossConfig.findFirst();
      const newStorage = await this.prisma.storageConfig.findFirst();
      console.log('保存后的OSS配置:', JSON.stringify(newOss));
      console.log('保存后的存储配置:', JSON.stringify(newStorage));
      return {
        success: true,
        message: 'OSS配置已更新',
        config: {
          oss: newOss || {
            accessKeyId: '',
            accessKeySecret: '',
            bucket: '',
            region: 'cn-hangzhou',
            endpoint: '',
            domain: ''
          },
          storage: newStorage || {
            defaultStorage: 'local',
            maxFileSize: 100,
            enableCleanup: false,
            cleanupDays: 30
          },
        },
      };
    } catch (error) {
      console.error('保存OSS配置失败:', error);
      return {
        success: false,
        message: '保存OSS配置失败',
        error: error.message,
      };
    }
  }

  @Post('storage/test')
  @ApiOperation({ summary: '测试OSS连接' })
  @ApiResponse({ status: 200, description: '测试结果' })
  async testOSSConnection(@Body() ossConfig: OSSConfig) {
    console.log('测试OSS连接:', ossConfig);

    try {
      // 验证必要参数
      const { accessKeyId, accessKeySecret, bucket, region, endpoint } = ossConfig;
      
      if (!accessKeyId || !accessKeySecret || !bucket || !region || !endpoint) {
        throw new BadRequestException('请填写完整的OSS配置信息');
      }
      
      // 使用阿里云OSS SDK进行连接测试
      const OSS = require('ali-oss');
      const client = new OSS({
        accessKeyId,
        accessKeySecret,
        bucket,
        region,
        endpoint
      });
      
      try {
        // 尝试列出Bucket中的对象
        const result = await client.listV2({
          'max-keys': 1
        });
        
        console.log('OSS连接测试成功:', result);
        
        return {
          success: true,
          message: `OSS连接测试成功 - Bucket: ${bucket}, Region: ${region}`
        };
      } catch (ossError) {
        console.error('OSS操作失败:', ossError);
        throw new BadRequestException(`OSS连接测试失败: ${ossError.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('测试OSS连接失败:', error);
      throw new BadRequestException('OSS连接测试失败: ' + error.message);
    }
  }

  @Get('storage/stats')
  @ApiOperation({ summary: '获取存储统计信息' })
  @ApiResponse({ status: 200, description: '返回存储统计信息' })
  async getStorageStats() {
    try {
      // 获取上传文件的总大小（单位：字节）
      const totalSize = await this.prisma.$queryRaw<[{total: bigint}]>`
        SELECT COALESCE(SUM(size), 0) as total FROM posts
        WHERE size IS NOT NULL
      `;
      
      // 获取文件总数
      const totalFiles = await this.prisma.$queryRaw<[{count: bigint}]>`
        SELECT COUNT(*) as count FROM posts
      `;

      // 获取最近30天的上传数量
      const last30DaysUploads = await this.prisma.$queryRaw<[{count: bigint}]>`
        SELECT COUNT(*) as count FROM posts
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `;

      // 获取当前存储配置
      const storageConfig = await this.prisma.storageConfig.findFirst();
      
      const stats = {
        totalSize: Number(totalSize[0]?.total || 0),
        totalFiles: Number(totalFiles[0]?.count || 0),
        last30DaysUploads: Number(last30DaysUploads[0]?.count || 0),
        storageType: storageConfig ? storageConfig.defaultStorage : 'local',
        maxFileSize: storageConfig ? storageConfig.maxFileSize : 100,
      };

      console.log('存储统计信息:', stats);
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('获取存储统计信息失败:', error);
      throw new BadRequestException('获取存储统计信息失败: ' + error.message);
    }
  }

  @Post('storage/migrate')
  @ApiOperation({ summary: '迁移存储' })
  @ApiResponse({ status: 200, description: '迁移结果' })
  async migrateStorage(@Body() body: { targetStorage: 'local' | 'oss' }) {
    try {
      console.log('迁移存储请求:', body);
      const { targetStorage } = body;
      
      if (!targetStorage || (targetStorage !== 'local' && targetStorage !== 'oss')) {
        throw new BadRequestException('无效的目标存储类型，必须是 local 或 oss');
      }
      
      // 获取当前存储配置
      const storageConfig = await this.prisma.storageConfig.findFirst();
      const ossConfig = await this.prisma.ossConfig.findFirst();
      
      if (!storageConfig) {
        throw new BadRequestException('未找到存储配置');
      }
      
      if (!ossConfig && targetStorage === 'oss') {
        throw new BadRequestException('未找到OSS配置，请先配置阿里云OSS');
      }
      
      // 实际迁移逻辑
      let migratedFiles = 0;
      let skippedFiles = 0;
      let totalFiles = 0;
      
      // 导入所需模块
      const fs = require('fs');
      const path = require('path');
      const OSS = require('ali-oss');
      const { promisify } = require('util');
      const readdir = promisify(fs.readdir);
      const stat = promisify(fs.stat);
      
      // 创建或获取迁移记录文件
      const migrationRecordPath = path.join(process.cwd(), 'migration-records.json');
      let migrationRecords = {};
      
      // 尝试读取现有迁移记录
      try {
        if (fs.existsSync(migrationRecordPath)) {
          const recordContent = await fs.promises.readFile(migrationRecordPath, 'utf8');
          migrationRecords = JSON.parse(recordContent);
          console.log(`加载了 ${Object.keys(migrationRecords).length} 条迁移记录`);
        }
      } catch (recordError) {
        console.error('读取迁移记录失败，将创建新记录:', recordError);
        migrationRecords = {};
      }
      
      if (targetStorage === 'oss' && ossConfig) {
        console.log('开始从本地迁移到OSS...');
        
        // 初始化OSS客户端
        const client = new OSS({
          accessKeyId: ossConfig.accessKeyId,
          accessKeySecret: ossConfig.accessKeySecret,
          bucket: ossConfig.bucket,
          region: ossConfig.region,
          endpoint: ossConfig.endpoint,
          timeout: 300000, // 设置超时时间为5分钟
          secure: true, // 使用HTTPS
          cname: false, // 禁用自定义域名，使用阿里云官方域名
          useFetch: false // 不使用fetch API，使用默认的XMLHttpRequest
        });
        
        // 递归获取所有文件
        const getAllFiles = async (dir) => {
          const files = await readdir(dir);
          const allFiles = await Promise.all(files.map(async file => {
            const filePath = path.join(dir, file);
            const stats = await stat(filePath);
            if (stats.isDirectory()) {
              return getAllFiles(filePath);
            } else {
              return filePath;
            }
          }));
          
          return allFiles.flat();
        };
        
        try {
          // 获取上传目录下的所有文件
          const uploadsDir = path.join(process.cwd(), 'uploads');
          const allFiles = await getAllFiles(uploadsDir);
          
          totalFiles = allFiles.length;
          console.log(`找到 ${totalFiles} 个文件需要检查迁移`);
          
          // 上传文件到OSS
          for (let i = 0; i < allFiles.length; i++) {
            const filePath = allFiles[i];
            try {
              // 计算相对路径，用作OSS对象键
              const relativePath = filePath.substring(uploadsDir.length + 1).replace(/\\/g, '/');
              
              // 检查文件是否已经迁移过
              if (migrationRecords[relativePath] === 'oss') {
                console.log(`[${i+1}/${totalFiles}] 跳过已迁移文件: ${relativePath}`);
                skippedFiles++;
                continue;
              }
              
              console.log(`[${i+1}/${totalFiles}] 迁移文件: ${relativePath}`);
              
              // 获取文件大小
              const fileStats = await stat(filePath);
              const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
              
              // 上传到OSS
              const startTime = Date.now();
              await client.put(relativePath, filePath);
              const endTime = Date.now();
              const timeUsed = ((endTime - startTime) / 1000).toFixed(2);
              
              console.log(`[${i+1}/${totalFiles}] 迁移完成: ${relativePath} (${fileSizeMB}MB, 用时${timeUsed}秒)`);
              migratedFiles++;
              
              // 记录已迁移的文件
              migrationRecords[relativePath] = 'oss';
              
              // 每迁移10个文件输出一次进度并保存迁移记录
              if (migratedFiles % 10 === 0 || migratedFiles + skippedFiles === totalFiles) {
                console.log(`迁移进度: ${migratedFiles + skippedFiles}/${totalFiles} (${Math.round((migratedFiles + skippedFiles)/totalFiles*100)}%)`);
                await fs.promises.writeFile(migrationRecordPath, JSON.stringify(migrationRecords, null, 2));
              }

              // 更新数据库中的文件URL
              await this.updateFileUrlInDatabase(relativePath, ossConfig);
            } catch (fileError) {
              console.error(`迁移文件失败: ${filePath}`, fileError);
            }
          }
          
          // 确保最后保存一次迁移记录
          await fs.promises.writeFile(migrationRecordPath, JSON.stringify(migrationRecords, null, 2));
          
        } catch (fsError) {
          console.error('读取文件系统失败:', fsError);
          throw new BadRequestException('读取文件系统失败: ' + fsError.message);
        }
      } else if (targetStorage === 'local' && ossConfig) {
        console.log('开始从OSS迁移到本地...');
        
        // 初始化OSS客户端
        const client = new OSS({
          accessKeyId: ossConfig.accessKeyId,
          accessKeySecret: ossConfig.accessKeySecret,
          bucket: ossConfig.bucket,
          region: ossConfig.region,
          endpoint: ossConfig.endpoint,
          timeout: 120000 // 设置超时时间为2分钟
        });
        
        try {
          // 列出OSS中的所有对象
          let continuationToken = null;
          let objects: Array<{name: string, size: number}> = [];
          let isTruncated = true;
          
          console.log('正在获取OSS对象列表...');
          while (isTruncated) {
            const result = await client.listV2({
              'max-keys': 1000,
              'continuation-token': continuationToken
            });
            
            objects = objects.concat(result.objects || []);
            continuationToken = result.nextContinuationToken;
            isTruncated = result.isTruncated;
            
            console.log(`已获取 ${objects.length} 个对象信息`);
          }
          
          totalFiles = objects.length;
          console.log(`找到 ${totalFiles} 个对象需要检查下载`);
          
          // 下载文件到本地
          for (let i = 0; i < objects.length; i++) {
            const object = objects[i];
            try {
              const localPath = path.join(process.cwd(), 'uploads', object.name);
              
              // 检查文件是否已经迁移过
              if (migrationRecords[object.name] === 'local') {
                console.log(`[${i+1}/${totalFiles}] 跳过已下载文件: ${object.name}`);
                skippedFiles++;
                continue;
              }
              
              // 确保目录存在
              const dir = path.dirname(localPath);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              
              const fileSizeMB = (object.size / (1024 * 1024)).toFixed(2);
              console.log(`[${i+1}/${totalFiles}] 下载文件: ${object.name} (${fileSizeMB}MB)`);
              
              // 下载文件
              const startTime = Date.now();
              await client.get(object.name, localPath);
              const endTime = Date.now();
              const timeUsed = ((endTime - startTime) / 1000).toFixed(2);
              
              console.log(`[${i+1}/${totalFiles}] 下载完成: ${object.name} (用时${timeUsed}秒)`);
              migratedFiles++;
              
              // 记录已迁移的文件
              migrationRecords[object.name] = 'local';
              
              // 每迁移10个文件输出一次进度并保存迁移记录
              if (migratedFiles % 10 === 0 || migratedFiles + skippedFiles === totalFiles) {
                console.log(`迁移进度: ${migratedFiles + skippedFiles}/${totalFiles} (${Math.round((migratedFiles + skippedFiles)/totalFiles*100)}%)`);
                await fs.promises.writeFile(migrationRecordPath, JSON.stringify(migrationRecords, null, 2));
              }

              // 更新数据库中的文件URL
              await this.updateFileUrlInDatabase(object.name, ossConfig);
            } catch (fileError) {
              console.error(`下载文件失败: ${object.name}`, fileError);
            }
          }
          
          // 确保最后保存一次迁移记录
          await fs.promises.writeFile(migrationRecordPath, JSON.stringify(migrationRecords, null, 2));
          
        } catch (ossError) {
          console.error('从OSS获取对象列表失败:', ossError);
          throw new BadRequestException('从OSS获取对象列表失败: ' + ossError.message);
        }
      }
      
      console.log(`迁移完成: 成功迁移 ${migratedFiles} 个文件, 跳过 ${skippedFiles} 个已迁移文件, 总计 ${totalFiles} 个文件`);
      
      // 更新存储配置
      await this.prisma.storageConfig.update({
        where: { id: storageConfig.id },
        data: { defaultStorage: targetStorage }
      });
      
      return {
        success: true,
        message: `已成功将文件迁移到${targetStorage === 'local' ? '本地存储' : 'OSS存储'}`,
        migratedFiles: migratedFiles,
        skippedFiles: skippedFiles,
        totalFiles: totalFiles,
        targetStorage: targetStorage
      };
    } catch (error) {
      console.error('迁移存储失败:', error);
      throw new BadRequestException('迁移存储失败: ' + error.message);
    }
  }

  // 更新数据库中的文件URL
  private async updateFileUrlInDatabase(relativePath: string, ossConfig: OssConfig): Promise<void> {
    try {
      console.log(`更新数据库URL: ${relativePath}`);
      
      // 获取当前存储配置
      const storageConfig = await this.prisma.storageConfig.findFirst();
      if (!storageConfig) return;
      
      // 根据当前存储配置确定URL前缀
      const isOssStorage = storageConfig.defaultStorage === 'oss';
      
      // 构建新的URL
      let newUrl: string;
      if (isOssStorage) {
        // OSS URL
        const domain = ossConfig.domain || `https://${ossConfig.bucket}.${ossConfig.endpoint}`;
        newUrl = `${domain}/${relativePath.startsWith('/') ? relativePath.substring(1) : relativePath}`;
      } else {
        // 本地URL
        newUrl = `/uploads/${relativePath.startsWith('/') ? relativePath.substring(1) : relativePath}`;
      }
      
      console.log(`新URL: ${newUrl}`);
      
      // 查找所有包含此路径的记录并更新
      // 使用原始SQL查询，避免Prisma模型类型问题
      const localUrl = `/uploads/${relativePath}`;
      
      try {
        // 更新帖子表
        await this.prisma.$executeRaw`
          UPDATE posts 
          SET fileUrl = ${newUrl} 
          WHERE fileUrl = ${localUrl}
        `;
        
        await this.prisma.$executeRaw`
          UPDATE posts 
          SET thumbnailUrl = ${newUrl} 
          WHERE thumbnailUrl = ${localUrl}
        `;
      } catch (error) {
        console.error('更新帖子表失败:', error);
      }
      
      try {
        // 更新用户表
        await this.prisma.$executeRaw`
          UPDATE users 
          SET avatarUrl = ${newUrl} 
          WHERE avatarUrl = ${localUrl}
        `;
      } catch (error) {
        console.error('更新用户表失败:', error);
      }
      
      try {
        // 更新笔记表
        await this.prisma.$executeRaw`
          UPDATE notes 
          SET coverImageUrl = ${newUrl} 
          WHERE coverImageUrl = ${localUrl}
        `;
      } catch (error) {
        console.error('更新笔记表失败:', error);
      }
      
      try {
        // 更新资源表
        await this.prisma.$executeRaw`
          UPDATE resources 
          SET coverImageUrl = ${newUrl} 
          WHERE coverImageUrl = ${localUrl}
        `;
      } catch (error) {
        console.error('更新资源表失败:', error);
      }
      
      try {
        // 更新AI平台表
        await this.prisma.$executeRaw`
          UPDATE aIPlatforms 
          SET logoUrl = ${newUrl} 
          WHERE logoUrl = ${localUrl}
        `;
      } catch (error) {
        console.error('更新AI平台表失败:', error);
      }
      
      try {
        // 更新创作者表
        await this.prisma.$executeRaw`
          UPDATE creators 
          SET backgroundUrl = ${newUrl} 
          WHERE backgroundUrl = ${localUrl}
        `;
      } catch (error) {
        console.error('更新创作者表失败:', error);
      }
      
      try {
        // 更新筛选表
        await this.prisma.$executeRaw`
          UPDATE screenings 
          SET videoUrl = ${newUrl} 
          WHERE videoUrl = ${localUrl}
        `;
      } catch (error) {
        console.error('更新筛选表失败:', error);
      }
      
      try {
        // 更新公告表
        await this.prisma.$executeRaw`
          UPDATE announcements 
          SET imageUrl = ${newUrl} 
          WHERE imageUrl = ${localUrl}
        `;
      } catch (error) {
        console.error('更新公告表失败:', error);
      }
      
      console.log(`数据库URL更新完成: ${relativePath}`);
    } catch (error) {
      console.error(`更新数据库URL失败: ${relativePath}`, error);
    }
  }
}