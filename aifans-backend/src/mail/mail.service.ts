import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private prisma: PrismaService
  ) {}

  /**
   * 获取动态邮件配置
   */
  private async getDynamicMailConfig() {
    try {
      const mailSettings = await this.prisma.$queryRaw`
        SELECT * FROM mail_settings ORDER BY updated_at DESC LIMIT 1
      ` as any[];

      if (mailSettings && mailSettings.length > 0) {
        const settings = mailSettings[0];
        return {
          host: settings.host,
          port: settings.port,
          secure: settings.secure,
          auth: {
            user: settings.user,
            pass: settings.password,
          },
          from: settings.from,
        };
      }
    } catch (error) {
      console.error('获取动态邮件配置失败:', error);
    }
    
    // 如果获取失败，返回null，使用默认的MailerService
    return null;
  }

  /**
   * 创建动态邮件传输器
   */
  private async createDynamicTransporter() {
    const config = await this.getDynamicMailConfig();
    if (!config) {
      return null;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
      });

      // 验证配置
      await transporter.verify();
      return { transporter, from: config.from };
    } catch (error) {
      console.error('创建动态邮件传输器失败:', error);
      throw new Error(`邮件配置错误: ${error.message}`);
    }
  }

  /**
   * 发送邮箱验证码
   * @param email 用户邮箱
   * @param verificationCode 验证码
   * @param nickname 用户昵称
   */
  async sendEmailVerificationCode(
    email: string,
    verificationCode: string,
    nickname?: string
  ): Promise<void> {
    const displayName = nickname || '用户';
    
    const mailContent = {
      to: email,
      subject: 'AI灵感社 - 邮箱验证码',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #b106c5; text-align: center;">AI灵感社</h2>
          <p>您好 ${displayName}，</p>
          <p>感谢您注册AI灵感社！为了确保您的邮箱地址有效，请使用以下验证码完成注册：</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background-color: #f8f9fa; border: 2px dashed #b106c5; padding: 20px 30px; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; color: #b106c5; letter-spacing: 8px;">${verificationCode}</span>
            </div>
          </div>
          <p style="color: #666; font-size: 14px;">
            <strong>重要提示：</strong>
            <br>• 此验证码有效期为10分钟，请及时使用
            <br>• 验证码仅可使用一次
            <br>• 如果您没有申请注册，请忽略此邮件
          </p>
          <p>验证码：<strong style="color: #b106c5; font-size: 18px;">${verificationCode}</strong></p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #888; font-size: 12px; text-align: center;">
            此邮件由系统自动发送，请勿回复。如有疑问，请联系管理员。
            <br>AI灵感社 - 分享AI创作的灵感
          </p>
        </div>
      `,
    };

    // 尝试使用动态配置发送
    try {
      const dynamicConfig = await this.createDynamicTransporter();
      if (dynamicConfig) {
        await dynamicConfig.transporter.sendMail({
          ...mailContent,
          from: dynamicConfig.from,
        });
        console.log('使用动态配置发送邮箱验证码成功');
        return;
      }
    } catch (error) {
      console.error('使用动态配置发送邮件失败，回退到默认配置:', error.message);
    }

    // 回退到默认MailerService
    await this.mailerService.sendMail(mailContent);
  }

  /**
   * 发送密码重置邮件
   * @param email 用户邮箱
   * @param token 重置密码令牌
   */
  async sendPasswordResetMail(email: string, token: string) {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
    
    const mailContent = {
      to: email,
      subject: 'AI灵感社 - 重置密码',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #b106c5; text-align: center;">AI灵感社</h2>
          <p>您好，</p>
          <p>我们收到了您的密码重置请求。请点击下面的链接重置密码：</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetLink}" 
               style="background-color: #b106c5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              重置密码
            </a>
          </div>
          <p style="color: #888;">此链接有效期为1小时，请及时操作。</p>
          <p>如果您无法点击上面的按钮，请复制以下链接到浏览器地址栏：</p>
          <p style="word-break: break-all; color: #0078d7;">${resetLink}</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #888; font-size: 12px; text-align: center;">
            此邮件由系统自动发送，请勿回复。如有疑问，请联系管理员。
          </p>
        </div>
      `,
    };

    // 尝试使用动态配置发送
    try {
      const dynamicConfig = await this.createDynamicTransporter();
      if (dynamicConfig) {
        await dynamicConfig.transporter.sendMail({
          ...mailContent,
          from: dynamicConfig.from,
        });
        console.log('使用动态配置发送密码重置邮件成功');
        return;
      }
    } catch (error) {
      console.error('使用动态配置发送邮件失败，回退到默认配置:', error.message);
    }

    // 回退到默认MailerService
    await this.mailerService.sendMail(mailContent);
  }

  /**
   * 发送测试邮件
   * @param email 接收测试邮件的邮箱地址
   */
  async sendTestEmail(email: string): Promise<void> {
    const now = new Date().toLocaleString('zh-CN');
    
    const mailContent = {
      to: email,
      subject: 'AI灵感社 - 邮件系统测试',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #b106c5; text-align: center;">AI灵感社</h2>
          <p>您好，</p>
          <p>这是一封测试邮件，用于验证AI灵感社的邮件发送系统是否正常工作。</p>
          <p>如果您收到此邮件，说明邮件系统配置正确并且能够正常发送邮件。</p>
          <p>测试邮件发送时间：${now}</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #888; font-size: 12px; text-align: center;">
            此邮件由系统自动发送，请勿回复。如有疑问，请联系管理员。
          </p>
        </div>
      `,
    };

    // 使用动态配置发送测试邮件
    try {
      const dynamicConfig = await this.createDynamicTransporter();
      if (dynamicConfig) {
        await dynamicConfig.transporter.sendMail({
          ...mailContent,
          from: dynamicConfig.from,
        });
        console.log('使用动态配置发送测试邮件成功，收件人:', email);
        return;
      } else {
        throw new Error('未找到邮件配置，请先在管理面板配置邮件设置');
      }
    } catch (error) {
      console.error('发送测试邮件失败:', error.message);
      throw new Error(`发送测试邮件失败: ${error.message}`);
    }
  }
} 