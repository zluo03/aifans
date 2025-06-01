import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 简化中间件：移除服务器端的认证检查
  // 让前端组件自己处理路由保护，因为认证状态存储在localStorage中
  // 中间件在服务器端运行，无法访问localStorage
  
  // 只处理静态资源的缓存等基础功能
  return NextResponse.next();
}

// 配置中间件匹配的路由
export const config = {
  matcher: [
    // 匹配除了API路由和静态资源外的所有路由
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
}; 