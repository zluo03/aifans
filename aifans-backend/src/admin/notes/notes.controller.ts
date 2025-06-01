import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Body,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotesService } from '../../notes/notes.service';
import { UpdateNoteDto } from '../../notes/dto';
import { Role } from '../../types/prisma-enums';

@ApiTags('管理员-笔记')
@Controller('admin/notes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @ApiOperation({ summary: '获取所有笔记（包括隐藏的）' })
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
      true, // includeHidden = true (管理员可以看隐藏的)
      orderBy,
      timeRange
    );
  }

  @ApiOperation({ summary: '获取笔记详情' })
  @ApiParam({ name: 'id', description: '笔记ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 404, description: '笔记不存在' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.notesService.findOne(id, false);
  }

  @ApiOperation({ summary: '管理员更新笔记' })
  @ApiParam({ name: 'id', description: '笔记ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '笔记不存在' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNoteDto: UpdateNoteDto,
    @Req() req: any,
  ) {
    return this.notesService.update(id, updateNoteDto, req.user);
  }

  @ApiOperation({ summary: '管理员删除笔记' })
  @ApiParam({ name: 'id', description: '笔记ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '笔记不存在' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.notesService.remove(id, req.user);
  }
} 