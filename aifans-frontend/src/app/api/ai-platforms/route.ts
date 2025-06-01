import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// 获取基础URL
const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'http://localhost:3001';

// 获取公开的AI平台列表
export async function GET(request: NextRequest) {
  try {
    console.log('开始获取AI平台列表，请求URL:', `${baseUrl}/api/ai-platforms`);
    
    // 调用后端API
    const response = await axios.get(`${baseUrl}/api/ai-platforms`);
    console.log('成功获取AI平台列表:', response.data);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('获取AI平台列表失败:', error.response?.data || error);
    console.error('错误状态码:', error.response?.status);
    console.error('错误详情:', {
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
    });
    
    return NextResponse.json(
      { message: '获取AI平台列表失败' },
      { status: error.response?.status || 500 }
    );
  }
} 