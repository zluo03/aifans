import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// 获取默认API URL
const getApiUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL;
  if (configuredUrl) return configuredUrl;
  console.warn("环境变量NEXT_PUBLIC_API_URL未设置，使用默认URL!");
  return "http://localhost:3001"; // 使用默认API URL
};

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

// 获取特定平台
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`开始获取ID为${params.id}的AI平台...`);
    
    const apiUrl = getApiUrl();
    
    // 从后端API获取数据
    const response = await axios.get(
      `${apiUrl}/api/admin/ai-platforms/${params.id}`,
      {
        headers: {
          Cookie: req.headers.get("cookie") || "",
        },
      }
    );

    console.log(`成功获取ID为${params.id}的AI平台`);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`获取ID为${params.id}的平台失败:`, error.message);
    if (error.response) {
      console.error("错误响应状态:", error.response.status);
      console.error("错误响应数据:", error.response.data);
    }
    return NextResponse.json(
      { message: error.response?.data?.message || "获取平台详情失败" },
      { status: error.response?.status || 500 }
    );
  }
}

// 更新平台
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`开始更新ID为${params.id}的AI平台...`);
    
    const apiUrl = getApiUrl();
    const cookie = req.headers.get("cookie") || "";
    const { token, role } = getAuthFromCookie(cookie);
    
    console.log('PATCH - 认证信息:', { token: token?.slice(0, 10), role });
    
    if (!token || !isAdmin(role)) {
      return NextResponse.json(
        { message: "需要管理员权限" },
        { status: 403 }
      );
    }
    
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const file = formData.get("file") as File | null;
    const logoUrl = formData.get("logoUrl") as string | null;
    const folder = formData.get("folder") as string || "ai-platforms";
    
    console.log("接收到的表单数据:", { name, type, hasFile: !!file, logoUrl, folder });
    
    // 准备更新数据
    const updateData: { name: string; type: string; logoUrl?: string | null } = {
      name,
      type,
      logoUrl: null
    };
    
    // 如果有新上传的文件，先上传
    if (file) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("folder", folder);
        
        console.log("准备上传文件:", file.name, file.type, file.size);
        
        const uploadResponse = await axios.post(
          `${apiUrl}/api/storage/upload`,
          uploadFormData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        // 使用上传后的URL
        updateData.logoUrl = uploadResponse.data.url;
        console.log("文件上传成功，获取到URL:", updateData.logoUrl);
      } catch (uploadError: any) {
        console.error("上传图标文件失败:", uploadError.message);
        if (uploadError.response) {
          console.error("错误响应状态:", uploadError.response.status);
          console.error("错误响应数据:", uploadError.response.data);
        }
        return NextResponse.json(
          { message: "上传图标文件失败: " + (uploadError.response?.data?.message || uploadError.message) },
          { status: 400 }
        );
      }
    } else if (logoUrl) {
      // 如果没有新文件但有原有URL，保留原有URL
      updateData.logoUrl = logoUrl;
      console.log("使用现有的图标URL:", logoUrl);
    } else {
      console.log("没有提供图标");
    }

    // 发送到后端API
    console.log("发送更新数据到后端:", updateData);
    
    const response = await axios.patch(
      `${apiUrl}/api/admin/ai-platforms/${params.id}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`成功更新ID为${params.id}的AI平台`);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`更新ID为${params.id}的平台失败:`, error.message);
    if (error.response) {
      console.error("错误响应状态:", error.response.status);
      console.error("错误响应数据:", error.response.data);
    }
    return NextResponse.json(
      { message: error.response?.data?.message || "更新平台失败" },
      { status: error.response?.status || 500 }
    );
  }
}

// 删除平台
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`开始删除ID为${params.id}的AI平台...`);
    
    const apiUrl = getApiUrl();
    const cookie = req.headers.get("cookie") || "";
    const { token, role } = getAuthFromCookie(cookie);
    
    console.log('DELETE - 认证信息:', { token: token?.slice(0, 10), role });
    
    if (!token || !isAdmin(role)) {
      return NextResponse.json(
        { message: "需要管理员权限" },
        { status: 403 }
      );
    }
    
    // 发送到后端API
    await axios.delete(
      `${apiUrl}/api/admin/ai-platforms/${params.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`成功删除ID为${params.id}的AI平台`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`删除ID为${params.id}的平台失败:`, error.message);
    if (error.response) {
      console.error("错误响应状态:", error.response.status);
      console.error("错误响应数据:", error.response.data);
    }
    return NextResponse.json(
      { message: error.response?.data?.message || "删除平台失败" },
      { status: error.response?.status || 500 }
    );
  }
} 