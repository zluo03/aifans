import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { SpiritPostsService } from './spirit-posts.service';
import { CreateSpiritPostDto, UpdateSpiritPostDto, CreateMessageDto, MarkCompletedDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '../types';
import { UserStatusGuard, RequiredAction, RequireAction } from '../auth/guards/user-status.guard';

@ApiTags('灵贴')
@Controller('spirit-posts')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class SpiritPostsController {
  constructor(private readonly spiritPostsService: SpiritPostsService) {}

  @ApiOperation({ summary: '创建灵贴' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @UseGuards(UserStatusGuard)
  @RequireAction(RequiredAction.CREATE_SPIRIT_POST)
  @Post()
  create(@Body() createDto: CreateSpiritPostDto, @Req() req: any) {
    return this.spiritPostsService.create(createDto, req.user as User);
  }

  @ApiOperation({ summary: '获取灵贴列表' })
  @ApiResponse({ status: 200, description: '成功' })
  @Get()
  findAll(@Req() req: any) {
    return this.spiritPostsService.findAll(req.user as User);
  }

  @ApiOperation({ summary: '获取我的灵贴' })
  @ApiResponse({ status: 200, description: '成功' })
  @Get('my-posts')
  getMyPosts(@Req() req: any) {
    return this.spiritPostsService.getMyPosts(req.user as User);
  }

  @ApiOperation({ summary: '获取我认领的灵贴' })
  @ApiResponse({ status: 200, description: '成功' })
  @Get('my-claims')
  getMyClaimedPosts(@Req() req: any) {
    return this.spiritPostsService.getMyClaimedPosts(req.user as User);
  }

  @ApiOperation({ summary: '获取未读消息总数' })
  @ApiResponse({ status: 200, description: '成功' })
  @Get('unread-count')
  getUnreadMessageCount(@Req() req: any) {
    return this.spiritPostsService.getUnreadMessageCount(req.user as User);
  }

  @ApiOperation({ summary: '获取灵贴详情' })
  @ApiParam({ name: 'id', description: '灵贴ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '灵贴不存在' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.spiritPostsService.findOne(id, req.user as User);
  }

  @ApiOperation({ summary: '更新灵贴' })
  @ApiParam({ name: 'id', description: '灵贴ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '灵贴不存在' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSpiritPostDto,
    @Req() req: any,
  ) {
    return this.spiritPostsService.update(id, updateDto, req.user as User);
  }

  @ApiOperation({ summary: '认领灵贴' })
  @ApiParam({ name: 'id', description: '灵贴ID' })
  @ApiResponse({ status: 201, description: '认领成功' })
  @ApiResponse({ status: 400, description: '已认领或不能认领自己的灵贴' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '灵贴不存在' })
  @UseGuards(UserStatusGuard)
  @RequireAction(RequiredAction.CLAIM_SPIRIT_POST)
  @Post(':id/claim')
  claim(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.spiritPostsService.claim(id, req.user as User);
  }

  @ApiOperation({ summary: '获取消息列表' })
  @ApiParam({ name: 'id', description: '灵贴ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '未认领该灵贴' })
  @ApiResponse({ status: 404, description: '灵贴不存在' })
  @Get(':id/messages')
  getMessages(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.spiritPostsService.getMessages(id, req.user as User);
  }

  @ApiOperation({ summary: '发送消息' })
  @ApiParam({ name: 'id', description: '灵贴ID' })
  @ApiResponse({ status: 201, description: '发送成功' })
  @ApiResponse({ status: 403, description: '未认领该灵贴' })
  @ApiResponse({ status: 404, description: '灵贴不存在' })
  @UseGuards(UserStatusGuard)
  @RequireAction(RequiredAction.COMMENT)
  @Post(':id/messages')
  sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() createMessageDto: CreateMessageDto,
    @Req() req: any,
  ) {
    return this.spiritPostsService.sendMessage(id, createMessageDto, req.user as User);
  }

  @ApiOperation({ summary: '回复消息（发布者专用）' })
  @ApiParam({ name: 'id', description: '灵贴ID' })
  @ApiParam({ name: 'receiverId', description: '接收者用户ID' })
  @ApiResponse({ status: 201, description: '回复成功' })
  @ApiResponse({ status: 403, description: '只有发布者可以回复' })
  @ApiResponse({ status: 404, description: '灵贴不存在' })
  @UseGuards(UserStatusGuard)
  @RequireAction(RequiredAction.COMMENT)
  @Post(':id/messages/reply/:receiverId')
  replyMessage(
    @Param('id', ParseIntPipe) id: number,
    @Param('receiverId', ParseIntPipe) receiverId: number,
    @Body() createMessageDto: CreateMessageDto,
    @Req() req: any,
  ) {
    return this.spiritPostsService.replyMessage(id, receiverId, createMessageDto, req.user as User);
  }

  @ApiOperation({ summary: '标记已认领' })
  @ApiParam({ name: 'id', description: '灵贴ID' })
  @ApiResponse({ status: 200, description: '标记成功' })
  @ApiResponse({ status: 400, description: '用户未产生双向对话' })
  @ApiResponse({ status: 403, description: '只有发布者可以标记' })
  @ApiResponse({ status: 404, description: '灵贴不存在' })
  @Post(':id/mark-completed')
  markCompleted(
    @Param('id', ParseIntPipe) id: number,
    @Body() markCompletedDto: MarkCompletedDto,
    @Req() req: any,
  ) {
    return this.spiritPostsService.markCompleted(id, markCompletedDto, req.user as User);
  }

  @ApiOperation({ summary: '标记消息为已读' })
  @ApiParam({ name: 'id', description: '灵贴ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '灵贴不存在' })
  @Post(':id/mark-read')
  markMessagesAsRead(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.spiritPostsService.markMessagesAsRead(id, req.user as User);
  }
} 