import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Body, Get, Put, Param, Res, Query, Headers, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../types/prisma-enums';
import { Response as ExpressResponse } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { createReadStream } from 'fs';
import fetch from 'node-fetch';

// 定义 API 返回的迁移结果类型
interface MigrationResult {
  total: number;
  migrated: number;
  failed: number;
  details: Array<{
    type: string;
    id: any;
    status: string;
    error?: string;
  }>;
}

@ApiTags('存储管理')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  // 视频安全密钥，应该放在环境变量中
  private readonly VIDEO_SECRET = process.env.VIDEO_SECRET || 'default-video-secret-key-change-in-production';

  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '上传文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          description: '文件夹名称',
          example: 'avatar',
        },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') queryFolder: string,
    @Body() body: any,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    // 设置CORS头
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (!file) {
      console.error('上传失败: 未提供文件');
      return res.status(400).json({
        error: '上传失败',
        details: '未提供文件'
      });
    }
    
    // 优先使用表单中的folder，其次使用查询参数中的folder，最后使用默认值
    const folder = body?.folder || queryFolder || 'general';
    
    console.log('文件上传请求:', {
      文件名: file?.originalname,
      文件大小: file?.size,
      文件类型: file?.mimetype,
      目标文件夹: folder,
      表单数据: body
    });
    
    try {
      // 检查uploads目录是否存在
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        console.log(`创建uploads目录: ${uploadsDir}`);
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // 检查目标文件夹是否存在
      const targetDir = path.join(uploadsDir, folder);
      if (!fs.existsSync(targetDir)) {
        console.log(`创建目标目录: ${targetDir}`);
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      const result = await this.storageService.uploadFile(file, folder);
      console.log('文件上传成功:', result);
      return result;
    } catch (error) {
      console.error('文件上传失败:', error);
      return res.status(500).json({
        error: '文件上传失败',
        details: error.message || '服务器内部错误'
      });
    }
  }

  @Get('serve')
  @ApiOperation({ summary: '获取本地存储的文件' })
  async serveFile(
    @Query('key') key: string, 
    @Res() res: ExpressResponse
  ) {
    if (!key) {
      return res.status(400).json({ error: 'Missing key parameter' });
    }

    try {
      const filePath = path.join(__dirname, '..', '..', 'uploads', key);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      // 根据文件扩展名设置Content-Type
      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'application/octet-stream';

      if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      else if (ext === '.mp4') contentType = 'video/mp4';
      else if (ext === '.webm') contentType = 'video/webm';

      res.set('Content-Type', contentType);
      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  @Post('admin/oss/migrate')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '迁移文件到OSS (仅管理员)' })
  async migrateToOSS(): Promise<MigrationResult> {
    return this.storageService.migrateToOSS();
  }

  /**
   * 生成临时视频访问token
   */
  @Get('video/token')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '获取视频访问token' })
  async getVideoToken(
    @Query('path') videoPath: string,
  ) {
    if (!videoPath || !videoPath.includes('/uploads/notes/')) {
      throw new BadRequestException('Invalid video path');
    }

    // 验证文件是否存在
    const fullPath = path.join(__dirname, '..', '..', 'uploads', videoPath.replace(/^\//, ''));
    if (!fs.existsSync(fullPath)) {
      throw new BadRequestException('Video file not found');
    }

    // 生成临时token（5分钟有效期）
    const timestamp = Date.now();
    const expiresAt = timestamp + 5 * 60 * 1000; // 5分钟后过期
    const data = `${videoPath}:${expiresAt}`;
    const token = crypto.createHmac('sha256', this.VIDEO_SECRET)
      .update(data)
      .digest('hex');

    return {
      token: `${token}.${expiresAt}`,
      expiresAt,
      url: `/storage/video/secure?t=${token}.${expiresAt}&p=${encodeURIComponent(videoPath)}`
    };
  }

  /**
   * 安全的视频代理访问
   */
  @Get('video/secure')
  @ApiOperation({ summary: '安全视频代理访问' })
  async secureVideoAccess(
    @Query('t') token: string,
    @Query('p') videoPath: string,
    @Headers('referer') referer: string,
    @Res() res: ExpressResponse
  ) {
    try {
      if (!token || !videoPath) {
        throw new UnauthorizedException('Missing token or path');
      }

      // 验证referer（确保来自合法页面）
      if (!referer || (!referer.includes('/notes/') && !referer.includes('localhost'))) {
        throw new UnauthorizedException('Invalid referer');
      }

      // 解析token
      const [tokenHash, expiresAt] = token.split('.');
      const expires = parseInt(expiresAt);

      // 检查是否过期
      if (Date.now() > expires) {
        throw new UnauthorizedException('Token expired');
      }

      // 验证token
      const data = `${videoPath}:${expiresAt}`;
      const expectedToken = crypto.createHmac('sha256', this.VIDEO_SECRET)
        .update(data)
        .digest('hex');

      if (tokenHash !== expectedToken) {
        throw new UnauthorizedException('Invalid token');
      }

      // 验证文件路径安全性
      if (!videoPath.includes('/uploads/notes/') || videoPath.includes('..')) {
        throw new UnauthorizedException('Invalid video path');
      }

      const filePath = path.join(__dirname, '..', '..', 'uploads', videoPath.replace(/^\//, ''));
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Video not found' });
      }

      // 设置视频响应头
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = res.req.headers.range;

      // 设置安全响应头
      res.set({
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
      });

      if (range) {
        // 支持范围请求（用于视频流播放）
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;

        res.status(206);
        res.set({
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Content-Length': chunksize.toString(),
        });

        const stream = fs.createReadStream(filePath, { start, end });
        stream.pipe(res);
      } else {
        res.set('Content-Length', fileSize.toString());
        fs.createReadStream(filePath).pipe(res);
      }
    } catch (error) {
      console.error('Secure video access error:', error);
      return res.status(401).json({ error: 'Unauthorized access' });
    }
  }

  @Get('check-file')
  @ApiOperation({ summary: '检查文件是否存在' })
  @ApiResponse({ status: 200, description: '返回文件检查结果' })
  async checkFile(@Query('path') filePath: string) {
    try {
      const result = await this.storageService.checkFileExists(filePath);
      return result;
    } catch (error) {
      return {
        exists: false,
        error: error.message,
        path: filePath
      };
    }
  }

  @Get('avatar/:filename')
  @ApiOperation({ summary: '获取用户头像' })
  async getAvatar(
    @Param('filename') filename: string,
    @Res() res: ExpressResponse
  ) {
    try {
      console.log(`获取头像请求: ${filename}`);
      
      // 安全检查：确保文件名不包含路径遍历
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        console.error(`不安全的头像文件名: ${filename}`);
        return res.status(400).send('不安全的文件名');
      }
      
      // 构建文件路径
      const filePath = path.join(__dirname, '..', '..', 'uploads', 'avatar', filename);
      console.log(`头像文件路径: ${filePath}`);
      
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        console.error(`头像文件不存在: ${filePath}`);
        return res.status(404).send('文件不存在');
      }
      
      // 获取文件信息
      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        console.error(`不是有效文件: ${filePath}`);
        return res.status(400).send('不是有效文件');
      }
      
      // 设置正确的Content-Type
      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'application/octet-stream'; // 默认二进制流
      
      switch (ext) {
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.webp':
          contentType = 'image/webp';
          break;
        case '.svg':
          contentType = 'image/svg+xml';
          break;
      }
      
      // 设置响应头
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Last-Modified', stats.mtime.toUTCString());
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      // 创建文件流并发送
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      // 处理错误
      fileStream.on('error', (error) => {
        console.error(`文件流错误: ${error.message}`);
        if (!res.headersSent) {
          res.status(500).send('文件读取错误');
        }
      });
    } catch (error) {
      console.error(`获取头像出错:`, error);
      if (!res.headersSent) {
        res.status(500).send('服务器错误');
      }
    }
  }

  @Post('upload-avatar')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '上传用户头像（强制存到avatar目录）' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.storageService.uploadFile(file, 'avatar');
  }

  /**
   * 视频代理接口 - 处理前端的/api/proxy/video/:key请求
   */
  @Get('proxy/video/:key')
  @ApiOperation({ summary: '视频代理接口' })
  async proxyVideo(
    @Param('key') key: string,
    @Res() res: ExpressResponse
  ) {
    try {
      if (!key) {
        return res.status(400).json({ error: '缺少视频key参数' });
      }

      // 解码key
      const decodedKey = decodeURIComponent(key);
      
      // 构建阿里云OSS URL
      const ossBaseUrl = 'https://aifansbeijing.oss-cn-beijing.aliyuncs.com/';
      const videoUrl = `${ossBaseUrl}${decodedKey}`;

      console.log(`代理视频请求: ${videoUrl}`);

      // 从OSS获取视频内容
      const response = await fetch(videoUrl);
      
      if (!response.ok) {
        console.error(`OSS请求失败: ${response.status} ${response.statusText}`);
        return res.status(response.status).json({ error: '视频资源不存在或无法访问' });
      }

      // 获取视频内容
      const buffer = await response.arrayBuffer();
      
      // 设置正确的头部
      res.set({
        'Content-Type': response.headers.get('Content-Type') || 'video/mp4',
        'Content-Length': response.headers.get('Content-Length') || '',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400', // 缓存1天
        'Access-Control-Allow-Origin': '*', // 允许任何来源访问
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
      });

      // 返回视频内容
      return res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('视频代理请求失败:', error);
      return res.status(500).json({ error: '视频代理请求处理失败' });
    }
  }
} 