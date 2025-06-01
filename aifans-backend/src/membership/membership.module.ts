import { Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { MembershipController, AdminMembershipController } from './membership.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MembershipController, AdminMembershipController],
  providers: [MembershipService],
  exports: [MembershipService]
})
export class MembershipModule {} 