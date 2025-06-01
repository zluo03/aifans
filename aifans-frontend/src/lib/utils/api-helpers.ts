import { NextResponse } from 'next/server';

export const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://aifans.pro/api';

/**
 * 构建API URL，避免双重/api问题
 * @param path API路径（不包含/api前缀）
 * @returns 完整的API URL
 */
export function buildApiUrl(path: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}/${cleanPath}`;
}

/**
 * 获取认证头信息 - 仅在服务器端可用
 * @returns 认证头信息或null
 */
export function getAuthHeader(): string | null {
  try {
    if (typeof window === 'undefined') {
      console.error('getAuthHeader 只能在客户端使用');
      return null;
    }

    const authStorage = localStorage.getItem('auth-storage');
    if (!authStorage) {
      console.error('未找到 auth-storage');
      return null;
    }

    const authData = JSON.parse(authStorage);
    const token = authData?.state?.token;
    
    if (!token) {
      console.error('未找到 token');
      return null;
    }

    // 确保token格式正确
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    console.log('获取到的认证头:', formattedToken);
    return formattedToken;
  } catch (error) {
    console.error('获取认证头失败:', error);
    return null;
  }
}

/**
 * 创建带认证的请求头
 * @param token 认证token
 * @returns 请求头对象
 */
export function createAuthHeaders(token: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  return headers;
}

/**
 * 处理API错误响应
 * @param error 错误对象
 * @param defaultMessage 默认错误消息
 * @returns NextResponse错误响应
 */
export function handleApiError(error: any, defaultMessage: string) {
  console.error(`[API Helpers] ${defaultMessage}:`, error);
  
  let statusCode = 500;
  let errorMessage = defaultMessage;
  
  // 尝试提取更详细的错误信息和状态码
  if (error.response) {
    statusCode = error.response.status || 500;
    errorMessage = error.response.data?.message || defaultMessage;
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  return NextResponse.json(
    { error: errorMessage },
    { status: statusCode }
  );
}

/**
 * 检查并获取认证头信息 - 仅在服务器端可用
 * @returns 认证头信息或空字符串
 */
export function checkAuth(): string {
  try {
    // 注意：这个函数只能在服务器端使用
    if (typeof window !== 'undefined') {
      console.error('[API Helpers] checkAuth只能在服务器端使用');
      return '';
    }
    
    const authorization = getAuthHeader();
    console.log('[API Helpers] 检查认证状态:', authorization ? '有认证信息' : '无认证信息');
    return authorization || '';
  } catch (error) {
    console.error('[API Helpers] 检查认证失败:', error);
    return '';
  }
} 