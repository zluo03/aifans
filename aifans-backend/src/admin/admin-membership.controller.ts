import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdminMembershipService } from './admin-membership.service';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateMembershipProductDto, UpdateMembershipProductDto } from './dto/membership.dto';
import { Role } from '../types/prisma-enums';

@ApiTags('管理员 - 会员产品')
@Controller('admin/membership/products')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class AdminMembershipController {
  constructor(private readonly adminMembershipService: AdminMembershipService) {}

  @Get()
  @ApiOperation({ summary: '获取所有会员产品' })
  async findAll() {
    return this.adminMembershipService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个会员产品' })
  @ApiParam({ name: 'id', description: '会员产品ID' })
  async findOne(@Param('id') id: string) {
    return this.adminMembershipService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: '创建会员产品' })
  async create(@Body() createDto: CreateMembershipProductDto) {
    return this.adminMembershipService.create(createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新会员产品' })
  @ApiParam({ name: 'id', description: '会员产品ID' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateMembershipProductDto) {
    return this.adminMembershipService.update(+id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除会员产品' })
  @ApiParam({ name: 'id', description: '会员产品ID' })
  async remove(@Param('id') id: string) {
    return this.adminMembershipService.remove(+id);
  }

  @Get('/orders')
  @ApiOperation({ summary: '获取所有支付订单' })
  async findAllOrders() {
    return this.adminMembershipService.findAllOrders();
  }
} 