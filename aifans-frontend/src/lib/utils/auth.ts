import { NextRequest } from "next/server";

/**
 * 从请求中获取认证token
 * @param req NextRequest对象
 * @returns token字符串或undefined
 */
export function getAuthToken(req: NextRequest): string | undefined {
  console.log('getAuthToken: 开始获取认证token');
  
  // 首先尝试从Authorization头获取
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    console.log('getAuthToken: 从Authorization头获取到token');
    return authHeader; // 返回完整的Bearer token
  }

  // 尝试从auth-storage cookie获取
  const authStorageCookie = req.cookies.get('auth-storage')?.value;
  if (authStorageCookie) {
    console.log('getAuthToken: 尝试从auth-storage cookie获取token');
    try {
      const decodedStorage = decodeURIComponent(authStorageCookie);
      const { state } = JSON.parse(decodedStorage);
      
      if (state?.token) {
        // 确保返回的是带Bearer前缀的完整token
        const formattedToken = state.token.startsWith('Bearer ') ? state.token : `Bearer ${state.token}`;
        console.log('getAuthToken: 从auth-storage获取到token');
        return formattedToken;
      }
    } catch (error) {
      console.error('getAuthToken: 解析auth-storage失败', error);
      // 继续尝试其他方式
    }
  }

  // 如果都没有，尝试从普通token cookie获取
  const tokenCookie = req.cookies.get('token')?.value;
  if (tokenCookie) {
    console.log('getAuthToken: 从token cookie获取到token');
    return `Bearer ${tokenCookie}`;
  }

  console.log('getAuthToken: 未找到认证token');
  return undefined;
}
