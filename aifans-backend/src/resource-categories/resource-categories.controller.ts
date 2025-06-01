import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ResourceCategoriesService } from './resource-categories.service';
import { CreateResourceCategoryDto } from './dto/create-resource-category.dto';
import { UpdateResourceCategoryDto } from './dto/update-resource-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('resource-categories')
export class ResourceCategoriesController {
  constructor(private readonly resourceCategoriesService: ResourceCategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() createResourceCategoryDto: CreateResourceCategoryDto) {
    return this.resourceCategoriesService.create(createResourceCategoryDto);
  }

  @Get()
  findAll() {
    return this.resourceCategoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resourceCategoriesService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() updateResourceCategoryDto: UpdateResourceCategoryDto) {
    return this.resourceCategoriesService.update(+id, updateResourceCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.resourceCategoriesService.remove(+id);
  }
} 