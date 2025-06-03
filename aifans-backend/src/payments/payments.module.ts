import { Module, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AlipayConfig } from './alipay.config';
import { MembershipService } from '../membership/membership.service';
import { MembershipModule } from '../membership/membership.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => MembershipModule),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    AlipayConfig,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {} 