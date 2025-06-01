import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NoteCategoriesService } from './note-categories.service';

@ApiTags('笔记分类')
@Controller('note-categories')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class NoteCategoriesController {
  constructor(private readonly noteCategoriesService: NoteCategoriesService) {}

  @ApiOperation({ summary: '获取所有笔记分类' })
  @ApiResponse({ status: 200, description: '成功' })
  @Get()
  findAll() {
    return this.noteCategoriesService.findAll();
  }
} 