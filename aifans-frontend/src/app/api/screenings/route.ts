import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getAuthToken } from "../../../lib/utils/auth";
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
    
    if (!token) {
      return NextResponse.json(
        { message: "未登录或登录已过期" },
        { status: 401 }
      );
    }
    
    // 从后端API获取数据
    const response = await axios.get(
      `${BASE_URL}/screenings`,
      {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
          Cookie: req.headers.get("cookie") || "",
        },
      }
    );
    
    // 转换数据格式以匹配前端期望
    const data = response.data;
    if (data.screenings && Array.isArray(data.screenings)) {
      const formattedScreenings = data.screenings.map((screening: any) => ({
        id: screening.id.toString(), // 转换为字符串类型
        title: screening.title,
        description: screening.description || '',
        thumbnailUrl: screening.thumbnailUrl || '',
        videoUrl: screening.videoUrl,
        adminUploaderId: screening.adminUploaderId,
        likeCount: screening.likesCount || 0, // 字段名称转换
        viewCount: screening.viewsCount || 0, // 字段名称转换
        createdAt: screening.createdAt,
        updatedAt: screening.updatedAt || screening.createdAt, // 添加updatedAt字段
        adminUploader: {
          id: screening.adminUploader?.id,
          username: screening.adminUploader?.nickname || screening.adminUploader?.username, // 字段名称转换
          avatarUrl: screening.adminUploader?.avatarUrl
        },
        creator: screening.creator ? {
          id: screening.creator.id,
          username: screening.creator.username,
          nickname: screening.creator.nickname,
          avatarUrl: screening.creator.avatarUrl
        } : undefined,
        isLiked: screening.isLiked || false
      }));
      
      return NextResponse.json({
        screenings: formattedScreenings,
        meta: data.meta
      });
    }
    
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