import { Module } from '@nestjs/common';
import { NoteCategoriesService } from './note-categories.service';
import { NoteCategoriesController } from './note-categories.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NoteCategoriesController],
  providers: [NoteCategoriesService],
  exports: [NoteCategoriesService],
})
export class NoteCategoriesModule {} 