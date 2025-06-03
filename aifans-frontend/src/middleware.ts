import { NextRequest, NextResponse } from 'next/server';

// 定义受保护的管理员路由
const ADMIN_ROUTES = [
  '/resources/create',
  '/resources/[id]/edit',
  '/admin',
];

// 调试开关
const DEBUG = true;

export async function middleware(request: NextRequest) {
  // 获取当前路径
  const path = request.nextUrl.pathname;
  
  if (DEBUG) {
    console.log(`[中间件] 处理路径: ${path}`);
  }
  
  // 检查是否是管理员路由
  const isAdminRoute = ADMIN_ROUTES.some(route => {
    if (route.includes('[id]')) {
      // 处理动态路由，例如 /resources/123/edit
      const routePattern = route.replace('[id]', '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(path);
    }
    return path === route || path.startsWith(`${route}/`);
  });
  
  // 如果不是管理员路由，直接放行
  if (!isAdminRoute) {
    if (DEBUG) {
      console.log(`[中间件] 非管理员路由，直接放行: ${path}`);
    }
    return NextResponse.next();
  }
  
  if (DEBUG) {
    console.log(`[中间件] 检测到管理员路由: ${path}`);
  }
  
  // 尝试从auth-storage cookie获取token
  const authStorageCookie = request.cookies.get('auth-storage')?.value;
  if (authStorageCookie) {
    if (DEBUG) {
      console.log('[中间件] 找到auth-storage cookie');
    }
    
    try {
      const decodedStorage = decodeURIComponent(authStorageCookie);
      const { state } = JSON.parse(decodedStorage);
      
      if (state?.user?.role === 'ADMIN') {
        if (DEBUG) {
          console.log('[中间件] 用户是管理员，放行请求');
        }
        // 是管理员，放行请求
        return NextResponse.next();
      } else {
        if (DEBUG) {
          console.log(`[中间件] 用户角色不是管理员: ${state?.user?.role || '未知'}`);
        }
      }
    } catch (error) {
      console.error('[中间件] 解析auth-storage失败', error);
    }
  } else {
    if (DEBUG) {
      console.log('[中间件] 未找到auth-storage cookie');
    }
  }
  
  // 检查Authorization头
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader) {
    if (DEBUG) {
      console.log('[中间件] 找到Authorization头');
    }
    // 有认证头，可能是API请求，放行给客户端组件处理
    return NextResponse.next();
  }
  
  if (DEBUG) {
    console.log('[中间件] 无法确认是否为管理员，重定向到首页');
  }
  
  // 无法确认是否为管理员，重定向到首页
  // 注意：由于中间件无法访问localStorage，我们将依赖客户端组件进行最终的权限检查
  return NextResponse.redirect(new URL('/', request.url));
}

// 配置匹配的路由
export const config = {
  matcher: [
    '/resources/create',
    '/resources/:id*/edit',
    '/admin/:path*',
  ],
}; 