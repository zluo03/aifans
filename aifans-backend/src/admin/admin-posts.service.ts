import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface FindAllOptions {
  page: number;
  limit: number;
  search?: string;
  mediaType?: string;
  status?: string;
}

@Injectable()
export class AdminPostsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(options: FindAllOptions) {
    const { page, limit, search, mediaType, status } = options;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { prompt: { contains: search } },
        { description: { contains: search } },
        { user: { nickname: { contains: search } } },
        { user: { username: { contains: search } } },
      ];
    }

    if (mediaType && mediaType !== 'all') {
      where.type = mediaType;
    }

    if (status && status !== 'all') {
      where.status = status;
    } else {
      // 默认不显示已删除的作品
      where.status = { not: 'ADMIN_DELETED' };
    }

    // 获取总数
    const total = await this.prisma.post.count({ where });

    // 获取数据
    const posts = await this.prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        aiPlatform: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            type: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(total / limit);

    // 转换数据格式以匹配前端期望
    const items = posts.map(post => ({
      id: post.id,
      title: post.title || `${post.aiPlatform.name} 作品`,
      description: post.description || post.prompt,
      mediaUrl: post.fileUrl,
      mediaType: post.type,
      status: this.mapPostStatusToInspirationStatus(post.status),
      createdAt: post.createdAt.toISOString(),
      user: {
        id: post.user.id,
        username: post.user.username,
        nickname: post.user.nickname,
        avatarUrl: post.user.avatarUrl,
      },
      likesCount: post.likesCount,
      favoritesCount: post.favoritesCount,
      viewsCount: post.viewsCount,
      aiPlatform: post.aiPlatform,
    }));

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOne(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        aiPlatform: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            type: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`ID为${id}的作品不存在`);
    }

    return {
      id: post.id,
      title: post.title || `${post.aiPlatform.name} 作品`,
      description: post.description || post.prompt,
      mediaUrl: post.fileUrl,
      mediaType: post.type,
      status: this.mapPostStatusToInspirationStatus(post.status),
      createdAt: post.createdAt.toISOString(),
      user: {
        id: post.user.id,
        username: post.user.username,
        nickname: post.user.nickname,
        avatarUrl: post.user.avatarUrl,
      },
      likesCount: post.likesCount,
      favoritesCount: post.favoritesCount,
      viewsCount: post.viewsCount,
      aiPlatform: post.aiPlatform,
      prompt: post.prompt,
      tags: post.tags,
    };
  }

  async updateStatus(id: number, status: 'VISIBLE' | 'HIDDEN' | 'ADMIN_DELETED') {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`ID为${id}的作品不存在`);
    }

    // 将前端状态映射到数据库状态
    let postStatus: string;
    switch (status) {
      case 'VISIBLE':
        postStatus = 'VISIBLE';
        break;
      case 'HIDDEN':
        postStatus = 'HIDDEN';
        break;
      case 'ADMIN_DELETED':
        postStatus = 'ADMIN_DELETED';
        break;
      default:
        postStatus = 'VISIBLE';
    }

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: { status: postStatus as any },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      id: updatedPost.id,
      status: this.mapPostStatusToInspirationStatus(updatedPost.status),
      message: '状态更新成功',
    };
  }

  async remove(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`ID为${id}的作品不存在`);
    }

    // 软删除：将状态设置为ADMIN_DELETED
    await this.prisma.post.update({
      where: { id },
      data: { status: 'ADMIN_DELETED' },
    });

    return {
      id,
      message: '作品已删除',
    };
  }

  // 将数据库状态映射到前端期望的状态
  private mapPostStatusToInspirationStatus(status: string): 'ACTIVE' | 'PENDING' | 'REJECTED' {
    switch (status) {
      case 'VISIBLE':
        return 'ACTIVE';
      case 'HIDDEN':
        return 'PENDING';
      case 'ADMIN_DELETED':
        return 'REJECTED';
      default:
        return 'ACTIVE';
    }
  }


} 