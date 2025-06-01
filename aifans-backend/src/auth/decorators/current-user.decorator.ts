import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 自定义装饰器，用于获取当前认证的用户信息
 * 可以在控制器的方法参数中使用 @CurrentUser() user 来获取当前用户
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
); 