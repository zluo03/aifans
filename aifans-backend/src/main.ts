import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import * as path from 'path';
import * as fs from 'fs';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 设置全局前缀
  app.setGlobalPrefix('api');

  // 添加全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 静态文件服务配置 - 重构，确保头像等静态资源可访问
  console.log('配置静态文件服务...');
  console.log(`静态文件目录: ${path.join(process.cwd(), 'uploads')}`);

  // 专门处理头像请求的中间件
  app.use('/uploads/avatar/:filename', (req, res, next) => {
    const filename = req.params.filename;
    console.log(`专用头像处理中间件: ${filename}`);
    
    // 安全检查
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).send('不安全的文件名');
    }
    
    // 构建文件路径
    const filePath = path.join(process.cwd(), 'uploads', 'avatar', filename);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error(`头像文件不存在: ${filePath}`);
      return res.status(404).send('文件不存在');
    }
    
    // 获取文件信息
    try {
      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        return res.status(400).send('不是有效文件');
      }
      
      // 设置正确的Content-Type
      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      
      // 设置响应头
      res.header('Content-Type', contentType);
      res.header('Content-Length', stats.size.toString());
      res.header('Last-Modified', stats.mtime.toUTCString());
      res.header('Cache-Control', 'public, max-age=86400');
      res.header('Accept-Ranges', 'bytes');
      res.header('Access-Control-Allow-Origin', '*');
      
      // 发送文件
      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      console.error(`处理头像文件出错: ${error.message}`);
      return res.status(500).send('服务器错误');
    }
  });

  // 首先添加CORS和头部中间件
  app.use('/uploads', (req, res, next) => {
    console.log(`接收到静态文件请求: ${req.url}`);
    
    // 允许所有域的跨域请求
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // 设置缓存控制
    res.header('Cache-Control', 'public, max-age=86400'); // 24小时缓存
    
    // 根据文件扩展名设置正确的Content-Type
    const reqPath = req.path;
    if (reqPath.endsWith('.jpg') || reqPath.endsWith('.jpeg')) {
      res.header('Content-Type', 'image/jpeg');
    } else if (reqPath.endsWith('.png')) {
      res.header('Content-Type', 'image/png');
    } else if (reqPath.endsWith('.gif')) {
      res.header('Content-Type', 'image/gif');
    } else if (reqPath.endsWith('.webp')) {
      res.header('Content-Type', 'image/webp');
    } else if (reqPath.endsWith('.svg')) {
      res.header('Content-Type', 'image/svg+xml');
    }
    
    // 添加安全头部
    res.header('X-Content-Type-Options', 'nosniff');
    
    // 继续处理请求
    next();
  });
  
  // 测试静态资源是否存在及权限
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (fs.existsSync(uploadsDir)) {
    console.log(`uploads目录存在: ${uploadsDir}`);
    
    // 检查avatar子目录
    const avatarDir = path.join(uploadsDir, 'avatar');
    if (fs.existsSync(avatarDir)) {
      console.log(`avatar目录存在: ${avatarDir}`);
      try {
        const avatarFiles = fs.readdirSync(avatarDir);
        console.log(`avatar目录包含${avatarFiles.length}个文件`);
      } catch (error) {
        console.error(`无法读取avatar目录: ${error.message}`);
      }
    } else {
      console.warn(`avatar目录不存在，创建目录: ${avatarDir}`);
      try {
        fs.mkdirSync(avatarDir, { recursive: true });
      } catch (error) {
        console.error(`创建avatar目录失败: ${error.message}`);
      }
    }
  } else {
    console.warn(`uploads目录不存在，创建目录: ${uploadsDir}`);
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch (error) {
      console.error(`创建uploads目录失败: ${error.message}`);
    }
  }
  
  // 配置静态文件服务 - 确保路径正确且有访问权限
  // 注意：使用serveStatic而不是express.static，以便更好地控制内容类型
  const serveStatic = (req, res, next) => {
    const requestUrl = req.url.replace(/\?.*$/, ''); // 移除查询参数
    const filePath = path.join(process.cwd(), 'uploads', requestUrl);
    
    console.log('静态文件请求详情:', {
      原始URL: req.url,
      处理后URL: requestUrl,
      完整文件路径: filePath,
      时间戳: new Date().toISOString()
    });
    
    // 检查文件是否存在
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        console.warn(`文件不存在或无法访问: ${filePath}`, err ? err.message : '不是文件');
        
        // 尝试查找类似的文件（不区分大小写和扩展名）
        try {
          const dirPath = path.dirname(filePath);
          const fileName = path.basename(filePath).split('.')[0]; // 获取不带扩展名的文件名
          
          if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            console.log(`目录 ${dirPath} 中找到 ${files.length} 个文件`);
            
            // 查找匹配的文件
            const matchingFile = files.find(file => 
              file.toLowerCase().startsWith(fileName.toLowerCase())
            );
            
            if (matchingFile) {
              const correctFilePath = path.join(dirPath, matchingFile);
              console.log(`找到匹配的文件: ${correctFilePath}`);
              
              // 递归调用自身，使用正确的文件路径
              req.url = path.relative(path.join(process.cwd(), 'uploads'), correctFilePath);
              return serveStatic(req, res, next);
            }
          }
        } catch (searchError) {
          console.error(`搜索类似文件时出错: ${searchError.message}`);
        }
        
        return next(); // 文件不存在，继续下一个中间件
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
        case '.mp4':
          contentType = 'video/mp4';
          break;
        case '.mp3':
          contentType = 'audio/mpeg';
          break;
        case '.pdf':
          contentType = 'application/pdf';
          break;
      }
      
      console.log(`提供文件: ${filePath}, 类型: ${contentType}, 大小: ${stats.size}`);
      
      // 设置响应头
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Last-Modified', stats.mtime.toUTCString());
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Accept-Ranges', 'bytes');
      
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
    });
  };
  
  // 使用自定义静态文件服务
  app.use('/uploads', serveStatic);
  
  // 备用方案：如果自定义服务失败，使用express.static作为后备
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
    index: false,
    etag: true,
    lastModified: true,
    maxAge: 86400000, // 24小时缓存 (毫秒)
    setHeaders: (res, filePath) => {
      // 根据文件扩展名设置正确的Content-Type
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.jpg' || ext === '.jpeg') {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (ext === '.png') {
        res.setHeader('Content-Type', 'image/png');
      } else if (ext === '.gif') {
        res.setHeader('Content-Type', 'image/gif');
      } else if (ext === '.webp') {
        res.setHeader('Content-Type', 'image/webp');
      } else if (ext === '.svg') {
        res.setHeader('Content-Type', 'image/svg+xml');
      }
    }
  }));

  // 静态资源托管：将 /icon 映射到项目根目录 public/icon
  app.use('/icon', express.static(join(__dirname, '..', '..', 'public', 'icon')));

  // 添加 ngrok 请求头中间件
  app.use((req, res, next) => {
    // 添加 ngrok 所需的请求头
    req.headers['ngrok-skip-browser-warning'] = '1';
    // 设置自定义 User-Agent
    req.headers['user-agent'] = 'aifans-backend';
    next();
  });

  // 配置跨域
  app.enableCors({
    origin: ['http://localhost:3000', 'http://dev.aifans.pro', 'https://dev.aifans.pro', '*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning'],
    exposedHeaders: ['Content-Disposition'],
    credentials: true
  });

  // 启用全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    }
  }));

  await app.listen(process.env.PORT || 3001, '0.0.0.0');
}
bootstrap();
