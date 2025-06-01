import { NextRequest } from "next/server";
import { cookies } from "next/headers";

/**
 * 从请求中获取认证token
 * @param req NextRequest对象
 * @returns token字符串或undefined
 */
export function getAuthToken(req: NextRequest): string | undefined {
  // 首先尝试从Authorization头获取
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // 尝试从auth-storage cookie获取
  const authStorage = req.cookies.get('auth-storage')?.value;
  if (authStorage) {
    try {
      const { state } = JSON.parse(decodeURIComponent(authStorage));
      return state?.token;
    } catch {
      return undefined;
    }
  }

  // 如果都没有，尝试从普通token cookie获取
  return req.cookies.get('token')?.value;
}

/**
 * 从cookie字符串中获取认证信息
 * @param cookie cookie字符串
 * @returns 包含token和role的对象
 */
export function getAuthFromCookie(cookie: string): { token?: string; role?: string } {
  const cookies = cookie.split(';').reduce((acc: Record<string, string>, curr) => {
    const [key, value] = curr.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});

  // 尝试从auth-storage中获取token
  if (cookies['auth-storage']) {
    try {
      const { state } = JSON.parse(decodeURIComponent(cookies['auth-storage']));
      return {
        token: state?.token,
        role: state?.user?.role
      };
    } catch (error) {
      console.error('解析auth-storage失败:', error);
      // 如果解析失败，继续尝试其他方式
    }
  }

  // 如果没有auth-storage或解析失败，使用普通cookie
  return {
    token: cookies['token'],
    role: cookies['role']
  };
}

/**
 * 检查是否是管理员角色
 * @param role 角色字符串
 * @returns 是否是管理员
 */
export function isAdmin(role?: string): boolean {
  return role === 'ADMIN';
} 