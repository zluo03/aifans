import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { CreateRequestDto, UpdateRequestDto, CreateResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { RequestStatus, ResponseStatus } from '../types/prisma-enums';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('requests')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get('user/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的需求列表' })
  @ApiResponse({ status: 200, description: '返回我的需求列表和分页信息' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findUserRequests(
    @Req() req: RequestWithUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.requestsService.findUserRequests(
      req.user.id,
      page ? +page : 1,
      limit ? +limit : 10,
    );
  }

  @Get('user/my-responses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的响应列表' })
  @ApiResponse({ status: 200, description: '返回我的响应列表和分页信息' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findUserResponses(
    @Req() req: RequestWithUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.requestsService.findUserResponses(
      req.user.id,
      page ? +page : 1,
      limit ? +limit : 10,
    );
  }

  @Get('responses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取响应详情' })
  @ApiResponse({ status: 200, description: '返回响应详情' })
  @ApiResponse({ status: 404, description: '响应不存在' })
  @ApiResponse({ status: 403, description: '没有权限查看此响应' })
  async findResponse(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.requestsService.findResponseById(req.user.id, id);
  }

  @Get()
  @ApiOperation({ summary: '获取需求列表' })
  @ApiResponse({ status: 200, description: '返回需求列表和分页信息' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: RequestStatus })
  @ApiQuery({ name: 'priority', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('categoryId') categoryId?: number,
    @Query('status') status?: RequestStatus,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
  ) {
    return this.requestsService.findAllRequests(
      page ? +page : 1,
      limit ? +limit : 10,
      categoryId ? +categoryId : undefined,
      status,
      priority,
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取需求详情' })
  @ApiResponse({ status: 200, description: '返回需求详情' })
  @ApiResponse({ status: 404, description: '需求不存在' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const userId = req.user ? req.user['id'] : undefined;
    return this.requestsService.findRequestById(id, userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建需求' })
  @ApiResponse({ status: 201, description: '返回创建的需求' })
  async create(@Body() createRequestDto: CreateRequestDto, @Req() req: RequestWithUser) {
    return this.requestsService.createRequest(req.user.id, createRequestDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新需求' })
  @ApiResponse({ status: 200, description: '返回更新后的需求' })
  @ApiResponse({ status: 404, description: '需求不存在' })
  @ApiResponse({ status: 403, description: '没有权限更新此需求' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRequestDto: UpdateRequestDto,
    @Req() req: RequestWithUser,
  ) {
    return this.requestsService.updateRequest(req.user.id, id, updateRequestDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除需求' })
  @ApiResponse({ status: 200, description: '返回成功信息' })
  @ApiResponse({ status: 404, description: '需求不存在' })
  @ApiResponse({ status: 403, description: '没有权限删除此需求' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.requestsService.deleteRequest(req.user.id, id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '点赞/取消点赞需求' })
  @ApiResponse({ status: 200, description: '返回点赞状态' })
  @ApiResponse({ status: 404, description: '需求不存在' })
  async like(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.requestsService.likeRequest(req.user.id, id);
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '收藏/取消收藏需求' })
  @ApiResponse({ status: 200, description: '返回收藏状态' })
  @ApiResponse({ status: 404, description: '需求不存在' })
  async favorite(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.requestsService.favoriteRequest(req.user.id, id);
  }

  @Post(':id/responses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '回复需求' })
  @ApiResponse({ status: 201, description: '返回创建的回复' })
  @ApiResponse({ status: 404, description: '需求不存在' })
  @ApiResponse({ status: 400, description: '不能回复自己的需求' })
  async createResponse(
    @Param('id', ParseIntPipe) id: number,
    @Body() createResponseDto: CreateResponseDto,
    @Req() req: RequestWithUser,
  ) {
    return this.requestsService.createResponse(req.user.id, id, createResponseDto);
  }

  @Patch('responses/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新响应状态' })
  @ApiResponse({ status: 200, description: '返回更新后的响应' })
  @ApiResponse({ status: 404, description: '响应不存在' })
  @ApiResponse({ status: 403, description: '没有权限更新此响应状态' })
  async updateResponseStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ResponseStatus,
    @Req() req: RequestWithUser,
  ) {
    return this.requestsService.updateResponseStatus(req.user.id, id, status);
  }
} 