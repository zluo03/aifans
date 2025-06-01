import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SensitiveWordsService } from './sensitive-words.service';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateSensitiveWordDto } from './dto/sensitive-word.dto';
import { Role } from '../types/prisma-enums';

@ApiTags('管理员 - 敏感词管理')
@Controller('admin/sensitive-words')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class SensitiveWordsController {
  constructor(private readonly sensitiveWordsService: SensitiveWordsService) {}

  @Get()
  @ApiOperation({ summary: '获取所有敏感词' })
  async findAll() {
    return this.sensitiveWordsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: '创建敏感词' })
  async create(@Body() createSensitiveWordDto: CreateSensitiveWordDto) {
    return this.sensitiveWordsService.create(createSensitiveWordDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除敏感词' })
  @ApiParam({ name: 'id', description: '敏感词ID' })
  async remove(@Param('id') id: string) {
    return this.sensitiveWordsService.remove(+id);
  }
} 