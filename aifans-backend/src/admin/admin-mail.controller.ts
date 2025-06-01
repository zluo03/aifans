import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../types';
import { AdminMailService, MailConfigDto } from './admin-mail.service';
import { MailService } from '../mail/mail.service';

// 测试邮件请求DTO
class TestEmailDto {
  email: string;
}

@ApiTags('admin/settings')
@Controller('admin/settings/mail')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminMailController {
  constructor(
    private readonly adminMailService: AdminMailService,
    private readonly mailService: MailService
  ) {}

  @Get()
  @ApiOperation({ summary: '获取邮件配置' })
  @ApiResponse({ status: 200, description: '成功返回邮件配置' })
  async getMailConfig() {
    try {
      const config = await this.adminMailService.getMailConfig();
      return config;
    } catch (error) {
      return {
        message: '获取邮件配置失败',
        error: error.message,
      };
    }
  }

  @Post()
  @ApiOperation({ summary: '保存邮件配置' })
  @ApiResponse({ status: 200, description: '邮件配置保存成功' })
  async saveMailConfig(@Body() mailConfigDto: MailConfigDto) {
    try {
      const savedConfig = await this.adminMailService.saveMailConfig(mailConfigDto);
      return { 
        success: true, 
        message: '邮件配置已保存',
        data: savedConfig
      };
    } catch (error) {
      return {
        success: false,
        message: '保存邮件配置失败',
        error: error.message,
      };
    }
  }

  @Post('test')
  @ApiOperation({ summary: '发送测试邮件' })
  @ApiResponse({ status: 200, description: '测试邮件发送成功' })
  async sendTestEmail(@Body() testEmailDto: TestEmailDto) {
    try {
      await this.mailService.sendTestEmail(testEmailDto.email);
      return { 
        success: true, 
        message: `测试邮件已发送到 ${testEmailDto.email}`,
        email: testEmailDto.email
      };
    } catch (error) {
      return {
        success: false,
        message: '发送测试邮件失败',
        error: error.message,
      };
    }
  }
} 