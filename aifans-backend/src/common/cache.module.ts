import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from './services/cache.service';
import { SensitiveWordsCheckService } from './services/sensitive-words.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [CacheService, SensitiveWordsCheckService],
  exports: [CacheService, SensitiveWordsCheckService],
})
export class CacheModule {} 