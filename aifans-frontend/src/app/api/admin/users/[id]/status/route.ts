import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getAuthFromCookie, getAuthToken } from "@/lib/utils/auth";

// 获取基础URL（不包含/api前缀）
const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'http://localhost:3001';

// 更新用户状态
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 优先从Authorization头部获取token
    let token: string | undefined;
    let role: string | undefined;
    
    // 首先尝试从Authorization头部获取
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      console.log('从Authorization头部获取token:', token?.slice(0, 10));
    } else {
      // 如果没有Authorization头部，尝试从cookie获取
      const cookie = req.headers.get("cookie") || "";
      const cookieAuth = getAuthFromCookie(cookie);
      token = cookieAuth.token;
      role = cookieAuth.role;
      console.log('从cookie获取认证信息:', { token: token?.slice(0, 10), role });
    }
    
    console.log('PATCH - 最终认证信息:', { token: token?.slice(0, 10), hasToken: !!token });
    
    if (!token) {
      console.log('权限验证失败: 没有token');
      return NextResponse.json(
        { message: "需要管理员权限" },
        { status: 403 }
      );
    }
    
    // 如果从cookie获取到role信息，进行角色验证
    if (role && role !== 'ADMIN') {
      console.log('权限验证失败: 角色不是管理员', { role });
      return NextResponse.json(
        { message: "需要管理员权限" },
        { status: 403 }
      );
    }
    
    // 如果从Authorization头部获取token但没有role信息，让后端API来验证权限

    const data = await req.json();
    console.log('更新状态数据:', { userId: id, ...data });
    
    // 构建完整的API URL
    const apiUrl = `${baseUrl}/api/admin/users/${id}/status`;
    console.log('请求URL:', apiUrl);
    
    // 发送到后端API
    const response = await axios.patch(
      apiUrl,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    console.log('API响应状态:', response.status);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("更新用户状态失败:", {
      status: error.response?.status,
      message: error.response?.data?.message,
      error: error.message,
      stack: error.stack
    });
    
    // 根据错误类型返回适当的状态码和消息
    if (error.response?.status === 401) {
      return NextResponse.json(
        { message: "认证失败，请重新登录" },
        { status: 401 }
      );
    } else if (error.response?.status === 403) {
      return NextResponse.json(
        { message: "没有访问权限" },
        { status: 403 }
      );
    } else if (error.response?.status === 404) {
      return NextResponse.json(
        { message: "用户不存在" },
        { status: 404 }
      );
    } else if (error.response?.status === 400) {
      return NextResponse.json(
        { message: "无效的状态值" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: error.response?.data?.message || "更新用户状态失败" },
      { status: error.response?.status || 500 }
    );
  }
} 