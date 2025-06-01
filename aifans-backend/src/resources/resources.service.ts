import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { SensitiveWordsCheckService } from '../common/services/sensitive-words.service';

@Injectable()
export class ResourcesService {
  constructor(
    private prisma: PrismaService,
    private sensitiveWordsCheckService: SensitiveWordsCheckService,
  ) {}

  async create(userId: number, createResourceDto: CreateResourceDto) {
    // 检查用户是否为管理员
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('只有管理员可以创建资源');
    }

    // 敏感词检测
    const textsToCheck: string[] = [createResourceDto.title];
    
    if (createResourceDto.content) {
      if (typeof createResourceDto.content === 'string') {
        textsToCheck.push(createResourceDto.content);
      } else if (typeof createResourceDto.content === 'object') {
        const contentStr = JSON.stringify(createResourceDto.content);
        textsToCheck.push(contentStr);
      }
    }

    const sensitiveCheck = await this.sensitiveWordsCheckService.checkMultipleTexts(textsToCheck);
    if (sensitiveCheck.isSensitive) {
      throw new BadRequestException(`内容包含敏感词：${sensitiveCheck.matchedWords.join(', ')}`);
    }

    return this.prisma.resource.create({
      data: {
        ...createResourceDto,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        category: true,
      },
    });
  }

  async findAll(page: number = 1, limit: number = 10, query?: string, categoryId?: number) {
    const skip = (page - 1) * limit;
    
    // 构建查询条件
    const where: any = {
      status: 'VISIBLE',
    };

    // 添加搜索条件
    if (query) {
      where.title = {
        contains: query,
        mode: 'insensitive',
      };
    }

    // 添加分类筛选条件
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    const [resources, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
            },
          },
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.resource.count({
        where,
      }),
    ]);

    return {
      resources,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, user?: any) {
    // 检查用户权限：需要登录且不能是普通用户
    if (!user) {
      throw new ForbiddenException('需要登录才能查看资源详情');
    }

    if (user.role === 'NORMAL') {
      throw new ForbiddenException('此功能需要升级会员才能使用');
    }

    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        category: true,
      },
    });

    if (!resource || resource.status === 'DELETED') {
      throw new NotFoundException('资源不存在');
    }

    // 增加浏览量
    await this.prisma.resource.update({
      where: { id },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
    });

    return resource;
  }

  async update(id: number, userId: number, updateResourceDto: UpdateResourceDto) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException('资源不存在');
    }

    // 检查权限：只有管理员或资源作者可以编辑
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || (user.role !== 'ADMIN' && resource.userId !== userId)) {
      throw new ForbiddenException('没有权限编辑此资源');
    }

    // 敏感词检测（只检测有更新的字段）
    const textsToCheck: string[] = [];
    if (updateResourceDto.title) textsToCheck.push(updateResourceDto.title);
    
    if (updateResourceDto.content) {
      if (typeof updateResourceDto.content === 'string') {
        textsToCheck.push(updateResourceDto.content);
      } else if (typeof updateResourceDto.content === 'object') {
        const contentStr = JSON.stringify(updateResourceDto.content);
        textsToCheck.push(contentStr);
      }
    }

    if (textsToCheck.length > 0) {
      const sensitiveCheck = await this.sensitiveWordsCheckService.checkMultipleTexts(textsToCheck);
      if (sensitiveCheck.isSensitive) {
        throw new BadRequestException(`内容包含敏感词：${sensitiveCheck.matchedWords.join(', ')}`);
      }
    }

    return this.prisma.resource.update({
      where: { id },
      data: updateResourceDto,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        category: true,
      },
    });
  }

  async remove(id: number, userId: number) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException('资源不存在');
    }

    // 检查权限：只有管理员或资源作者可以删除
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || (user.role !== 'ADMIN' && resource.userId !== userId)) {
      throw new ForbiddenException('没有权限删除此资源');
    }

    return this.prisma.resource.update({
      where: { id },
      data: {
        status: 'DELETED',
      },
    });
  }

  async toggleLike(resourceId: number, userId: number) {
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_entityType_entityId: {
          userId,
          entityType: 'RESOURCE',
          entityId: resourceId,
        },
      },
    });

    if (existingLike) {
      // 取消点赞
      await this.prisma.like.delete({
        where: {
          userId_entityType_entityId: {
            userId,
            entityType: 'RESOURCE',
            entityId: resourceId,
          },
        },
      });

      await this.prisma.resource.update({
        where: { id: resourceId },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
      });

      return { liked: false };
    } else {
      // 添加点赞
      await this.prisma.like.create({
        data: {
          userId,
          entityType: 'RESOURCE',
          entityId: resourceId,
        },
      });

      await this.prisma.resource.update({
        where: { id: resourceId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      });

      return { liked: true };
    }
  }

  async toggleFavorite(resourceId: number, userId: number) {
    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_entityType_entityId: {
          userId,
          entityType: 'RESOURCE',
          entityId: resourceId,
        },
      },
    });

    if (existingFavorite) {
      // 取消收藏
      await this.prisma.favorite.delete({
        where: {
          userId_entityType_entityId: {
            userId,
            entityType: 'RESOURCE',
            entityId: resourceId,
          },
        },
      });

      await this.prisma.resource.update({
        where: { id: resourceId },
        data: {
          favoritesCount: {
            decrement: 1,
          },
        },
      });

      return { favorited: false };
    } else {
      // 添加收藏
      await this.prisma.favorite.create({
        data: {
          userId,
          entityType: 'RESOURCE',
          entityId: resourceId,
        },
      });

      await this.prisma.resource.update({
        where: { id: resourceId },
        data: {
          favoritesCount: {
            increment: 1,
          },
        },
      });

      return { favorited: true };
    }
  }

  async getUserInteractions(resourceId: number, userId: number) {
    const [like, favorite] = await Promise.all([
      this.prisma.like.findUnique({
        where: {
          userId_entityType_entityId: {
            userId,
            entityType: 'RESOURCE',
            entityId: resourceId,
          },
        },
      }),
      this.prisma.favorite.findUnique({
        where: {
          userId_entityType_entityId: {
            userId,
            entityType: 'RESOURCE',
            entityId: resourceId,
          },
        },
      }),
    ]);

    return {
      liked: !!like,
      favorited: !!favorite,
    };
  }

  async getFavoritedResources(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    // 先获取用户收藏的资源ID列表
    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: {
          userId,
          entityType: 'RESOURCE',
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.favorite.count({
        where: {
          userId,
          entityType: 'RESOURCE',
        },
      }),
    ]);

    // 获取资源详情
    const resourceIds = favorites.map(favorite => favorite.entityId);
    const resources = await this.prisma.resource.findMany({
      where: {
        id: { in: resourceIds },
        status: 'VISIBLE',
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        category: true,
      },
    });

    // 按收藏时间排序
    const sortedResources = resourceIds
      .map(id => resources.find(resource => resource.id === id))
      .filter(resource => resource !== undefined);

    return {
      resources: sortedResources,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
} 