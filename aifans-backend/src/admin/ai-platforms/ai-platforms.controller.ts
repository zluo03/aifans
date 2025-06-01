import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AIPlatformsService } from './ai-platforms.service';
import { CreateAIPlatformDto, UpdateAIPlatformDto } from '../../ai-platforms/dto';
import { CreateAIModelDto } from './dto/create-ai-model.dto';
import { UpdateAIModelDto } from './dto/update-ai-model.dto';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../types/prisma-enums';

@ApiTags('管理员-AI平台')
@Controller('admin/ai-platforms')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AiPlatformsController {
  constructor(private readonly aiPlatformsService: AIPlatformsService) {}

  @ApiOperation({ summary: '获取所有AI平台（包含模型）' })
  @ApiResponse({ status: 200, description: 'AI平台列表' })
  @Get()
  findAllPlatforms() {
    return this.aiPlatformsService.findAllPlatforms();
  }

  @ApiOperation({ summary: '获取单个AI平台（包含模型）' })
  @ApiResponse({ status: 200, description: 'AI平台详情' })
  @ApiResponse({ status: 404, description: 'AI平台不存在' })
  @Get(':id')
  findOnePlatform(@Param('id', ParseIntPipe) id: number) {
    return this.aiPlatformsService.findOnePlatform(id);
  }

  @ApiOperation({ summary: '创建AI平台' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Post()
  async createPlatform(@Body() createDto: CreateAIPlatformDto) {
    return this.aiPlatformsService.create(createDto);
  }

  @ApiOperation({ summary: '创建AI模型' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Post('models')
  createModel(@Body() createModelDto: CreateAIModelDto) {
    return this.aiPlatformsService.createModel(createModelDto);
  }

  @ApiOperation({ summary: '获取所有AI模型' })
  @ApiResponse({ status: 200, description: 'AI模型列表' })
  @ApiQuery({ name: 'platformId', required: false, description: '按平台ID筛选' })
  @Get('models')
  findAllModels(@Query('platformId') platformId?: string) {
    return this.aiPlatformsService.findAllModels(platformId ? +platformId : undefined);
  }

  @ApiOperation({ summary: '获取单个AI模型' })
  @ApiResponse({ status: 200, description: 'AI模型详情' })
  @ApiResponse({ status: 404, description: 'AI模型不存在' })
  @Get('models/:id')
  findOneModel(@Param('id', ParseIntPipe) id: number) {
    return this.aiPlatformsService.findOneModel(id);
  }

  @ApiOperation({ summary: '更新AI模型' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: 'AI模型不存在' })
  @Patch('models/:id')
  updateModel(@Param('id', ParseIntPipe) id: number, @Body() updateModelDto: UpdateAIModelDto) {
    return this.aiPlatformsService.updateModel(id, updateModelDto);
  }

  @ApiOperation({ summary: '删除AI模型' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: 'AI模型不存在' })
  @Delete('models/:id')
  removeModel(@Param('id', ParseIntPipe) id: number) {
    return this.aiPlatformsService.removeModel(id);
  }

  @ApiOperation({ summary: '获取指定平台的所有模型' })
  @ApiResponse({ status: 200, description: '模型列表' })
  @ApiResponse({ status: 404, description: 'AI平台不存在' })
  @Get(':platformId/models')
  getPlatformModels(@Param('platformId', ParseIntPipe) platformId: number) {
    return this.aiPlatformsService.getPlatformModels(platformId);
  }

  @ApiOperation({ summary: '删除AI平台' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: 'AI平台不存在' })
  @Delete(':id')
  async removePlatform(@Param('id', ParseIntPipe) id: number) {
    return this.aiPlatformsService.removePlatform(id);
  }

  @ApiOperation({ summary: '更新AI平台' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: 'AI平台不存在' })
  @Patch(':id')
  async updatePlatform(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAIPlatformDto
  ) {
    return this.aiPlatformsService.updatePlatform(id, updateDto);
  }
}
