import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface MailConfigDto {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

@Injectable()
export class AdminMailService {
  constructor(private prisma: PrismaService) {}

  async getMailConfig(): Promise<MailConfigDto | null> {
    try {
      // 使用原始查询直到Prisma客户端更新
      const mailSettings = await this.prisma.$queryRaw`
        SELECT * FROM mail_settings ORDER BY updated_at DESC LIMIT 1
      ` as any[];

      if (!mailSettings || mailSettings.length === 0) {
        // 如果没有配置，返回默认配置
        return {
          host: 'smtp.126.com',
          port: 465,
          secure: true,
          user: 'aifanspro@126.com',
          password: '',
          from: '"AI灵感社" <aifanspro@126.com>',
        };
      }

      const settings = mailSettings[0];
      return {
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        user: settings.user,
        password: settings.password,
        from: settings.from,
      };
    } catch (error) {
      console.error('获取邮件配置失败:', error);
      // 如果表不存在，返回默认配置
      return {
        host: 'smtp.126.com',
        port: 465,
        secure: true,
        user: 'aifanspro@126.com',
        password: '',
        from: '"AI灵感社" <aifanspro@126.com>',
      };
    }
  }

  async saveMailConfig(mailConfigDto: MailConfigDto): Promise<MailConfigDto> {
    try {
      // 检查是否已有配置记录
      const existingConfig = await this.prisma.$queryRaw`
        SELECT * FROM mail_settings LIMIT 1
      ` as any[];

      if (existingConfig && existingConfig.length > 0) {
        // 更新现有配置
        await this.prisma.$executeRaw`
          UPDATE mail_settings SET 
            host = ${mailConfigDto.host},
            port = ${mailConfigDto.port},
            secure = ${mailConfigDto.secure},
            user = ${mailConfigDto.user},
            password = ${mailConfigDto.password},
            \`from\` = ${mailConfigDto.from},
            updated_at = NOW()
          WHERE id = ${existingConfig[0].id}
        `;
      } else {
        // 创建新配置
        await this.prisma.$executeRaw`
          INSERT INTO mail_settings (host, port, secure, user, password, \`from\`, created_at, updated_at)
          VALUES (${mailConfigDto.host}, ${mailConfigDto.port}, ${mailConfigDto.secure}, 
                  ${mailConfigDto.user}, ${mailConfigDto.password}, ${mailConfigDto.from}, NOW(), NOW())
        `;
      }

      return mailConfigDto;
    } catch (error) {
      console.error('保存邮件配置失败:', error);
      throw error;
    }
  }
} 