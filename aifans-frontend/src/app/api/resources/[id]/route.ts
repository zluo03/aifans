import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    
    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // 如果有认证头，转发到后端
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    console.log('转发资源详情请求到后端:', {
      url: `${BACKEND_URL}/api/resources/${id}`,
      hasAuth: !!authHeader,
      authPreview: authHeader ? authHeader.substring(0, 20) + '...' : 'none'
    });
    
    const response = await fetch(`${BACKEND_URL}/api/resources/${id}`, {
      headers,
    });

    console.log('后端响应状态:', response.status, response.statusText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error('后端错误详情:', errorData);
      } catch (parseError) {
        console.error('解析后端错误失败:', parseError);
        errorData = { error: '后端响应错误', details: `HTTP ${response.status}` };
      }
      
      // 转发后端的错误响应
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    console.log('后端响应成功，资源ID:', data.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching resource:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/api/resources/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('更新资源失败:', error);
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // PUT方法也使用PATCH实现，保持兼容性
  return PATCH(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const response = await fetch(`${BACKEND_URL}/api/resources/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('删除资源失败:', error);
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    );
  }
} 