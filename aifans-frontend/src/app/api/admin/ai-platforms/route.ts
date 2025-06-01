import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { readStreamToBuffer } from "@/lib/utils/stream";

// 获取基础URL
const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'http://localhost:3001';

// 从cookie中提取认证信息
function getAuthFromCookie(cookie: string): { token: string | null; role: string | null } {
  try {
    const authData = cookie.split(';').find(c => c.trim().startsWith('auth-storage='));
    if (!authData) return { token: null, role: null };
    
    const decoded = decodeURIComponent(authData.split('=')[1]);
    const { state } = JSON.parse(decoded);
    return { 
      token: state?.token || null,
      role: state?.user?.role || null
    };
  } catch (error) {
    console.error('从cookie提取认证信息失败:', error);
    return { token: null, role: null };
  }
}

// 检查是否是管理员
function isAdmin(role: string | null): boolean {
  return role === 'ADMIN';
}

// 获取平台列表
export async function GET(req: NextRequest) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const { token, role } = getAuthFromCookie(cookie);
    
    console.log('GET - 认证信息:', { token: token?.slice(0, 10), role });
    
    if (!token || !isAdmin(role)) {
      return NextResponse.json(
        { message: "需要管理员权限" },
        { status: 403 }
      );
    }
    
    // 从后端API获取数据
    const response = await axios.get(`${baseUrl}/api/admin/ai-platforms`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("获取AI平台列表失败:", error);
    return NextResponse.json(
      { message: error.response?.data?.message || "获取平台列表失败" },
      { status: error.response?.status || 500 }
    );
  }
}

// 创建新平台
export async function POST(req: NextRequest) {
  try {
    // 获取认证信息
    const cookie = req.headers.get("cookie") || "";
    const { token, role } = getAuthFromCookie(cookie);
    
    console.log('POST - 认证信息:', { token: token?.slice(0, 10), role });
    
    if (!token || !isAdmin(role)) {
      return NextResponse.json(
        { message: "需要管理员权限" },
        { status: 403 }
      );
    }

    // 解析表单数据
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder") as string || "ai-platforms";
    
    console.log('表单数据:', { name, type, hasFile: !!file, folder });
    
    let logoUrl = null;
    
    // 如果有文件，上传到存储服务器
    if (file) {
      // 创建新的FormData对象用于文件上传
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("folder", folder);
      
      console.log('准备上传文件:', { 
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        folder 
      });
      
      try {
        const uploadResponse = await axios.post(
          `${baseUrl}/api/storage/upload`,
          uploadFormData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              // 让axios自动设置正确的Content-Type和boundary
            },
          }
        );
        
        console.log('文件上传成功:', uploadResponse.data);
        logoUrl = uploadResponse.data.url;
      } catch (uploadError: any) {
        console.error('文件上传失败:', uploadError.response?.data || uploadError.message);
        throw uploadError;
      }
    }
    
    console.log('准备创建平台:', { name, type, logoUrl });
    
    // 发送平台数据到后端API
    const response = await axios.post(
      `${baseUrl}/api/admin/ai-platforms`,
      { 
        name,
        type,
        logoUrl
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    console.log('平台创建成功:', response.data);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("创建AI平台失败:", error.response?.data || error.message);
    if (error.code === 'ERR_INVALID_URL') {
      return NextResponse.json(
        { message: "API地址配置错误，请检查环境变量设置" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: error.response?.data?.message || "创建平台失败" },
      { status: error.response?.status || 500 }
    );
  }
} 