import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getAuthToken } from "@/lib/utils/auth";
import { BASE_URL } from "@/lib/api/api";

// 获取影院列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // 构建查询参数
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    // 获取认证token
    const token = getAuthToken(req);
    
    // 添加调试信息
    console.log('GET API认证调试信息:', {
      hasAuthHeader: !!req.headers.get("Authorization"),
      authHeader: req.headers.get("Authorization")?.substring(0, 20) + '...',
      cookies: req.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value })),
      token: token ? token.substring(0, 10) + '...' : 'null'
    });
    
    if (!token) {
      return NextResponse.json(
        { message: "未登录或登录已过期" },
        { status: 401 }
      );
    }
    
    // 从后端API获取数据
    const response = await axios.get(
      `${BASE_URL}/admin/screenings`,
      {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
          Cookie: req.headers.get("cookie") || "",
        },
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("获取影院列表失败:", error.response?.data || error);
    
    // 如果是认证错误，返回401状态码
    if (error.response?.status === 401) {
      return NextResponse.json(
        { message: "未登录或登录已过期" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { message: error.response?.data?.message || "获取影院列表失败" },
      { status: error.response?.status || 500 }
    );
  }
}

// 创建新影片
export async function POST(req: NextRequest) {
  try {
    // 获取认证token
    const token = getAuthToken(req);
    
    if (!token) {
      return NextResponse.json(
        { message: "未登录或登录已过期" },
        { status: 401 }
      );
    }
    
    // 获取表单数据
    const formData = await req.formData();
    
    // 转发到后端API
    const response = await axios.post(
      `${BASE_URL}/admin/screenings`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Cookie: req.headers.get("cookie") || "",
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("创建影片失败:", error.response?.data || error);
    
    // 如果是认证错误，返回401状态码
    if (error.response?.status === 401) {
      return NextResponse.json(
        { message: "未登录或登录已过期" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { message: error.response?.data?.message || "创建影片失败" },
      { status: error.response?.status || 500 }
    );
  }
} 