import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { BASE_URL } from "@/lib/api/api";

// 获取作品详情
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 从后端API获取数据
    const response = await axios.get(
      `${BASE_URL}/posts/${params.id}`,
      {
        headers: {
          Cookie: req.headers.get("cookie") || "",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`获取ID为${params.id}的作品失败:`, error);
    return NextResponse.json(
      { message: error.response?.data?.message || "获取作品详情失败" },
      { status: error.response?.status || 500 }
    );
  }
}

// 更新作品
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    // 发送到后端API
    const response = await axios.patch(
      `${BASE_URL}/posts/${params.id}`,
      body,
      {
        headers: {
          Cookie: req.headers.get("cookie") || "",
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`更新ID为${params.id}的作品失败:`, error);
    return NextResponse.json(
      { message: error.response?.data?.message || "更新作品失败" },
      { status: error.response?.status || 500 }
    );
  }
}

// 删除作品
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 发送到后端API
    await axios.delete(
      `${BASE_URL}/posts/${params.id}`,
      {
        headers: {
          Cookie: req.headers.get("cookie") || "",
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`删除ID为${params.id}的作品失败:`, error);
    return NextResponse.json(
      { message: error.response?.data?.message || "删除作品失败" },
      { status: error.response?.status || 500 }
    );
  }
} 