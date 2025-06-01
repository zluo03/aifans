import { BadRequestException, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto, SendVerificationCodeDto } from './dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CacheService } from '../common/services/cache.service';
import { CaptchaService } from '../common/services/captcha.service';
import * as crypto from 'crypto';
import { adaptUserUpdateInput, mapUserPasswordField } from '../types/prisma-extend';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private mailService: MailService,
    private cacheService: CacheService,
    private captchaService: CaptchaService,
  ) {}

  /**
   * 发送邮箱验证码
   */
  async sendVerificationCode(sendVerificationCodeDto: SendVerificationCodeDto) {
    const { email } = sendVerificationCodeDto;
    
    // 检查邮箱是否已存在
    const existingUser = await this.usersService.findUserByEmail(email);
    if (existingUser) {
      throw new BadRequestException('该邮箱已被注册');
    }
    
    // 生成验证码
    const verificationCode = await this.captchaService.generateEmailVerificationCode(email);
    
    // 发送验证码邮件
    try {
      await this.mailService.sendEmailVerificationCode(email, verificationCode);
      return { message: '验证码已发送到您的邮箱，请查收' };
    } catch (error) {
      this.logger.error('发送验证码邮件失败:', error);
      throw new BadRequestException('邮件发送失败，请稍后再试');
    }
  }

  /**
   * 生成图形验证码
   */
  async generateCaptcha() {
    return await this.captchaService.generateImageCaptcha();
  }

  async register(registerDto: RegisterDto) {
    const { email, username, verificationCode } = registerDto;
    
    // 验证邮箱验证码
    const isValidCode = await this.captchaService.verifyEmailVerificationCode(email, verificationCode);
    if (!isValidCode) {
      throw new BadRequestException('邮箱验证码无效或已过期');
    }
    
    // 检查邮箱是否已存在
    const existingUserByEmail = await this.usersService.findUserByEmail(email);
    if (existingUserByEmail) {
      throw new BadRequestException('该邮箱已被注册');
    }
    
    // 检查用户名是否已存在
    const existingUserByUsername = await this.usersService.findUserByUsername(username);
    if (existingUserByUsername) {
      throw new BadRequestException('该用户名已被使用');
    }
    
    // 清除邮箱验证码
    await this.captchaService.clearEmailVerificationCode(email);
    
    // 创建用户 - 移除verificationCode字段，只传递用户表需要的字段
    const { verificationCode: _, ...createUserData } = registerDto;
    const user = await this.usersService.createUser(createUserData);
    
    // 生成JWT
    const token = this.generateToken(user.id, user.email, user.role);
    
    // 移除敏感信息
    const userWithHash = mapUserPasswordField(user);
    const { passwordHash, ...result } = userWithHash;
    
    return {
      user: result,
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { login, password, captchaId, captcha } = loginDto;
    
    this.logger.log(`开始登录处理，用户: ${login}`);
    
    try {
      // 验证图形验证码
      const isValidCaptcha = await this.captchaService.verifyImageCaptcha(captchaId, captcha);
      if (!isValidCaptcha) {
        this.logger.warn(`验证码验证失败，用户: ${login}`);
        throw new BadRequestException('验证码错误或已过期');
      }
      
      this.logger.log(`验证码验证通过，开始查找用户: ${login}`);
      
      // 开发环境下特殊处理
      if (process.env.NODE_ENV === 'development' && login === 'admin') {
        this.logger.log(`开发环境下使用管理员测试账号: ${login}`);
        
        // 查找或创建admin用户
        let adminUser = await this.usersService.findUserByUsername('admin');
        
        if (!adminUser) {
          this.logger.log('管理员用户不存在，创建测试账户');
          // 创建测试账户
          const salt = await bcrypt.genSalt();
          const hashedPassword = await bcrypt.hash('admin123', salt);
          adminUser = await this.prisma.user.create({
            data: {
              username: 'admin',
              email: 'admin@example.com',
              nickname: '管理员',
              password: hashedPassword,
              role: 'ADMIN',
              status: 'ACTIVE'
            }
          });
        }
        
        // 管理员账户在开发环境下不验证密码
        this.logger.log(`开发环境下跳过密码验证，用户ID: ${adminUser.id}`);
        
        // 生成JWT token
        const token = this.generateToken(adminUser.id, adminUser.email, adminUser.role);
        
        // 移除敏感信息
        const { password: _, ...result } = adminUser;
        
        return { user: result, token };
      }
      
      // 正常流程：根据登录凭证查找用户（可以是email或username）
      let user;
      if (login.includes('@')) {
        user = await this.usersService.findUserByEmail(login);
      } else {
        user = await this.usersService.findUserByUsername(login);
      }
      
      if (!user) {
        this.logger.warn(`用户不存在: ${login}`);
        throw new UnauthorizedException('用户名/邮箱或密码错误');
      }
      
      this.logger.log(`找到用户: ${user.id}, 开始验证密码`);
      
      // 验证密码
      let isPasswordValid = false;
      try {
        // 尝试使用用户的password字段验证
        isPasswordValid = await bcrypt.compare(password, user.password);
      } catch (err) {
        this.logger.warn(`使用password字段验证失败，尝试使用passwordHash字段: ${err.message}`);
        
        // 尝试将user对象转换为包含passwordHash的对象
        const userWithHash = mapUserPasswordField(user);
        
        // 使用passwordHash验证
        if (userWithHash.passwordHash) {
          isPasswordValid = await bcrypt.compare(password, userWithHash.passwordHash);
        }
      }

      if (!isPasswordValid) {
        this.logger.warn(`密码验证失败，用户: ${user.id}`);
        throw new UnauthorizedException('用户名/邮箱或密码错误');
      }
      
      this.logger.log(`密码验证通过，检查用户状态: ${user.status}`);
      
      // 检查用户状态
      if (user.status !== 'ACTIVE') {
        this.logger.warn(`用户账号状态异常: ${user.status}, 用户ID: ${user.id}`);
        throw new UnauthorizedException('账号已被禁用，请联系管理员');
      }
      
      this.logger.log(`用户状态正常，处理登录成功: ${user.id}`);
      
      // 记录每日登录（异步执行，不影响登录流程）
      this.recordDailyLogin(user.id).catch(error => {
        this.logger.error(`记录每日登录失败 - 用户ID: ${user.id}`, error);
      });
      
      // 生成JWT token
      const token = this.generateToken(user.id, user.email, user.role);
      
      // 移除敏感信息
      const userWithHash = mapUserPasswordField(user);
      const { passwordHash, ...result } = userWithHash;
      
      this.logger.log(`登录成功，返回token和用户信息: ${user.id}`);
      
      return {
        user: result,
        token,
      };
    } catch (error) {
      this.logger.error(`登录失败: ${error.message}`);
      // 重新抛出错误，保持原有的错误处理逻辑
      throw error;
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    
    // 查找用户
    const user = await this.usersService.findUserByEmail(email);
    if (!user || !user.email) {
      // 为了安全，即使用户不存在也返回成功消息
      return { message: '如果该邮箱已注册，重置密码的链接将发送到您的邮箱' };
    }
    
    // 生成随机 token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // 存储 token 到数据库，有效期 1 小时
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);
    
    // 存储重置 token 到数据库
    await this.prisma.passwordReset.create({
      data: {
        email: user.email,
        token: resetToken,
        expiresAt: expiryDate,
      },
    });
    
    // 发送重置密码邮件
    await this.mailService.sendPasswordResetMail(
      user.email,
      resetToken
    );
    
    return { message: '如果该邮箱已注册，重置密码的链接将发送到您的邮箱' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;
    
    // 密码复杂度验证
    if (!this.validatePasswordComplexity(newPassword)) {
      throw new BadRequestException('新密码必须包含大小写字母、数字，长度至少8位');
    }
    
    // 查找有效的重置记录
    const passwordReset = await this.prisma.passwordReset.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date()
        },
        used: false
      }
    });
    
    if (!passwordReset) {
      throw new BadRequestException('无效或已过期的重置链接');
    }
    
    // 查找用户
    const user = await this.usersService.findUserByEmail(passwordReset.email);
    if (!user) {
      throw new BadRequestException('用户不存在');
    }
    
    try {
      // 开启事务
      await this.prisma.$transaction(async (prisma) => {
        // 生成新密码哈希
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(newPassword.trim(), salt);
        
        // 更新用户密码
        await prisma.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            updatedAt: new Date()
          },
        });
        
        // 标记重置记录为已使用
        await prisma.passwordReset.update({
          where: { id: passwordReset.id },
          data: { used: true }
        });
      });
      
      return { message: '密码已成功重置' };
    } catch (error) {
      this.logger.error(`重置用户密码时出错: ${error.message}`);
      throw new BadRequestException('密码重置失败，请重试');
    }
  }
  
  // 验证密码复杂度
  private validatePasswordComplexity(password: string): boolean {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const isLengthValid = password.length >= 8;
    
    return hasUpperCase && hasLowerCase && hasNumbers && isLengthValid;
  }
  
  async validateUser(userId: number) {
    return this.usersService.findUserById(userId);
  }
  
  private generateToken(userId: number, email: string | null, role?: string) {
    return this.jwtService.sign({
      sub: userId,
      email: email || undefined,
      role: role || 'NORMAL',
    });
  }
  
  // TODO: 添加 reCAPTCHA 验证方法
  private async verifyCaptcha(token: string): Promise<boolean> {
    // 实际项目中需要调用 Google reCAPTCHA API 验证 token
    // 这里简单返回 true，以便测试
    return true;
  }

  // 记录用户每日登录
  private async recordDailyLogin(userId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 设置为当天的开始时间
    
    try {
      await this.prisma.userDailyLogin.create({
        data: {
          userId,
          loginDate: today
        }
      });
      
      this.logger.log(`用户 ${userId} 每日登录记录成功`);
      
      // 如果用户是创作者，更新积分
      const creator = await this.prisma.creator.findUnique({
        where: { userId }
      });
      
      if (creator) {
        // 这里可以调用创作者服务的积分更新方法
        // 为了避免循环依赖，我们直接在这里计算积分
        await this.updateCreatorScore(userId);
      }
    } catch (error) {
      // 如果今天已经记录过登录，忽略错误
      if (error.code !== 'P2002') { // P2002是唯一约束违反错误
        throw error;
      }
    }
  }

  // 计算并更新创作者积分
  private async updateCreatorScore(userId: number): Promise<void> {
    try {
      let totalScore = 0;

      // 1. 灵感板块积分
      const spiritPosts = await this.prisma.spiritPost.findMany({
        where: { userId }
      });
      
      // 每发布一个灵感增加基础分（假设图片10分，视频20分，这里先统一按15分计算）
      totalScore += spiritPosts.length * 15;

      // 2. 笔记板块积分
      const notes = await this.prisma.note.findMany({
        where: { 
          userId,
          status: 'VISIBLE' // 只计算可见的笔记
        }
      });
      
      // 每发布一篇笔记增加100分
      totalScore += notes.length * 100;
      
      // 笔记的赞和收藏积分
      for (const note of notes) {
        totalScore += note.likesCount * 2; // 每个赞2分
        totalScore += note.favoritesCount * 5; // 每个收藏5分
      }

      // 3. 每日登录积分
      const dailyLogins = await this.prisma.userDailyLogin.findMany({
        where: { userId }
      });
      
      // 每天登录20分
      totalScore += dailyLogins.length * 20;

      // 4. 灵感作品的赞和收藏积分（通过Post表计算）
      const posts = await this.prisma.post.findMany({
        where: { 
          userId,
          status: 'VISIBLE'
        }
      });
      
      for (const post of posts) {
        // 根据类型给不同的基础分
        if (post.type === 'IMAGE') {
          totalScore += 10; // 图片10分
        } else if (post.type === 'VIDEO') {
          totalScore += 20; // 视频20分
        }
        
        totalScore += post.likesCount * 1; // 每个赞1分
        totalScore += post.favoritesCount * 2; // 每个收藏2分
      }

      // 更新创作者积分
      await this.prisma.creator.update({
        where: { userId },
        data: { score: totalScore }
      });

      this.logger.log(`用户 ${userId} 积分更新成功: ${totalScore}`);
    } catch (error) {
      this.logger.error(`更新用户 ${userId} 积分失败`, error);
    }
  }

  async getProfile(userId: number) {
    this.logger.debug('获取用户资料:', { userId });

    try {
      const user = await this.usersService.findUserById(userId);
      
      if (!user) {
        this.logger.error('未找到用户:', userId);
        throw new UnauthorizedException('用户不存在');
      }

      this.logger.debug('找到用户:', { 
        userId: user.id,
        username: user.username,
        role: user.role
      });

      // 排除敏感信息
      const { password, ...userProfile } = user;
      return userProfile;
    } catch (error) {
      this.logger.error('获取用户资料失败:', error);
      throw error;
    }
  }
}
