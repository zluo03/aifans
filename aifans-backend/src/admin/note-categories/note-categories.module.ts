import { Module } from '@nestjs/common';
import { NoteCategoriesController } from './note-categories.controller';
import { NoteCategoriesModule as BaseNoteCategoriesModule } from '../../note-categories/note-categories.module';

@Module({
  imports: [BaseNoteCategoriesModule],
  controllers: [NoteCategoriesController],
})
export class AdminNoteCategoriesModule {} 