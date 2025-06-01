import { Module } from '@nestjs/common';
import { AiPlatformsController } from './ai-platforms.controller';
import { AIPlatformsService } from './ai-platforms.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiPlatformsController],
  providers: [AIPlatformsService],
  exports: [AIPlatformsService],
})
export class AdminAiPlatformsModule {} 