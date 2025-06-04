import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserStatusGuard } from '../auth/guards/user-status.guard';
import { UsersMessagesService } from './users-messages.service';
import { CreateUserMessageDto } from './dto/user-message.dto';

@Controller('users/messages')
export class UsersMessagesController {
  constructor(private readonly usersMessagesService: UsersMessagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, UserStatusGuard)
  async create(@Body() createUserMessageDto: CreateUserMessageDto, @Req() req) {
    return this.usersMessagesService.create(req.user.id, createUserMessageDto);
  }

  @Get('contacts')
  @UseGuards(JwtAuthGuard, UserStatusGuard)
  async getContacts(@Req() req) {
    return this.usersMessagesService.getContacts(req.user.id);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard, UserStatusGuard)
  async getUnreadCount(@Req() req) {
    return this.usersMessagesService.getUnreadCount(req.user.id);
  }

  @Get('with/:userId')
  @UseGuards(JwtAuthGuard, UserStatusGuard)
  async getMessagesWithUser(
    @Param('userId') userId: string,
    @Req() req,
    @Query('limit') limit = '20',
    @Query('offset') offset = '0',
  ) {
    return this.usersMessagesService.getMessagesWithUser(
      req.user.id,
      +userId,
      +limit,
      +offset,
    );
  }

  @Patch('read/:userId')
  @UseGuards(JwtAuthGuard, UserStatusGuard)
  async markAsRead(@Param('userId') userId: string, @Req() req) {
    return this.usersMessagesService.markAsRead(req.user.id, +userId);
  }
} 