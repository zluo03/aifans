import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { UploadLimitService } from './upload-limit.service';
import { UploadLimitDto, CreatorLimitDto } from './dto/upload-limit.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../types/prisma-enums';
import { UploadLimitData } from './upload-limit.service';

@ApiTags('管理员 - 上传限制')
@Controller('admin/settings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class UploadLimitController {
  constructor(private readonly uploadLimitService: UploadLimitService) {}

  @Get('upload-limits')
  @ApiOperation({ summary: '获取所有上传限制配置' })
  async getAllLimits() {
    try {
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
      console.error('获取上传限制配置失败:', error);
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

  @Get('upload-limits/creator')
  @ApiOperation({ summary: '获取创作者上传限制' })
  async getCreatorLimits() {
    try {
      // 从数据库获取创作者模块的配置
      const creatorLimit = await this.uploadLimitService.getLimitByModule('creator');
      return creatorLimit;
    } catch (error) {
      console.error('获取创作者上传限制失败:', error);
      // 发生错误时返回默认值
      return {
        imageMaxSizeMB: 5,
        videoMaxSizeMB: 50,
        audioMaxSizeMB: 20,
      };
    }
  }

  @Get('upload-limits/:module')
  @ApiOperation({ summary: '获取指定模块的上传限制' })
  async getModuleLimits(@Param('module') module: string) {
    try {
      console.log(`获取${module}模块的上传限制`);
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
      console.error(`获取${module}模块上传限制失败:`, error);
      // 返回默认值
      return {
        imageMaxSizeMB: 5,
        videoMaxSizeMB: 50,
      };
    }
  }

  @Post('upload-limits/creator')
  @ApiOperation({ summary: '设置创作者上传限制' })
  async setCreatorLimits(@Body() dto: CreatorLimitDto) {
    return this.uploadLimitService.setLimitByModule('creator', dto);
  }

  @Post('upload-limits')
  @ApiOperation({ summary: '设置所有上传限制' })
  async setAllLimits(@Body() body: { limits: UploadLimitDto }) {
    const { limits } = body;
    
    // 更新各个模块的限制
    await this.uploadLimitService.setLimitByModule('notes', {
      imageMaxSizeMB: limits.notes.imageSize,
      videoMaxSizeMB: limits.notes.videoSize,
      audioMaxSizeMB: 0,
    });
    
    await this.uploadLimitService.setLimitByModule('inspiration', {
      imageMaxSizeMB: limits.inspiration.imageSize,
      videoMaxSizeMB: limits.inspiration.videoSize,
      audioMaxSizeMB: 0,
    });
    
    await this.uploadLimitService.setLimitByModule('screenings', {
      imageMaxSizeMB: 0,
      videoMaxSizeMB: limits.screenings.videoSize,
      audioMaxSizeMB: 0,
    });
    
    return {
      success: true,
      message: '上传限制已更新'
    };
  }

  @Get('upload-stats')
  @ApiOperation({ summary: '获取上传统计信息' })
  async getUploadStats() {
    return {
      success: true,
      stats: {
        notes: {
          imageCount: await this.uploadLimitService.getImageCount('notes'),
          videoCount: await this.uploadLimitService.getVideoCount('notes'),
          totalSize: await this.uploadLimitService.getTotalSize('notes'),
        },
        inspiration: {
          imageCount: await this.uploadLimitService.getImageCount('inspiration'),
          videoCount: await this.uploadLimitService.getVideoCount('inspiration'),
          totalSize: await this.uploadLimitService.getTotalSize('inspiration'),
        },
        screenings: {
          videoCount: await this.uploadLimitService.getVideoCount('screenings'),
          totalSize: await this.uploadLimitService.getTotalSize('screenings'),
        },
      }
    };
  }

  @Get(':module')
  @ApiOperation({ summary: '获取指定模块的上传限制' })
  async getLimit(@Param('module') module: string) {
    return this.uploadLimitService.getLimitByModule(module);
  }

  @Post(':module')
  @ApiOperation({ summary: '设置指定模块的上传限制' })
  async setLimit(@Param('module') module: string, @Body() dto: UploadLimitDto) {
    let uploadLimitData: UploadLimitData;
    
    switch (module) {
      case 'notes':
        uploadLimitData = {
          imageMaxSizeMB: dto.notes.imageSize,
          videoMaxSizeMB: dto.notes.videoSize,
          audioMaxSizeMB: 0
        };
        break;
      case 'inspiration':
        uploadLimitData = {
          imageMaxSizeMB: dto.inspiration.imageSize,
          videoMaxSizeMB: dto.inspiration.videoSize,
          audioMaxSizeMB: 0
        };
        break;
      case 'screenings':
        uploadLimitData = {
          imageMaxSizeMB: 0,
          videoMaxSizeMB: dto.screenings.videoSize,
          audioMaxSizeMB: 0
        };
        break;
      default:
        throw new Error(`不支持的模块类型: ${module}`);
    }

    return this.uploadLimitService.setLimitByModule(module, uploadLimitData);
  }
}

// 添加一个新的控制器，用于公共访问的上传限制API
@ApiTags('公共 - 上传限制')
@Controller('public')
export class PublicUploadLimitController {
  constructor(private readonly uploadLimitService: UploadLimitService) {}

  @Get('settings/upload-limits')
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

  @Get('settings/upload-limits/:module')
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