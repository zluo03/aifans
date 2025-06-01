import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesModule as AppNotesModule } from '../../notes/notes.module';

@Module({
  imports: [AppNotesModule],
  controllers: [NotesController],
})
export class NotesModule {} 