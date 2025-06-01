import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageConfig } from './storage.config';
import { StorageController } from './storage.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB限制
      },
    }),
  ],
  providers: [StorageService, StorageConfig],
  exports: [StorageService, StorageConfig],
  controllers: [StorageController],
})
export class StorageModule {} 