import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getAuthToken } from "../../../lib/utils/auth";
import { BASE_URL } from "@/lib/api/api";

// 获取后端 API URL
const BACKEND_URL = process.env.API_URL || "http://localhost:3001";

// 获取作品列表
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
    
    // 从后端API获取数据
    const response = await axios.get(
      `${BACKEND_URL}/api/posts`,
      {
        params,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          Cookie: req.headers.get("cookie") || "",
        },
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("获取作品列表失败:", error.response?.data || error);
    
    // 如果是认证错误，返回401状态码
    if (error.response?.status === 401) {
      return NextResponse.json(
        { message: "未登录或登录已过期" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { message: error.response?.data?.message || "获取作品失败" },
      { status: error.response?.status || 500 }
    );
  }
}

// 创建新作品
export async function POST(request: NextRequest) {
  try {
    // 获取认证头
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { message: '未登录或登录已过期' },
        { status: 401 }
      );
    }

    // 获取表单数据
    const formData = await request.formData();
    
    console.log('开始上传作品，请求数据:', {
      headers: {
        contentType: request.headers.get('content-type'),
        authorization: authHeader ? '存在' : '不存在'
      },
      formData: Object.fromEntries(formData.entries())
    });

    // 从Authorization头中提取token
    const token = authHeader.replace('Bearer ', '');
    
    // 转发到后端API
    const response = await axios.post(`${BACKEND_URL}/api/posts`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('作品上传成功:', response.data);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('上传作品失败:', error.response?.data || error);
    return NextResponse.json(
      { message: error.response?.data?.message || '上传作品失败' },
      { status: error.response?.status || 500 }
    );
  }
} 