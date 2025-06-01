import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RequestCategoriesService } from './request-categories.service';
import { CreateRequestCategoryDto, UpdateRequestCategoryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../types/prisma-enums';

@ApiTags('request-categories')
@Controller('request-categories')
export class RequestCategoriesController {
  constructor(private readonly categoriesService: RequestCategoriesService) {}

  @Get()
  @ApiOperation({ summary: '获取所有需求分类' })
  @ApiResponse({ status: 200, description: '返回所有需求分类' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定需求分类' })
  @ApiResponse({ status: 200, description: '返回指定需求分类' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }
}

@ApiTags('admin-request-categories')
@Controller('admin/request-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminRequestCategoriesController {
  constructor(private readonly categoriesService: RequestCategoriesService) {}

  @Post()
  @ApiOperation({ summary: '创建需求分类' })
  @ApiResponse({ status: 201, description: '返回创建的需求分类' })
  @ApiResponse({ status: 409, description: '分类名称已存在' })
  create(@Body() createCategoryDto: CreateRequestCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新需求分类' })
  @ApiResponse({ status: 200, description: '返回更新后的需求分类' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @ApiResponse({ status: 409, description: '分类名称已存在' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateRequestCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除需求分类' })
  @ApiResponse({ status: 200, description: '返回成功信息' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
} 