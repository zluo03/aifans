import { Module } from '@nestjs/common';
import { CreatorsController } from './creators.controller';
import { CreatorsService } from './creators.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheModule } from '../common/cache.module';

@Module({
  imports: [CacheModule],
  controllers: [CreatorsController],
  providers: [CreatorsService, PrismaService],
  exports: [CreatorsService]
})
export class CreatorsModule {} 