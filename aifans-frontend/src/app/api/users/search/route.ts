import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 搜索用户（用于创作者选择）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query.trim()) {
      return NextResponse.json({ users: [] });
    }

    // 搜索用户，按昵称和用户名模糊匹配
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { nickname: { contains: query } },
          { username: { contains: query } }
        ],
        status: 'ACTIVE' // 只搜索活跃用户
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatarUrl: true,
        role: true
      },
      take: limit,
      orderBy: [
        { role: 'desc' }, // 优先显示高级用户
        { nickname: 'asc' }
      ]
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('搜索用户失败:', error);
    return NextResponse.json(
      { error: '搜索用户失败' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 