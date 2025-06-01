import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CreatorsModule } from '../creators/creators.module';
import { CacheModule } from '../common/cache.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

// 确保上传目录存在
const uploadDir = join(process.cwd(), 'uploads', 'posts');
try {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('上传目录已创建或已存在:', uploadDir);
} catch (error) {
  console.error('创建上传目录失败:', error);
  throw error;
}

@Module({
  imports: [
    PrismaModule,
    CreatorsModule,
    CacheModule,
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, callback) => {
          callback(null, uploadDir);
        },
        filename: (req, file, callback) => {
          // 生成唯一文件名
          const uniqueSuffix = uuidv4();
          const fileExtension = extname(file.originalname);
          callback(null, `${uniqueSuffix}${fileExtension}`);
        },
      }),
      limits: {
        fileSize: 30 * 1024 * 1024, // 30MB限制（针对视频，图片实际限制在拦截器中进行）
      },
    }),
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
