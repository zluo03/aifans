import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AiPlatformsService } from './ai-platforms.service';
import { AIPlatformType } from '../types';
import { CreateAIPlatformDto } from './dto/create-ai-platform.dto';
import { UpdateAIPlatformDto } from './dto/update-ai-platform.dto';
import { JwtAuthGuard, AdminGuard } from '../auth/guards';

@ApiTags('AI平台')
@Controller('ai-platforms')
export class AiPlatformsController {
  constructor(private readonly aiPlatformsService: AiPlatformsService) {}

  @ApiOperation({ summary: '获取所有AI平台（公共访问）' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: '平台类型 (IMAGE 或 VIDEO)',
    enum: AIPlatformType,
  })
  @ApiResponse({ status: 200, description: 'AI平台列表' })
  @Get()
  async findAll(@Query('type') type?: AIPlatformType) {
    if (type) {
      return this.aiPlatformsService.findAllByType(type);
    }
    return this.aiPlatformsService.findAll();
  }

  @ApiOperation({ summary: '获取单个AI平台' })
  @ApiResponse({ status: 200, description: 'AI平台详情' })
  @ApiResponse({ status: 404, description: 'AI平台不存在' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiPlatformsService.findOne(+id);
  }

  @ApiOperation({ summary: '获取指定平台的所有模型' })
  @ApiResponse({ status: 200, description: '模型列表' })
  @ApiResponse({ status: 404, description: 'AI平台不存在' })
  @Get(':id/models')
  getPlatformModels(@Param('id') id: string) {
    return this.aiPlatformsService.getPlatformModels(+id);
  }

  // 管理员路由
  @ApiOperation({ summary: '创建AI平台' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Post('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  async create(@Body() createAiPlatformDto: CreateAIPlatformDto) {
    return this.aiPlatformsService.create(createAiPlatformDto);
  }

  @ApiOperation({ summary: '更新AI平台' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  async update(
    @Param('id') id: string,
    @Body() updateAiPlatformDto: UpdateAIPlatformDto,
  ) {
    return this.aiPlatformsService.update(+id, updateAiPlatformDto);
  }

  @ApiOperation({ summary: '删除AI平台' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    return this.aiPlatformsService.remove(+id);
  }
} 