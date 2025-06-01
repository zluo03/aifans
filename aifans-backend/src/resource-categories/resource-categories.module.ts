import { Module } from '@nestjs/common';
import { ResourceCategoriesService } from './resource-categories.service';
import { ResourceCategoriesController } from './resource-categories.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ResourceCategoriesController],
  providers: [ResourceCategoriesService],
  exports: [ResourceCategoriesService],
})
export class ResourceCategoriesModule {} 