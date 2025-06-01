import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// 定义需要检查的操作类型
export enum RequiredAction {
  CREATE_CONTENT = 'CREATE_CONTENT',
  UPLOAD_POST = 'UPLOAD_POST',
  CREATE_NOTE = 'CREATE_NOTE',
  CREATE_SPIRIT_POST = 'CREATE_SPIRIT_POST',
  CLAIM_SPIRIT_POST = 'CLAIM_SPIRIT_POST',
  CREATE_PROFILE = 'CREATE_PROFILE',
  EDIT_PROFILE = 'EDIT_PROFILE',
  COMMENT = 'COMMENT',
  LIKE = 'LIKE',
  FAVORITE = 'FAVORITE',
}

// 装饰器键
export const REQUIRED_ACTION_KEY = 'requiredAction';

// 装饰器
export const RequireAction = (action: RequiredAction) => SetMetadata(REQUIRED_ACTION_KEY, action);

@Injectable()
export class UserStatusGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAction = this.reflector.getAllAndOverride<RequiredAction>(REQUIRED_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有指定需要检查的操作，则允许通过
    if (!requiredAction) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // 如果没有用户信息，让其他守卫处理
    }

    // 检查用户状态
    if (user.status === 'BANNED') {
      throw new ForbiddenException('账号已被封禁，无法执行此操作');
    }

    if (user.status === 'MUTED') {
      // 禁言用户不能执行的操作
      const mutedRestrictedActions = [
        RequiredAction.CREATE_CONTENT,
        RequiredAction.UPLOAD_POST,
        RequiredAction.CREATE_NOTE,
        RequiredAction.CREATE_SPIRIT_POST,
        RequiredAction.CLAIM_SPIRIT_POST,
        RequiredAction.CREATE_PROFILE,
        RequiredAction.EDIT_PROFILE,
        RequiredAction.COMMENT,
      ];

      if (mutedRestrictedActions.includes(requiredAction)) {
        throw new ForbiddenException('账号已被禁言，无法执行此操作');
      }
    }

    return true;
  }
} 