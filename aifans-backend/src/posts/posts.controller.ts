import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  InternalServerErrorException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto, PostQueryDto, UpdatePostDto } from './dto';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Logger } from '@nestjs/common';
import { UserStatusGuard, RequiredAction, RequireAction } from '../auth/guards/user-status.guard';

@ApiTags('作品')
@Controller('posts')
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  constructor(private readonly postsService: PostsService) {}

  @ApiOperation({ summary: '上传作品' })
  @ApiConsumes('multipart/form-data')
  @UseGuards(AuthGuard('jwt'), UserStatusGuard)
  @RequireAction(RequiredAction.UPLOAD_POST)
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '图片或视频文件',
        },
        type: {
          type: 'string',
          enum: ['IMAGE', 'VIDEO'],
          description: '作品类型',
        },
        title: {
          type: 'string',
          description: '作品标题（可选）',
        },
        aiPlatformId: {
          type: 'integer',
          description: 'AI平台ID',
        },
        modelUsed: {
          type: 'string',
          description: '使用的模型',
        },
        prompt: {
          type: 'string',
          description: '提示词',
        },
        videoCategory: {
          type: 'string',
          enum: ['IMAGE_TO_VIDEO', 'TEXT_TO_VIDEO', 'FRAME_INTERPOLATION', 'MULTI_IMAGE_REF'],
          description: '视频类别（仅视频）',
        },
        allowDownload: {
          type: 'boolean',
          description: '是否允许下载',
        },
      },
      required: ['file', 'type', 'aiPlatformId', 'modelUsed', 'prompt'],
    },
  })
  @ApiResponse({ status: 201, description: '上传成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createPost(
    @Req() req,
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      console.log('接收到的请求数据:', {
        dto: createPostDto,
        file: file ? {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        } : null,
        user: req.user,
        headers: {
          authorization: req.headers.authorization ? '存在' : '不存在',
          cookie: req.headers.cookie
        }
      });

      if (!file) {
        throw new BadRequestException('请选择要上传的文件');
      }

      if (!req.user || !req.user.id) {
        throw new BadRequestException('用户未登录或认证信息无效');
      }

      return await this.postsService.createPost(req.user.id, createPostDto, file);
    } catch (error) {
      console.error('创建作品失败:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('创建作品失败，请重试');
    }
  }

  @ApiOperation({ summary: '获取作品列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', type: Number })
  @ApiQuery({ name: 'type', required: false, description: '作品类型', enum: ['IMAGE', 'VIDEO'] })
  @ApiQuery({ name: 'aiPlatformId', required: false, description: 'AI平台ID', type: Number })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词', type: String })
  @ApiQuery({ name: 'onlyFavorites', required: false, description: '仅显示收藏', type: Boolean })
  @ApiQuery({ name: 'onlyMyPosts', required: false, description: '仅显示我的作品', type: Boolean })
  @ApiResponse({ status: 200, description: '成功' })
  @Get()
  async findAll(@Query() query: PostQueryDto, @Req() req) {
    try {
      // 手动解析JWT token以获取用户信息（如果存在）
      let userId: number | undefined = undefined;
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const jwt = require('jsonwebtoken');
          const secretKey = process.env.JWT_SECRET || 'your-secret-key';
          const decoded = jwt.verify(token, secretKey);
          userId = decoded.sub; // JWT payload中的用户ID通常存储在sub字段
          
          this.logger.log('成功解析JWT token:', { 
            userId,
            hasOnlyFavorites: query.onlyFavorites,
            hasOnlyMyPosts: query.onlyMyPosts
          });
        } catch (jwtError) {
          // JWT解析失败，忽略错误，继续以游客身份处理
          this.logger.warn('JWT token解析失败，以游客身份处理:', jwtError.message);
        }
      }

      this.logger.log('接收到作品列表请求:', {
        query,
        userId: userId || null,
        queryParams: req.query
      });

      const result = await this.postsService.findAllPosts(query, userId);
      
      this.logger.log(`作品列表查询成功: 返回${result.data.length}条记录`);
      return result;
    } catch (error) {
      this.logger.error('获取作品列表失败:', {
        query,
        error: error.message,
        stack: error.stack
      });
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('获取作品列表失败，请重试');
    }
  }

  @ApiOperation({ summary: '获取作品详情' })
  @ApiParam({ name: 'id', description: '作品ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 404, description: '作品不存在' })
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    // 获取作品详情不需要认证，但需要传递用户信息（如果有的话）
    const userId = req.user?.id || null;
    return this.postsService.findPostById(+id, userId);
  }

  @ApiOperation({ summary: '更新作品' })
  @ApiParam({ name: 'id', description: '作品ID' })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '作品不存在' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto, @Req() req) {
    return this.postsService.updatePost(req.user.id, +id, updatePostDto);
  }

  @ApiOperation({ summary: '删除作品' })
  @ApiParam({ name: 'id', description: '作品ID' })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '作品不存在' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    return this.postsService.deletePost(req.user.id, +id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard, UserStatusGuard)
  @RequireAction(RequiredAction.LIKE)
  @ApiBearerAuth()
  @ApiOperation({ summary: '点赞/取消点赞作品' })
  @ApiParam({ name: 'id', description: '作品ID' })
  @ApiResponse({ status: 200, description: '点赞/取消点赞成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '作品不存在' })
  async likePost(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any
  ) {
    try {
      this.logger.log(`收到点赞请求: userId=${user?.id}, postId=${id}`);
      return await this.postsService.likePost(user, id);
    } catch (error) {
      // 日志记录错误，帮助调试
      this.logger.error(`点赞作品失败: userId=${user?.id}, postId=${id}`, error.stack);
      // 重新抛出错误，交给NestJS的异常过滤器处理
      throw error;
    }
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard, UserStatusGuard)
  @RequireAction(RequiredAction.FAVORITE)
  @ApiBearerAuth()
  @ApiOperation({ summary: '收藏/取消收藏作品' })
  @ApiParam({ name: 'id', description: '作品ID' })
  @ApiResponse({ status: 200, description: '操作成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '作品不存在' })
  async favoritePost(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any
  ) {
    try {
      this.logger.log(`收到收藏请求: userId=${user?.id}, postId=${id}`);
      return await this.postsService.favoritePost(user, id);
    } catch (error) {
      // 日志记录错误，帮助调试
      this.logger.error(`收藏作品失败: userId=${user?.id}, postId=${id}`, error.stack);
      // 重新抛出错误，交给NestJS的异常过滤器处理
      throw error;
    }
  }

  @ApiOperation({ summary: '下载作品' })
  @ApiParam({ name: 'id', description: '作品ID' })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '下载成功' })
  @ApiResponse({ status: 403, description: '无权下载' })
  @ApiResponse({ status: 404, description: '作品不存在或文件已删除' })
  @Get(':id/download')
  async downloadPost(@Param('id') id: string, @Req() req, @Res() res: Response) {
    const { filePath, fileName, mimeType } = await this.postsService.downloadPost(req.user.id, +id);
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    
    res.sendFile(filePath);
  }
}
