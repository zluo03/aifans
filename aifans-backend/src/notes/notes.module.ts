import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CreatorsModule } from '../creators/creators.module';
import { CacheModule } from '../common/cache.module';

@Module({
  imports: [PrismaModule, CreatorsModule, CacheModule],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {} 