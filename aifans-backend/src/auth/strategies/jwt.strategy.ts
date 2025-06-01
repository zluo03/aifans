import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-jwt-secret-key',
    });
    
    this.logger.log('JWT策略已初始化');
  }

  async validate(payload: any) {
    this.logger.log('开始验证JWT载荷:', { sub: payload.sub });
    
    try {
      if (!payload.sub) {
        this.logger.error('JWT载荷中缺少用户ID');
        throw new UnauthorizedException('无效的认证令牌');
      }

      const user = await this.usersService.findUserById(payload.sub);
      
      if (!user) {
        this.logger.error('未找到对应的用户:', payload.sub);
        throw new UnauthorizedException('用户不存在');
      }

      if (user.status === 'BANNED') {
        this.logger.warn('用户已被封禁:', payload.sub);
        throw new UnauthorizedException('账号已被封禁');
      }

      this.logger.log('JWT验证成功，用户:', { 
        id: user.id, 
        username: user.username,
        role: user.role 
      });

      return {
        id: user.id,
        sub: user.id,
        username: user.username,
        role: user.role
      };
    } catch (error) {
      this.logger.error('JWT验证失败:', error);
      throw new UnauthorizedException('认证失败');
    }
  }
} 