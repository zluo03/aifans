import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UploadLimitService } from '../admin/upload-limit.service';

@ApiTags('公共 - 上传限制')
@Controller('public/settings')
export class PublicUploadLimitController {
  constructor(private readonly uploadLimitService: UploadLimitService) {}

  @Get('upload-limits')
  @ApiOperation({ summary: '获取所有上传限制配置（公共访问）' })
  async getAllLimits() {
    try {
      console.log('公共API: 获取所有上传限制配置');
      // 从数据库获取各模块的配置
      const notesLimit = await this.uploadLimitService.getLimitByModule('notes');
      const inspirationLimit = await this.uploadLimitService.getLimitByModule('inspiration');
      const screeningsLimit = await this.uploadLimitService.getLimitByModule('screenings');
      const creatorLimit = await this.uploadLimitService.getLimitByModule('creator');

      // 转换为前端需要的格式
      return {
        success: true,
        limits: {
          notes: {
            imageSize: notesLimit.imageMaxSizeMB,
            videoSize: notesLimit.videoMaxSizeMB,
          },
          inspiration: {
            imageSize: inspirationLimit.imageMaxSizeMB,
            videoSize: inspirationLimit.videoMaxSizeMB,
          },
          screenings: {
            videoSize: screeningsLimit.videoMaxSizeMB,
          },
          creator: {
            imageMaxSizeMB: creatorLimit.imageMaxSizeMB,
            videoMaxSizeMB: creatorLimit.videoMaxSizeMB,
            audioMaxSizeMB: creatorLimit.audioMaxSizeMB,
          },
        }
      };
    } catch (error) {
      console.error('公共API: 获取上传限制配置失败:', error);
      // 发生错误时返回默认值
      return {
        success: false,
        message: '获取上传限制配置失败',
        limits: {
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
        }
      };
    }
  }

  @Get('upload-limits/:module')
  @ApiOperation({ summary: '获取指定模块的上传限制（公共访问）' })
  async getModuleLimits(@Param('module') module: string) {
    try {
      console.log(`公共API: 获取${module}模块的上传限制`);
      const limit = await this.uploadLimitService.getLimitByModule(module);
      
      // 根据模块类型返回适当的格式
      if (module === 'notes') {
        return {
          imageMaxSizeMB: limit.imageMaxSizeMB,
          videoMaxSizeMB: limit.videoMaxSizeMB,
        };
      } else if (module === 'inspiration') {
        return {
          imageMaxSizeMB: limit.imageMaxSizeMB,
          videoMaxSizeMB: limit.videoMaxSizeMB,
        };
      } else if (module === 'screenings') {
        return {
          imageMaxSizeMB: 10, // 封面图片限制
          videoMaxSizeMB: limit.videoMaxSizeMB,
        };
      } else if (module === 'creator') {
        return {
          imageMaxSizeMB: limit.imageMaxSizeMB,
          videoMaxSizeMB: limit.videoMaxSizeMB,
          audioMaxSizeMB: limit.audioMaxSizeMB,
        };
      } else if (module === 'resources') {
        // 资源模块使用特殊配置
        return {
          imageMaxSizeMB: 10, // 资源图片限制
          videoMaxSizeMB: 100, // 资源视频限制
          audioMaxSizeMB: 20, // 资源音频限制
          archiveMaxSizeMB: 500, // 资源压缩文件限制
        };
      } else {
        return {
          imageMaxSizeMB: 5,
          videoMaxSizeMB: 50,
        };
      }
    } catch (error) {
      console.error(`公共API: 获取${module}模块上传限制失败:`, error);
      // 返回默认值
      return {
        imageMaxSizeMB: 5,
        videoMaxSizeMB: 50,
      };
    }
  }
} 