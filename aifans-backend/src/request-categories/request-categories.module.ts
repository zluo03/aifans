import { Module } from '@nestjs/common';
import { RequestCategoriesService } from './request-categories.service';
import { RequestCategoriesController, AdminRequestCategoriesController } from './request-categories.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RequestCategoriesController, AdminRequestCategoriesController],
  providers: [RequestCategoriesService],
  exports: [RequestCategoriesService],
})
export class RequestCategoriesModule {} 