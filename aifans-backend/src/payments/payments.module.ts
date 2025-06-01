import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AlipayConfig } from './alipay.config';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    AlipayConfig,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {} 