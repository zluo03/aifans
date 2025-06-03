import { Module, Logger } from '@nestjs/common';
import { CreatorsController } from './creators.controller';
import { CreatorsService } from './creators.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheModule } from '../common/cache.module';
import { SensitiveWordsCheckService } from '../common/services/sensitive-words.service';

@Module({
  imports: [CacheModule],
  controllers: [CreatorsController],
  providers: [
    CreatorsService, 
    PrismaService, 
    Logger,
    SensitiveWordsCheckService
  ],
  exports: [CreatorsService]
})
export class CreatorsModule {} 