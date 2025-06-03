import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/utils/auth';

// 验证管理员权限
async function verifyAdminAccess(request: NextRequest) {
  console.log('验证管理员权限 - 开始');
  
  const token = getAuthToken(request);
  
  if (!token) {
    console.log('验证管理员权限 - 未找到token');
    return false;
  }
  
  console.log('验证管理员权限 - 获取到token:', token.substring(0, 20) + '...');
  
  // 调用后端API验证是否为管理员
  try {
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const apiUrl = `${BACKEND_URL}/api/auth/profile`;
    console.log('验证管理员权限 - 调用API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': token
      }
    });
    
    console.log('验证管理员权限 - API响应状态:', response.status);
    
    if (!response.ok) {
      console.log('验证管理员权限 - API响应不成功');
      return false;
    }
    
    const userData = await response.json();
    console.log('验证管理员权限 - 用户角色:', userData.role);
    
    const isAdmin = userData.role === 'ADMIN';
    console.log('验证管理员权限 - 是否为管理员:', isAdmin);
    
    return isAdmin;
  } catch (error) {
    console.error('验证管理员权限失败:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const isAdmin = await verifyAdminAccess(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: '无权访问' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // 确保所有必要的字段都存在
    if (!body.notes) {
      body.notes = {
        imageSize: 10, // 默认值，单位MB
        videoSize: 100 // 默认值，单位MB
      };
    }
    
    if (!body.inspiration) {
      body.inspiration = {
        imageSize: 10, // 默认值，单位MB
        videoSize: 100 // 默认值，单位MB
      };
    }
    
    if (!body.screenings) {
      body.screenings = {
        videoSize: 500 // 默认值，单位MB
      };
    }
    
    // 确保所有必要的字段都存在且为整数
    if (body.notes) {
      if (body.notes.imageSize) {
        body.notes.imageSize = Math.max(1, Math.floor(body.notes.imageSize));
      }
      if (body.notes.videoSize) {
        body.notes.videoSize = Math.max(1, Math.floor(body.notes.videoSize));
      }
    }
    
    if (body.inspiration) {
      if (body.inspiration.imageSize) {
        body.inspiration.imageSize = Math.max(1, Math.floor(body.inspiration.imageSize));
      }
      if (body.inspiration.videoSize) {
        body.inspiration.videoSize = Math.max(1, Math.floor(body.inspiration.videoSize));
      }
    }
    
    if (body.screenings) {
      if (body.screenings.videoSize) {
        body.screenings.videoSize = Math.max(1, Math.floor(body.screenings.videoSize));
      }
    }
    
    // 直接转发到后端API
    const token = getAuthToken(request);
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const apiUrl = `${BACKEND_URL}/api/admin/settings/storage/save-oss-config`;
    
    console.log('转发请求到后端API:', apiUrl);
    console.log('请求体:', body);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token || ''
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('后端API响应错误:', response.status, errorText);
      return NextResponse.json(
        { success: false, message: `后端API错误: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('后端API响应:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('保存OSS配置失败:', error);
    return NextResponse.json(
      { success: false, message: '保存OSS配置失败' },
      { status: 500 }
    );
  }
} 