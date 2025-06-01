import { Controller, Post, Body, Get, UseGuards, Request, UnauthorizedException, Req, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, SendVerificationCodeDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: '发送邮箱验证码' })
  @ApiResponse({ status: 200, description: '验证码发送成功' })
  @ApiResponse({ status: 400, description: '邮箱已被注册或邮件发送失败' })
  @Post('send-verification-code')
  sendVerificationCode(@Body() sendVerificationCodeDto: SendVerificationCodeDto) {
    console.log('收到发送验证码请求', sendVerificationCodeDto);
    return this.authService.sendVerificationCode(sendVerificationCodeDto);
  }

  @ApiOperation({ summary: '生成图形验证码' })
  @ApiResponse({ status: 200, description: '验证码生成成功' })
  @Get('captcha')
  generateCaptcha() {
    console.log('收到生成验证码请求');
    return this.authService.generateCaptcha();
  }

  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 400, description: '邮箱或用户名已被使用或验证码错误' })
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    console.log('收到注册请求', { ...registerDto, password: '***', verificationCode: '***' });
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '用户名/邮箱或密码错误或验证码错误' })
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    console.log('收到登录请求', { ...loginDto, password: '***', captcha: '***' });
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: '测试API连接' })
  @Get('test')
  test() {
    return {
      message: 'API连接成功',
      timestamp: new Date().toISOString()
    };
  }

  @ApiOperation({ summary: '获取用户资料' })
  @ApiResponse({ status: 200, description: '返回用户资料' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: ExpressRequest) {
    try {
      if (!req.user || !req.user['sub']) {
        throw new HttpException('未找到用户信息', HttpStatus.UNAUTHORIZED);
      }

      const userId = req.user['sub'];
      return await this.authService.getProfile(userId);
    } catch (error) {
      console.error('获取用户资料失败:', error);
      throw new HttpException(
        error.message || '获取用户资料失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @ApiOperation({ summary: '忘记密码' })
  @ApiResponse({ status: 200, description: '重置密码邮件已发送' })
  @ApiResponse({ status: 400, description: '请求失败' })
  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    console.log('收到忘记密码请求', forgotPasswordDto);
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @ApiOperation({ summary: '重置密码' })
  @ApiResponse({ status: 200, description: '密码重置成功' })
  @ApiResponse({ status: 400, description: '无效的重置令牌或密码不符合要求' })
  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    console.log('收到重置密码请求', { ...resetPasswordDto, newPassword: '***' });
    return this.authService.resetPassword(resetPasswordDto);
  }
}
