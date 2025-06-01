import { NextRequest, NextResponse } from 'next/server';
import { baseUrl } from '@/lib/utils/api-helpers';

// 获取社交媒体列表（管理员）
export async function GET(request: NextRequest) {
  try {
    // 从请求头获取认证信息
    const authorization = request.headers.get('authorization');
    console.log('收到的认证头:', authorization);

    if (!authorization) {
      // 尝试从cookie获取token
      const cookie = request.headers.get('cookie') || '';
      const authStorage = cookie.split(';').find(c => c.trim().startsWith('auth-storage='));
      
      if (authStorage) {
        try {
          const decoded = decodeURIComponent(authStorage.split('=')[1]);
          const parsed = JSON.parse(decoded);
          const token = parsed?.state?.token;
          
          if (token) {
            console.log('从cookie获取到token');
            const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            const response = await fetch(`${baseUrl}/api/social-media/admin`, {
              headers: {
                'Authorization': formattedToken,
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              console.error('后端错误响应:', errorData);
              return NextResponse.json(
                errorData,
                { status: response.status }
              );
            }
            
            const data = await response.json();
            return NextResponse.json(data);
          }
        } catch (error) {
          console.error('解析cookie中的token失败:', error);
        }
      }
      
      console.error('未找到认证头或cookie中的token');
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 401 }
      );
    }

    // 确保认证头格式正确
    const token = authorization.startsWith('Bearer ') ? authorization : `Bearer ${authorization}`;
    console.log('使用的认证头:', token);

    const response = await fetch(`${baseUrl}/api/social-media/admin`, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    console.log('后端响应状态:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('后端错误响应:', errorData);
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('获取社交媒体列表失败:', error);
    return NextResponse.json(
      { message: '获取列表失败', error: error.message },
      { status: 500 }
    );
  }
}