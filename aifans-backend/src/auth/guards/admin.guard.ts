import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('AdminGuard - 请求信息:', {
      path: request.path,
      method: request.method,
      headers: {
        authorization: request.headers.authorization,
        cookie: request.headers.cookie,
      }
    });

    console.log('AdminGuard - 用户信息:', {
      user,
      hasUser: !!user,
      userRole: user?.role,
      isAdmin: user?.role === 'ADMIN'
    });

    // 检查用户是否存在且角色是否为管理员
    const isAdmin = user && user.role === 'ADMIN';
    
    if (!isAdmin) {
      console.log('AdminGuard - 权限检查失败:', {
        reason: !user ? '用户信息不存在' : '用户不是管理员',
        userRole: user?.role
      });
    }
    
    return isAdmin;
  }
} 