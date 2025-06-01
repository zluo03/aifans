import { Controller, Get, Patch, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto, UpdateUserStatusDto, UpdateUserRoleDto } from './dto/user.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Role } from '../types/prisma-enums';

@ApiTags('管理员 - 用户管理')
@Controller('admin/users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词(nickname或username)' })
  @ApiQuery({ name: 'role', required: false, description: '角色过滤' })
  @ApiQuery({ name: 'status', required: false, description: '状态过滤' })
  async findAll(
    @Query() paginationQuery: PaginationQueryDto,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminUsersService.findAll(paginationQuery, { search, role, status });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '更新用户状态' })
  @ApiParam({ name: 'id', description: '用户ID' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return this.adminUsersService.updateStatus(+id, updateUserStatusDto);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: '更新用户角色' })
  @ApiParam({ name: 'id', description: '用户ID' })
  async updateRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.adminUsersService.updateRole(+id, updateUserRoleDto);
  }

  @Post()
  @ApiOperation({ summary: '创建新用户' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.adminUsersService.create(createUserDto);
  }
} 