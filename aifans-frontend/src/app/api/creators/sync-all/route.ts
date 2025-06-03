import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/utils/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    // 获取认证token
    const token = getAuthToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 调用后端API同步所有创作者信息
    const response = await fetch(`${BACKEND_URL}/api/creators/sync-all-with-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('同步创作者信息失败:', error);
    return NextResponse.json(
      { error: '同步创作者信息失败' },
      { status: 500 }
    );
  }
} 