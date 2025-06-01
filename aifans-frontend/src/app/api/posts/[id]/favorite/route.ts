import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { BASE_URL } from "@/lib/api/api";

// 从cookie中获取认证token
function getAuthToken(req: NextRequest) {
  const authData = req.cookies.get('auth-storage')?.value;
  
  if (!authData) return null;
  
  try {
    const parsedData = JSON.parse(decodeURIComponent(authData));
    const token = parsedData.state?.token;
    return token;
  } catch (error) {
    console.error("解析auth-storage失败:", error);
    return null;
  }
}

// 收藏作品
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取认证token
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json(
        { message: "未登录或登录已过期", success: false },
        { status: 401 }
      );
    }

    // 发送到后端API
    try {
      console.log(`准备发送收藏请求到后端API，帖子ID: ${params.id}`);
      
      // 收集所有请求头用于调试
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      
      // 可选地传递cookie - 但后端主要使用Bearer token
      const cookie = req.headers.get("cookie");
      if (cookie) {
        headers.Cookie = cookie;
      }
      
      // 修正API URL构建方式，避免/api前缀重复
      // BASE_URL已经包含了/api前缀，所以这里直接使用/posts
      const apiUrl = `${BASE_URL}/posts/${params.id}/favorite`;
      console.log(`将收藏请求发送到: ${apiUrl}`);
      
      const response = await axios.post(
        apiUrl,
        {},
        { headers }
      );

      console.log("收藏操作响应:", {
        status: response.status,
        data: response.data
      });
      
      return NextResponse.json(response.data);
    } catch (apiError: any) {
      // 捕获后端API请求错误并转化为友好的响应
      console.error(`收藏请求失败:`, apiError);
      
      // 提取错误信息
      const errorMessage = apiError.response?.data?.message || 
        (apiError.response?.status === 500 ? "服务器内部错误" : "收藏操作失败");
      
      // 记录更详细的错误信息以帮助调试
      if (apiError.response) {
        console.error('收藏API错误详情:', {
          status: apiError.response.status,
          statusText: apiError.response.statusText,
          data: apiError.response.data
        });
      }
      
      // 返回更友好、更有信息量的错误
      return NextResponse.json(
        { 
          message: errorMessage,
          success: false,
          error: process.env.NODE_ENV === 'development' ? {
            status: apiError.response?.status,
            data: apiError.response?.data || '(无错误详情)',
          } : undefined
        },
        { status: apiError.response?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error(`收藏ID为${params.id}的作品失败:`, error);
    
    // 确保返回有意义的错误信息
    return NextResponse.json(
      { 
        message: "收藏处理失败，请稍后再试", 
        success: false,
        error: process.env.NODE_ENV === 'development' ? {
          message: error.message || '未知错误'
        } : undefined
      },
      { status: 500 }
    );
  }
} 