import { ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector?: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 检查是否是公开路由
    if (this.reflector) {
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      
      if (isPublic) {
        return true;
      }
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      this.logger.warn('请求未包含认证token');
      throw new UnauthorizedException('未提供认证token');
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    this.logger.log('JWT认证守卫处理请求');
    this.logger.debug('认证信息:', { error: err?.message, user: user?.id, info: info?.message });

    if (err || !user) {
      this.logger.error('JWT认证失败:', { 
        error: err?.message, 
        info: info?.message,
        headers: context.switchToHttp().getRequest().headers 
      });
      throw new UnauthorizedException('认证失败');
    }

    this.logger.log('JWT认证成功，用户ID:', user.id);
    return user;
  }

  private extractTokenFromRequest(request: any): string | null {
    // 从Authorization头获取token
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 从cookie获取token
    const token = request.cookies?.token;
    if (token) {
      return token;
    }

    return null;
  }
} 