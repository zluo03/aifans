import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthFromCookie } from '@/lib/utils/auth';

const prisma = new PrismaClient();

// 点赞/取消点赞影片
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的影片ID' },
        { status: 400 }
      );
    }

    // 获取用户信息
    let userId: number | undefined = undefined;
    
    console.log('=== 影院点赞API调试信息 ===');
    console.log('请求头:', {
      authorization: request.headers.get('Authorization'),
      cookie: request.headers.get('cookie')
    });
    
    // 首先尝试从Authorization头获取token
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        console.log('从Authorization头获取的token:', token.substring(0, 50) + '...');
        const jwt = require('jsonwebtoken');
        const secretKey = process.env.JWT_SECRET || 'your-secret-key';
        console.log('使用的JWT_SECRET:', secretKey);
        const decoded = jwt.verify(token, secretKey);
        console.log('JWT解析成功:', { sub: decoded.sub, role: decoded.role });
        userId = decoded.sub;
      } catch (jwtError) {
        console.error('JWT token解析失败:', jwtError.message);
      }
    }
    
    // 如果Authorization头没有token，尝试从cookie获取
    if (!userId) {
      const cookie = request.headers.get('cookie') || '';
      console.log('从cookie获取认证信息...');
      const { token } = getAuthFromCookie(cookie);
      
      if (token) {
        console.log('从cookie获取的token:', token.substring(0, 50) + '...');
        try {
          const jwt = require('jsonwebtoken');
          const secretKey = process.env.JWT_SECRET || 'your-secret-key';
          const decoded = jwt.verify(token, secretKey);
          console.log('Cookie JWT解析成功:', { sub: decoded.sub, role: decoded.role });
          userId = decoded.sub;
        } catch (jwtError) {
          console.error('Cookie token解析失败:', jwtError.message);
        }
      } else {
        console.log('cookie中没有找到token');
      }
    }
    
    console.log('最终获取的userId:', userId);
    console.log('=== 调试信息结束 ===');
    
    if (!userId) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    // 检查影片是否存在
    const screening = await prisma.screening.findUnique({
      where: { id }
    });

    if (!screening) {
      return NextResponse.json(
        { error: '影片不存在' },
        { status: 404 }
      );
    }

    // 使用通用的Like表来处理点赞
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_entityType_entityId: {
          userId,
          entityType: 'SCREENING',
          entityId: id
        }
      }
    });

    let liked = false;
    let likesCountChange = 0;

    if (existingLike) {
      // 取消点赞
      await prisma.like.delete({
        where: {
          userId_entityType_entityId: {
            userId,
            entityType: 'SCREENING',
            entityId: id
          }
        }
      });
      liked = false;
      likesCountChange = -1;
    } else {
      // 添加点赞
      await prisma.like.create({
        data: {
          userId,
          entityType: 'SCREENING',
          entityId: id
        }
      });
      liked = true;
      likesCountChange = 1;
    }

    // 更新影片的点赞数
    await prisma.screening.update({
      where: { id },
      data: {
        likesCount: {
          increment: likesCountChange
        }
      }
    });

    return NextResponse.json({ liked });
  } catch (error) {
    console.error('点赞操作失败:', error);
    return NextResponse.json(
      { error: '点赞操作失败' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 