import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminPostsController } from './admin-posts.controller';
import { AdminPostsService } from './admin-posts.service';
import { AdminAnnouncementsController } from './admin-announcements.controller';
import { AdminAnnouncementsService } from './admin-announcements.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../common/cache.module';
import { AdminMailController } from './admin-mail.controller';
import { AdminMailService } from './admin-mail.service';
import { MailModule } from '../mail/mail.module';
import { AiPlatformsController } from './ai-platforms/ai-platforms.controller';
import { AIPlatformsService } from './ai-platforms/ai-platforms.service';
import { UploadLimitService } from './upload-limit.service';
import { UploadLimitController } from './upload-limit.controller';
import { SensitiveWordsController } from './sensitive-words.controller';
import { SensitiveWordsService } from './sensitive-words.service';
import { AdminMembershipController, AdminPaymentSettingsController } from './admin-membership.controller';
import { AdminMembershipService } from './admin-membership.service';
import { AdminSettingsController } from './admin-settings.controller';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, CacheModule, MailModule, PaymentsModule],
  controllers: [
    AdminUsersController, 
    AdminPostsController, 
    AdminAnnouncementsController, 
    AdminMailController, 
    AiPlatformsController, 
    UploadLimitController,
    SensitiveWordsController,
    AdminMembershipController,
    AdminSettingsController,
    AdminPaymentSettingsController,
  ],
  providers: [
    AdminUsersService, 
    AdminPostsService, 
    AdminAnnouncementsService, 
    AdminMailService, 
    AIPlatformsService, 
    UploadLimitService,
    SensitiveWordsService,
    AdminMembershipService,
  ],
  exports: [
    AdminUsersService, 
    AdminPostsService, 
    AdminAnnouncementsService, 
    AdminMailService, 
    AIPlatformsService, 
    SensitiveWordsService,
    AdminMembershipService,
  ],
})
export class AdminModule {} 