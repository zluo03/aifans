import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthFromCookie } from '@/lib/utils/auth';

const prisma = new PrismaClient();

// 获取单个影院详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的影片ID' },
        { status: 400 }
      );
    }

    // 获取用户信息（如果已登录）
    let userId: number | null = null;
    try {
      const cookie = request.headers.get('cookie') || '';
      const { token } = getAuthFromCookie(cookie);
      if (token) {
        // 这里暂时跳过token验证，直接允许访问
        // 在实际应用中应该验证token并获取userId
      }
    } catch (error) {
      // 忽略token验证错误，允许游客访问
    }

    // 获取影片详情
    const screening = await prisma.screening.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        videoUrl: true,
        adminUploaderId: true,
        creatorId: true,
        likesCount: true,
        viewsCount: true,
        createdAt: true,
        adminUploader: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true
          }
        },
        creator: {
          select: {
            id: true,
            nickname: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    });

    if (!screening) {
      return NextResponse.json(
        { error: '影片不存在' },
        { status: 404 }
      );
    }

    // 暂时不实现点赞和观看记录功能，因为数据库中没有相应的表
    // 后续需要添加这些表到Prisma schema中
    let isLiked = false;

    // 简单的观看次数更新（每次访问都增加，后续可以优化）
    if (userId) {
      await prisma.screening.update({
        where: { id },
        data: {
          viewsCount: {
            increment: 1
          }
        }
      });
      screening.viewsCount += 1;
    }

    return NextResponse.json({
      id: screening.id,
      title: screening.title,
      description: screening.description || '',
      thumbnailUrl: screening.thumbnailUrl || '',
      videoUrl: screening.videoUrl,
      adminUploaderId: screening.adminUploaderId,
      likesCount: screening.likesCount,
      viewsCount: screening.viewsCount,
      createdAt: screening.createdAt.toISOString(),
      adminUploader: {
        id: screening.adminUploader.id,
        nickname: screening.adminUploader.nickname,
        avatarUrl: screening.adminUploader.avatarUrl
      },
      isLiked
    });
  } catch (error) {
    console.error('获取影片详情失败:', error);
    return NextResponse.json(
      { error: '获取影片详情失败' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 