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
    return {
      success: true,
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

  @Get('upload-limits/creator')
  @ApiOperation({ summary: '获取创作者上传限制' })
  async getCreatorLimits() {
    return {
      imageMaxSizeMB: 5,
      videoMaxSizeMB: 50,
      audioMaxSizeMB: 20,
    };
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