import { Body, Controller, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { ChangePasswordDto, PaginationQueryDto, UpdateUserDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { mapUserPasswordField } from '../types/prisma-extend';

// 扩展Express的Request接口，添加user属性
interface RequestWithUser extends Request {
  user: { id: number; role: string };
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '成功获取用户信息' })
  async getCurrentUser(@CurrentUser() user: any) {
    // 获取完整用户信息
    const fullUser = await this.usersService.findUserById(user.id);
    
    // 如果用户不存在，返回空对象
    if (!fullUser) {
      return { message: '用户不存在' };
    }
    
    // 使用类型转换函数并移除敏感信息
    const userWithHash = mapUserPasswordField(fullUser);
    const { passwordHash, ...result } = userWithHash;
    
    return result;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新个人资料' })
  @ApiResponse({ status: 200, description: '返回更新后的用户信息' })
  @ApiResponse({ status: 400, description: '更新失败' })
  async updateProfile(@CurrentUser() user: any, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(user.id, updateUserDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改密码' })
  @ApiResponse({ status: 200, description: '密码修改成功' })
  @ApiResponse({ status: 400, description: '当前密码错误' })
  async changePassword(@CurrentUser() user: any, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(user.id, changePasswordDto);
  }

  @Get('me/likes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的点赞列表' })
  @ApiResponse({ status: 200, description: '返回点赞列表及分页信息' })
  async getUserLikes(@CurrentUser() user: any, @Query() query: PaginationQueryDto) {
    return this.usersService.getUserLikes(user.id, query);
  }

  @Get('me/favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的收藏列表' })
  @ApiResponse({ status: 200, description: '返回收藏列表及分页信息' })
  async getUserFavorites(@CurrentUser() user: any, @Query() query: PaginationQueryDto) {
    return this.usersService.getUserFavorites(user.id, query);
  }
}
