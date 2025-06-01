import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get('MAIL_HOST', 'smtp.126.com'),
          port: parseInt(configService.get('MAIL_PORT', '465')),
          secure: configService.get('MAIL_SECURE', 'true') === 'true',
          auth: {
            user: configService.get('MAIL_USER', 'aifanspro@126.com'),
            pass: configService.get('MAIL_PASSWORD', ''),
          },
        },
        defaults: {
          from: `"AI灵感社" <${configService.get('MAIL_USER', 'aifanspro@126.com')}>`,
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {} 