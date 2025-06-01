import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { BASE_URL } from "@/lib/api/api";

// 从cookie中获取认证token
function getAuthToken(req: NextRequest) {
  const authData = req.cookies.get('auth-storage')?.value;
  if (!authData) return null;
  
  try {
    const { state } = JSON.parse(decodeURIComponent(authData));
    return state?.token;
  } catch {
    return null;
  }
}

// 下载作品
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取认证token
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json(
        { message: "未登录或登录已过期" },
        { status: 401 }
      );
    }

    // 发送到后端API获取文件
    const response = await axios.get(
      `${BASE_URL}/posts/${params.id}/download`,
      {
        responseType: 'arraybuffer',
        headers: {
          Authorization: `Bearer ${token}`,
          Cookie: req.headers.get("cookie") || "",
        },
      }
    );

    // 获取Content-Type和Content-Disposition
    const contentType = response.headers['content-type'];
    const contentDisposition = response.headers['content-disposition'];

    // 创建响应
    const nextResponse = new NextResponse(response.data);
    
    // 设置头信息
    if (contentType) {
      nextResponse.headers.set('Content-Type', contentType);
    }
    
    if (contentDisposition) {
      nextResponse.headers.set('Content-Disposition', contentDisposition);
    }

    return nextResponse;
  } catch (error: any) {
    console.error(`下载ID为${params.id}的作品失败:`, error);
    
    if (error.response?.status === 403) {
      return NextResponse.json(
        { message: "无权下载此作品" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { message: error.response?.data?.message || "下载失败" },
      { status: error.response?.status || 500 }
    );
  }
} 