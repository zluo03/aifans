import { Module } from '@nestjs/common';
import { PublicUploadLimitController } from './upload-limit.controller';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  controllers: [PublicUploadLimitController],
})
export class PublicModule {} 