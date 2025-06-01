import { Controller, Get, Post, Body, Param, UseGuards, Req, ParseIntPipe, Query, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ScreeningsService } from './screenings.service';
import { AddScreeningCommentDto } from './dto/add-screening-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { UserStatusGuard, RequiredAction, RequireAction } from '../auth/guards/user-status.guard';

@ApiTags('screenings')
@Controller('screenings')
export class ScreeningsController {
  constructor(private readonly screeningsService: ScreeningsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取放映列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', type: Number })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词', type: String })
  @ApiQuery({ name: 'orderBy', required: false, enum: ['latest', 'oldest', 'popular', 'views'], description: '排序方式' })
  @ApiQuery({ name: 'timeRange', required: false, enum: ['today', 'week', 'month', 'year'], description: '时间范围' })
  @ApiResponse({ status: 200, description: '返回放映列表及分页信息' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('orderBy', new DefaultValuePipe('latest')) orderBy?: string,
    @Query('timeRange') timeRange?: string,
  ) {
    return this.screeningsService.findAllScreenings(page, limit, search, orderBy, timeRange);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取放映详情' })
  @ApiResponse({ status: 200, description: '返回放映详情' })
  @ApiResponse({ status: 404, description: '放映不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.screeningsService.findScreeningById(id, userId);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard, UserStatusGuard)
  @RequireAction(RequiredAction.LIKE)
  @ApiBearerAuth()
  @ApiOperation({ summary: '点赞/取消点赞放映' })
  @ApiResponse({ status: 200, description: '返回点赞状态' })
  @ApiResponse({ status: 404, description: '放映不存在' })
  async like(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.screeningsService.likeScreening(userId, id);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard, UserStatusGuard)
  @RequireAction(RequiredAction.COMMENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '添加弹幕评论' })
  @ApiResponse({ status: 201, description: '返回创建的评论' })
  @ApiResponse({ status: 404, description: '放映不存在' })
  async addComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() commentDto: AddScreeningCommentDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.id;
    return this.screeningsService.addCommentToScreening(userId, id, commentDto);
  }

  @Get(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取弹幕评论列表' })
  @ApiResponse({ status: 200, description: '返回弹幕评论列表' })
  @ApiResponse({ status: 404, description: '放映不存在' })
  async getComments(@Param('id', ParseIntPipe) id: number) {
    return this.screeningsService.getCommentsForScreening(id);
  }
}
