import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../common/cache.module';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {} 