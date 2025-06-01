import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../types/prisma-enums';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('公告管理')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @ApiOperation({ summary: '获取有效公告列表（前端用户）' })
  @ApiResponse({ status: 200, description: '成功' })
  @Get('active')
  async getActiveAnnouncements(@Request() req: any) {
    const userId = req.user?.id;
    return this.announcementsService.getActiveAnnouncements(userId);
  }

  @ApiOperation({ summary: '记录用户查看公告' })
  @ApiResponse({ status: 200, description: '成功' })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('view/:id')
  async markAsViewed(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.announcementsService.markAsViewed(id, req.user.id);
  }

  @ApiOperation({ summary: '获取公告详情' })
  @ApiResponse({ status: 200, description: '成功' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.findOne(id);
  }
} 