import { Module } from '@nestjs/common';
import { SpiritPostsService } from './spirit-posts.service';
import { SpiritPostsController } from './spirit-posts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CreatorsModule } from '../creators/creators.module';
import { CacheModule } from '../common/cache.module';

@Module({
  imports: [PrismaModule, CreatorsModule, CacheModule],
  controllers: [SpiritPostsController],
  providers: [SpiritPostsService],
  exports: [SpiritPostsService],
})
export class SpiritPostsModule {} 