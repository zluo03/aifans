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
} from '@nestjs/common';
import { AdminPostsService } from './admin-posts.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../types/prisma-enums';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('管理员 - 灵感管理')
@Controller('admin/inspirations')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminPostsController {
  constructor(private readonly adminPostsService: AdminPostsService) {}

  @ApiOperation({ summary: '获取灵感作品列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', type: Number })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词', type: String })
  @ApiQuery({ name: 'mediaType', required: false, description: '媒体类型', enum: ['IMAGE', 'VIDEO'] })
  @ApiQuery({ name: 'status', required: false, description: '状态', enum: ['VISIBLE', 'HIDDEN', 'ADMIN_DELETED'] })
  @ApiResponse({ status: 200, description: '成功' })
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('mediaType') mediaType?: string,
    @Query('status') status?: string,
  ) {
    return this.adminPostsService.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      search,
      mediaType,
      status,
    });
  }

  @ApiOperation({ summary: '获取灵感作品详情' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 404, description: '作品不存在' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminPostsService.findOne(id);
  }

  @ApiOperation({ summary: '更新作品状态' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '作品不存在' })
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: { status: 'VISIBLE' | 'HIDDEN' | 'ADMIN_DELETED' },
  ) {
    return this.adminPostsService.updateStatus(id, updateStatusDto.status);
  }

  @ApiOperation({ summary: '删除作品' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '作品不存在' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminPostsService.remove(id);
  }
} 