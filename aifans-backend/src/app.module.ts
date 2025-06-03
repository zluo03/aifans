import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from './mail/mail.module';
import { AiPlatformsModule } from './ai-platforms/ai-platforms.module';
import { AiPlatformsController as AdminAiPlatformsController } from './admin/ai-platforms/ai-platforms.controller';
import { PostsModule } from './posts/posts.module';
import { NoteCategoriesModule } from './note-categories/note-categories.module';
import { NotesModule } from './notes/notes.module';
import { ResourcesModule } from './resources/resources.module';
import { ResourceCategoriesModule } from './resource-categories/resource-categories.module';
import { AdminNoteCategoriesModule } from './admin/note-categories/note-categories.module';
import { NotesController as AdminNotesController } from './admin/notes/notes.controller';
import { NotesModule as AdminNotesModule } from './admin/notes/notes.module';
import { ScreeningsModule } from './screenings/screenings.module';
import { ScreeningsController as AdminScreeningsController } from './admin/screenings/screenings.controller';
import { RequestCategoriesModule } from './request-categories/request-categories.module';
import { AdminRequestCategoriesController } from './request-categories/request-categories.controller';
import { RequestsModule } from './requests/requests.module';
import { PaymentsModule } from './payments/payments.module';
import { StorageModule } from './storage/storage.module';
import { AdminModule } from './admin/admin.module';
import { SpiritPostsModule } from './spirit-posts/spirit-posts.module';
import { CreatorsModule } from './creators/creators.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { SocialMediaModule } from './social-media/social-media.module';
import { MembershipModule } from './membership/membership.module';
import { PublicModule } from './public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    MailModule,
    AiPlatformsModule,
    PostsModule,
    NoteCategoriesModule,
    NotesModule,
    ResourcesModule,
    ResourceCategoriesModule,
    AdminNotesModule,
    AdminNoteCategoriesModule,
    ScreeningsModule,
    RequestCategoriesModule,
    RequestsModule,
    PaymentsModule,
    StorageModule,
    AdminModule,
    SpiritPostsModule,
    CreatorsModule,
    AnnouncementsModule,
    SocialMediaModule,
    MembershipModule,
    PublicModule,
  ],
  controllers: [
    AppController, 
    AdminAiPlatformsController, 
    AdminScreeningsController,
    AdminRequestCategoriesController,
  ],
  providers: [AppService],
})
export class AppModule {}
