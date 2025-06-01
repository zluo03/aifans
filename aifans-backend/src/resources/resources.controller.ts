import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserStatusGuard, RequiredAction, RequireAction } from '../auth/guards/user-status.guard';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, UserStatusGuard)
  @RequireAction(RequiredAction.CREATE_CONTENT)
  create(@Body() createResourceDto: CreateResourceDto, @Req() req) {
    return this.resourcesService.create(req.user.id, createResourceDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string, 
    @Query('limit') limit?: string,
    @Query('query') query?: string,
    @Query('categoryId') categoryId?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const categoryIdNum = categoryId ? parseInt(categoryId, 10) : undefined;
    return this.resourcesService.findAll(pageNum, limitNum, query, categoryIdNum);
  }

  @Get('favorited')
  @UseGuards(JwtAuthGuard)
  getFavoritedResources(@Query('page') page?: string, @Query('limit') limit?: string, @Req() req?) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.resourcesService.getFavoritedResources(req.user.id, pageNum, limitNum);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req) {
    return this.resourcesService.findOne(+id, req.user);
  }

  @Get(':id/interactions')
  @UseGuards(JwtAuthGuard)
  getUserInteractions(@Param('id') id: string, @Req() req) {
    return this.resourcesService.getUserInteractions(+id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateResourceDto: UpdateResourceDto, @Req() req) {
    return this.resourcesService.update(+id, req.user.id, updateResourceDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req) {
    return this.resourcesService.remove(+id, req.user.id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard, UserStatusGuard)
  @RequireAction(RequiredAction.LIKE)
  toggleLike(@Param('id') id: string, @Req() req) {
    return this.resourcesService.toggleLike(+id, req.user.id);
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard, UserStatusGuard)
  @RequireAction(RequiredAction.FAVORITE)
  toggleFavorite(@Param('id') id: string, @Req() req) {
    return this.resourcesService.toggleFavorite(+id, req.user.id);
  }
} 