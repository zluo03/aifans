import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/utils/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    console.log('开始检查管理员权限');
    
    // 从请求中获取认证token
    const authHeader = request.headers.get('authorization');
    console.log('收到的认证头:', authHeader ? '存在' : '不存在');
    
    if (!authHeader) {
      console.log('未提供认证头，尝试从cookie获取');
      
      // 尝试从auth-storage cookie获取token
      const authStorageCookie = request.cookies.get('auth-storage')?.value;
      if (authStorageCookie) {
        console.log('从cookie获取到auth-storage');
        try {
          const decodedStorage = decodeURIComponent(authStorageCookie);
          const { state } = JSON.parse(decodedStorage);
          
          if (state?.token) {
            console.log('从cookie的auth-storage中提取到token');
            // 使用从cookie中获取的token继续处理
            return await handleAdminCheck(state.token);
          }
        } catch (error) {
          console.error('解析auth-storage cookie失败:', error);
        }
      }
      
      return NextResponse.json(
        { isAdmin: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return await handleAdminCheck(authHeader);
    
  } catch (error) {
    console.error('检查管理员权限失败:', error);
    return NextResponse.json(
      { isAdmin: false, error: '检查管理员权限失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// 处理管理员权限检查的辅助函数
async function handleAdminCheck(token: string) {
  try {
    // 确保token格式正确
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    console.log('检查管理员权限，token状态:', !!formattedToken);
    console.log('后端API URL:', BACKEND_URL);
    
    // 调用后端API检查用户信息
    const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
      headers: {
        'Authorization': formattedToken,
        'Content-Type': 'application/json'
      },
      cache: 'no-cache'
    });

    console.log('后端API响应状态码:', response.status);
    
    if (!response.ok) {
      console.error('获取用户信息失败:', response.status);
      let errorData;
      try {
        errorData = await response.json();
        console.error('错误详情:', errorData);
      } catch (e) {
        console.error('无法解析错误响应');
        errorData = { message: '无法解析错误响应' };
      }
      
      return NextResponse.json(
        { isAdmin: false, error: `获取用户信息失败: ${response.status}`, details: errorData },
        { status: response.status }
      );
    }

    const userData = await response.json();
    console.log('用户角色:', userData.role);
    
    // 检查用户角色是否为管理员
    const isAdmin = userData.role === 'ADMIN' || userData.role === 'SUPER_ADMIN';
    console.log('是否为管理员:', isAdmin);
    
    return NextResponse.json({
      isAdmin,
      user: {
        id: userData.id,
        username: userData.username,
        role: userData.role
      }
    });
  } catch (error) {
    console.error('处理管理员检查时出错:', error);
    return NextResponse.json(
      { isAdmin: false, error: '处理管理员检查时出错', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 