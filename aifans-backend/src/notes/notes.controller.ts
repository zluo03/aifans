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
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User } from '../types';
import { UserStatusGuard, RequiredAction, RequireAction } from '../auth/guards/user-status.guard';

@ApiTags('笔记')
@Controller('notes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @ApiOperation({ summary: '创建笔记' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @UseGuards(UserStatusGuard)
  @RequireAction(RequiredAction.CREATE_NOTE)
  @Post()
  create(@Body() createNoteDto: CreateNoteDto, @Req() req: any) {
    return this.notesService.create(createNoteDto, req.user as User);
  }

  @ApiOperation({ summary: '获取所有笔记' })
  @ApiQuery({ name: 'userId', required: false, description: '用户ID筛选' })
  @ApiQuery({ name: 'categoryId', required: false, description: '分类ID筛选' })
  @ApiQuery({ name: 'query', required: false, description: '搜索关键词' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiQuery({ name: 'orderBy', required: false, enum: ['latest', 'oldest', 'popular', 'views', 'favorites'], description: '排序方式' })
  @ApiQuery({ name: 'timeRange', required: false, enum: ['today', 'week', 'month', 'year'], description: '时间范围' })
  @ApiResponse({ status: 200, description: '成功' })
  @Get()
  findAll(
    @Query('userId', new DefaultValuePipe(0), ParseIntPipe) userId: number,
    @Query('categoryId', new DefaultValuePipe(0), ParseIntPipe) categoryId: number,
    @Query('query') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('orderBy') orderBy: string = 'latest',
    @Query('timeRange') timeRange?: string,
  ) {
    return this.notesService.findAll(
      userId || undefined,
      categoryId || undefined,
      query,
      page,
      limit,
      false, // includeHidden = false (普通用户不能看隐藏的)
      orderBy,
      timeRange
    );
  }

  @ApiOperation({ summary: '获取笔记详情' })
  @ApiParam({ name: 'id', description: '笔记ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 404, description: '笔记不存在' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.notesService.findOne(id, true, req.user?.id);
  }

  @ApiOperation({ summary: '更新笔记' })
  @ApiParam({ name: 'id', description: '笔记ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '笔记不存在' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNoteDto: UpdateNoteDto,
    @Req() req: any,
  ) {
    return this.notesService.update(id, updateNoteDto, req.user as User);
  }

  @ApiOperation({ summary: '删除笔记' })
  @ApiParam({ name: 'id', description: '笔记ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '笔记不存在' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.notesService.remove(id, req.user as User);
  }

  @ApiOperation({ summary: '点赞/取消点赞笔记' })
  @ApiParam({ name: 'id', description: '笔记ID' })
  @ApiResponse({ status: 200, description: '操作成功' })
  @ApiResponse({ status: 404, description: '笔记不存在' })
  @UseGuards(UserStatusGuard)
  @RequireAction(RequiredAction.LIKE)
  @Post(':id/like')
  toggleLike(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.notesService.toggleLike(id, req.user.id);
  }

  @ApiOperation({ summary: '收藏/取消收藏笔记' })
  @ApiParam({ name: 'id', description: '笔记ID' })
  @ApiResponse({ status: 200, description: '操作成功' })
  @ApiResponse({ status: 404, description: '笔记不存在' })
  @UseGuards(UserStatusGuard)
  @RequireAction(RequiredAction.FAVORITE)
  @Post(':id/favorite')
  toggleFavorite(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.notesService.toggleFavorite(id, req.user.id);
  }

  @ApiOperation({ summary: '获取用户点赞的笔记' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '成功' })
  @Get('user/liked')
  getUserLikedNotes(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.notesService.getUserLikedNotes(req.user.id, page, limit);
  }

  @ApiOperation({ summary: '获取用户收藏的笔记' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '成功' })
  @Get('user/favorited')
  getUserFavoritedNotes(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.notesService.getUserFavoritedNotes(req.user.id, page, limit);
  }
} 