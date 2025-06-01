import { Module } from '@nestjs/common';
import { AiPlatformsService } from './ai-platforms.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiPlatformsController } from './ai-platforms.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AiPlatformsController],
  providers: [AiPlatformsService],
  exports: [AiPlatformsService],
})
export class AiPlatformsModule {}
