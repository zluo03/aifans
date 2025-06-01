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
import { AdminAnnouncementsService } from './admin-announcements.service';
import { CreateAnnouncementDto } from '../announcements/dto/create-announcement.dto';
import { UpdateAnnouncementDto } from '../announcements/dto/update-announcement.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../types/prisma-enums';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('管理员 - 公告管理')
@Controller('admin/announcements')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminAnnouncementsController {
  constructor(private readonly adminAnnouncementsService: AdminAnnouncementsService) {}

  @ApiOperation({ summary: '创建公告' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Post()
  async create(@Body() createAnnouncementDto: CreateAnnouncementDto) {
    return this.adminAnnouncementsService.create(createAnnouncementDto);
  }

  @ApiOperation({ summary: '获取公告列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', type: Number })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词', type: String })
  @ApiQuery({ name: 'isActive', required: false, description: '是否启用', type: Boolean })
  @ApiResponse({ status: 200, description: '成功' })
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.adminAnnouncementsService.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      search,
      isActive: isActive ? isActive === 'true' : undefined,
    });
  }

  @ApiOperation({ summary: '获取公告详情' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 404, description: '公告不存在' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminAnnouncementsService.findOne(id);
  }

  @ApiOperation({ summary: '更新公告' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '公告不存在' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ) {
    return this.adminAnnouncementsService.update(id, updateAnnouncementDto);
  }

  @ApiOperation({ summary: '删除公告' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '公告不存在' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminAnnouncementsService.remove(id);
  }

  @ApiOperation({ summary: '获取公告统计信息' })
  @ApiResponse({ status: 200, description: '成功' })
  @Get('stats/overview')
  async getStats() {
    return this.adminAnnouncementsService.getStats();
  }
} 