import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getAuthToken } from '@/lib/utils/auth';
import { BASE_URL } from '@/lib/api/api';

// 获取单个影片
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取认证token
    const token = getAuthToken(req);
    
    if (!token) {
      return NextResponse.json(
        { message: '未登录或登录已过期' },
        { status: 401 }
      );
    }
    
    // 从后端API获取数据
    const response = await axios.get(
      `${BASE_URL}/admin/screenings/${params.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Cookie: req.headers.get('cookie') || '',
        },
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('获取影片失败:', error.response?.data || error);
    
    // 如果是认证错误，返回401状态码
    if (error.response?.status === 401) {
      return NextResponse.json(
        { message: '未登录或登录已过期' },
        { status: 401 }
      );
    }
    
    // 如果是404错误，返回404状态码
    if (error.response?.status === 404) {
      return NextResponse.json(
        { message: '影片不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: error.response?.data?.message || '获取影片失败' },
      { status: error.response?.status || 500 }
    );
  }
}

// 更新影片
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取认证token
    const token = getAuthToken(req);
    
    if (!token) {
      return NextResponse.json(
        { message: '未登录或登录已过期' },
        { status: 401 }
      );
    }
    
    // 获取表单数据
    const formData = await req.formData();
    
    // 转发到后端API
    const response = await axios.post(
      `${BASE_URL}/admin/screenings/${params.id}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Cookie: req.headers.get('cookie') || '',
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('更新影片失败:', error.response?.data || error);
    
    // 如果是认证错误，返回401状态码
    if (error.response?.status === 401) {
      return NextResponse.json(
        { message: '未登录或登录已过期' },
        { status: 401 }
      );
    }
    
    // 如果是404错误，返回404状态码
    if (error.response?.status === 404) {
      return NextResponse.json(
        { message: '影片不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: error.response?.data?.message || '更新影片失败' },
      { status: error.response?.status || 500 }
    );
  }
}

// 删除影片
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取认证token
    const token = getAuthToken(req);
    
    if (!token) {
      return NextResponse.json(
        { message: '未登录或登录已过期' },
        { status: 401 }
      );
    }
    
    // 转发到后端API
    const response = await axios.delete(
      `${BASE_URL}/admin/screenings/${params.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Cookie: req.headers.get('cookie') || '',
        },
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('删除影片失败:', error.response?.data || error);
    
    // 如果是认证错误，返回401状态码
    if (error.response?.status === 401) {
      return NextResponse.json(
        { message: '未登录或登录已过期' },
        { status: 401 }
      );
    }
    
    // 如果是404错误，返回404状态码
    if (error.response?.status === 404) {
      return NextResponse.json(
        { message: '影片不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: error.response?.data?.message || '删除影片失败' },
      { status: error.response?.status || 500 }
    );
  }
} 