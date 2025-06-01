import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getAuthFromCookie, isAdmin } from "@/lib/utils/auth";

// 获取基础URL（不包含/api前缀，因为baseUrl已经包含了）
const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'http://localhost:3001';

// 构建API URL
const getApiUrl = (path: string) => {
  // 确保baseUrl不重复包含/api
  const apiBase = baseUrl.endsWith('/api') 
    ? baseUrl
    : `${baseUrl}/api`;
  
  // 确保path不以/开头，避免双斜杠
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  const finalUrl = `${apiBase}/${cleanPath}`;
  console.log('构建API URL:', { baseUrl, apiBase, path, cleanPath, finalUrl });
  return finalUrl;
};

// 创建代理API路由函数
async function createProxyApi(req: NextRequest, targetPath: string, method: string = 'GET', data?: any) {
  try {
    // 获取token
    let token: string | undefined;
    let role: string | undefined;
    
    // 首先尝试从Authorization头部获取
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      console.log(`${method} - 从Authorization头部获取token:`, token?.slice(0, 10));
    } else {
      // 如果没有Authorization头部，尝试从cookie获取
      const cookie = req.headers.get("cookie") || "";
      const cookieAuth = getAuthFromCookie(cookie);
      token = cookieAuth.token;
      role = cookieAuth.role;
      console.log(`${method} - 从cookie获取认证信息:`, { token: token?.slice(0, 10), role });
    }
    
    console.log(`${method} - 最终认证信息:`, { token: token?.slice(0, 10), hasToken: !!token });
    
    if (!token) {
      console.log('权限验证失败: 没有token');
      return NextResponse.json(
        { message: "需要管理员权限" },
        { status: 403 }
      );
    }
    
    // 如果从cookie获取到role信息，进行角色验证
    if (role && !isAdmin(role)) {
      console.log('权限验证失败: 角色不是管理员', { role });
      return NextResponse.json(
        { message: "需要管理员权限" },
        { status: 403 }
      );
    }

    // 构建请求参数
    const apiUrl = getApiUrl(targetPath);
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    
    console.log(`${method}请求URL:`, apiUrl);
    console.log(`${method}请求头:`, { Authorization: `Bearer ${token.slice(0, 10)}...` });
    
    // 执行请求
    let response;
    switch (method.toUpperCase()) {
      case 'GET':
        response = await axios.get(apiUrl, { headers });
        break;
      case 'POST':
        response = await axios.post(apiUrl, data, { headers });
        break;
      case 'PUT':
        response = await axios.put(apiUrl, data, { headers });
        break;
      case 'PATCH':
        response = await axios.patch(apiUrl, data, { headers });
        break;
      case 'DELETE':
        response = await axios.delete(apiUrl, { headers, data });
        break;
      default:
        throw new Error(`不支持的HTTP方法: ${method}`);
    }
    
    console.log('API响应状态:', response.status);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`${method}请求失败:`, {
      path: targetPath,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || '未知错误',
      errorDetails: error.message
    });
    
    // 详细记录请求和错误信息
    console.error('详细错误信息:', {
      error: error.toString(),
      hasResponse: !!error.response,
      responseData: error.response?.data,
      requestConfig: error.config ? {
        url: error.config.url,
        method: error.config.method,
        hasHeaders: !!error.config.headers,
        authHeader: error.config.headers?.Authorization ? '存在' : '不存在',
      } : '无请求配置'
    });
    
    // 根据错误类型返回适当的状态码和消息
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response.data?.message || `${method}请求失败`, 
          error: error.response.statusText,
          status: error.response.status
        },
        { status: error.response.status }
      );
    }
    
    // 处理网络错误或其他错误
    return NextResponse.json(
      { 
        message: error.message || `${method}请求失败`,
        error: 'NetworkError',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

// 获取用户列表
export async function GET(req: NextRequest) {
  // 获取查询参数
  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams();
  
  // 处理分页参数
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  
  // 处理搜索参数
  const search = searchParams.get('search');
  if (search) params.append('search', search);
  
  // 处理筛选参数
  const roleFilter = searchParams.get('role');
  const statusFilter = searchParams.get('status');
  if (roleFilter && roleFilter !== 'all') params.append('role', roleFilter);
  if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
  
  console.log('请求参数:', Object.fromEntries(params.entries()));
  
  // 使用代理API路由
  try {
    const requestPath = `admin/users${params.toString() ? `?${params.toString()}` : ''}`;
    console.log('发送请求到后端API:', requestPath);
    
    // 使用代理API路由
    const response = await createProxyApi(req, requestPath);
    
    // 验证响应
    if (!response) {
      console.error('代理API返回undefined或null');
      return NextResponse.json(
        { message: "内部服务器错误: 代理API返回空响应" },
        { status: 500 }
      );
    }
    
    return response;
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
    
    return NextResponse.json(
      { 
        message: error.message || "获取用户列表失败",
        status: error.status || 500,
        error: error.toString()
      },
      { status: error.status || 500 }
    );
  }
}

// 创建新用户
export async function POST(req: NextRequest) {
  console.log('接收到创建用户POST请求');
  
  // 检查请求体
  const contentType = req.headers.get('content-type');
  console.log('Content-Type:', contentType);
  
  if (!contentType || !contentType.includes('application/json')) {
    console.log('无效的Content-Type:', contentType);
    return NextResponse.json(
      { message: "无效的Content-Type，需要application/json" },
      { status: 400 }
    );
  }

  try {
    // 解析请求体
    const data = await req.json();
    console.log('创建用户数据:', data);
    
    // 使用代理API路由
    return createProxyApi(req, 'admin/users', 'POST', data);
  } catch (parseError) {
    console.error('解析请求体失败:', parseError);
    return NextResponse.json(
      { message: "无效的JSON数据" },
      { status: 400 }
    );
  }
} 