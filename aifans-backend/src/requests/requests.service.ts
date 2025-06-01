import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto, UpdateRequestDto, CreateResponseDto } from './dto';
import { EntityType, RequestStatus, ResponseStatus, Role } from '../types/prisma-enums';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRequest(userId: number, dto: CreateRequestDto) {
    // 检查分类是否存在
    const category = await this.prisma.requestCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return this.prisma.request.create({
      data: {
        userId,
        title: dto.title,
        content: dto.content,
        categoryId: dto.categoryId,
        priority: dto.priority,
        budget: dto.budget,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        category: true,
      },
    });
  }

  async findAllRequests(
    page = 1,
    limit = 10,
    categoryId?: number,
    status?: RequestStatus,
    priority?: string,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const [requests, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          user: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatarUrl: true,
            },
          },
          category: true,
        },
      }),
      this.prisma.request.count({ where }),
    ]);

    return {
      requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findRequestById(id: number, userId?: number) {
    const request = await this.prisma.request.findUnique({
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
        category: true,
        responses: {
          where: {
            OR: [
              { isPublic: true },
              { userId: userId ?? -1 }, // 如果userId不存在，用-1确保不会匹配
              { request: { userId: userId ?? -1 } }, // 需求创建者可以看到所有响应
            ],
          },
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
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('需求不存在');
    }

    // 增加浏览量
    await this.prisma.request.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });

    // 检查用户是否点赞或收藏过
    if (userId) {
      const [like, favorite] = await Promise.all([
        this.prisma.like.findUnique({
          where: {
            userId_entityType_entityId: {
              userId,
              entityType: EntityType.REQUEST,
              entityId: id,
            },
          },
        }),
        this.prisma.favorite.findUnique({
          where: {
            userId_entityType_entityId: {
              userId,
              entityType: EntityType.REQUEST,
              entityId: id,
            },
          },
        }),
      ]);

      return {
        ...request,
        isLiked: !!like,
        isFavorited: !!favorite,
      };
    }

    return request;
  }

  async updateRequest(userId: number, id: number, dto: UpdateRequestDto) {
    // 先检查需求是否存在
    const request = await this.prisma.request.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!request) {
      throw new NotFoundException('需求不存在');
    }

    // 检查权限
    if (request.userId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user || user.role !== Role.ADMIN) {
        throw new ForbiddenException('没有权限更新此需求');
      }
    }

    // 如果更新分类，需要验证分类是否存在
    if (dto.categoryId) {
      const category = await this.prisma.requestCategory.findUnique({
        where: { id: dto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('分类不存在');
      }
    }

    return this.prisma.request.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        categoryId: dto.categoryId,
        priority: dto.priority,
        status: dto.status,
        budget: dto.budget,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        category: true,
      },
    });
  }

  async deleteRequest(userId: number, id: number) {
    // 先检查需求是否存在
    const request = await this.prisma.request.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!request) {
      throw new NotFoundException('需求不存在');
    }

    // 检查权限
    if (request.userId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user || user.role !== Role.ADMIN) {
        throw new ForbiddenException('没有权限删除此需求');
      }
    }

    // 删除所有相关的点赞、收藏、评论和响应
    await this.prisma.$transaction([
      this.prisma.like.deleteMany({
        where: {
          entityType: EntityType.REQUEST,
          entityId: id,
        },
      }),
      this.prisma.favorite.deleteMany({
        where: {
          entityType: EntityType.REQUEST,
          entityId: id,
        },
      }),
      this.prisma.comment.deleteMany({
        where: {
          entityType: EntityType.REQUEST,
          entityId: id,
        },
      }),
      this.prisma.requestResponse.deleteMany({
        where: {
          requestId: id,
        },
      }),
      this.prisma.request.delete({
        where: { id },
      }),
    ]);

    return { success: true };
  }

  async findUserRequests(userId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      this.prisma.request.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          _count: {
            select: {
              responses: true,
            },
          },
        },
      }),
      this.prisma.request.count({ where: { userId } }),
    ]);

    return {
      requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async likeRequest(userId: number, requestId: number) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('需求不存在');
    }

    // 检查用户是否已经点赞过
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_entityType_entityId: {
          userId,
          entityType: EntityType.REQUEST,
          entityId: requestId,
        },
      },
    });

    // 如果已点赞，则取消点赞
    if (existingLike) {
      await this.prisma.$transaction([
        this.prisma.like.delete({
          where: {
            id: existingLike.id,
          },
        }),
        this.prisma.request.update({
          where: { id: requestId },
          data: {
            likesCount: {
              decrement: 1,
            },
          },
        }),
      ]);

      return { liked: false };
    }

    // 否则添加点赞
    await this.prisma.$transaction([
      this.prisma.like.create({
        data: {
          userId,
          entityType: EntityType.REQUEST,
          entityId: requestId,
        },
      }),
      this.prisma.request.update({
        where: { id: requestId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return { liked: true };
  }

  async favoriteRequest(userId: number, requestId: number) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('需求不存在');
    }

    // 检查用户是否已经收藏过
    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_entityType_entityId: {
          userId,
          entityType: EntityType.REQUEST,
          entityId: requestId,
        },
      },
    });

    // 如果已收藏，则取消收藏
    if (existingFavorite) {
      await this.prisma.$transaction([
        this.prisma.favorite.delete({
          where: {
            id: existingFavorite.id,
          },
        }),
        this.prisma.request.update({
          where: { id: requestId },
          data: {
            favoritesCount: {
              decrement: 1,
            },
          },
        }),
      ]);

      return { favorited: false };
    }

    // 否则添加收藏
    await this.prisma.$transaction([
      this.prisma.favorite.create({
        data: {
          userId,
          entityType: EntityType.REQUEST,
          entityId: requestId,
        },
      }),
      this.prisma.request.update({
        where: { id: requestId },
        data: {
          favoritesCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return { favorited: true };
  }

  async createResponse(userId: number, requestId: number, dto: CreateResponseDto) {
    // 验证需求是否存在
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('需求不存在');
    }

    // 需求创建者不能回复自己的需求
    if (request.userId === userId) {
      throw new BadRequestException('不能回复自己的需求');
    }

    // 创建响应
    const response = await this.prisma.requestResponse.create({
      data: {
        requestId,
        userId,
        content: dto.content,
        price: dto.price,
        isPublic: dto.isPublic ?? false,
      },
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

    // 更新需求的响应数量
    await this.prisma.request.update({
      where: { id: requestId },
      data: {
        responseCount: {
          increment: 1,
        },
      },
    });

    return response;
  }

  async findResponseById(userId: number, id: number) {
    const response = await this.prisma.requestResponse.findUnique({
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
        request: {
          select: {
            id: true,
            title: true,
            userId: true,
          },
        },
      },
    });

    if (!response) {
      throw new NotFoundException('响应不存在');
    }

    // 检查权限
    if (!response.isPublic && 
        response.userId !== userId && 
        response.request.userId !== userId) {
      throw new ForbiddenException('没有权限查看此响应');
    }

    return response;
  }

  async updateResponseStatus(
    userId: number, 
    responseId: number, 
    status: ResponseStatus
  ) {
    // 验证响应是否存在
    const response = await this.prisma.requestResponse.findUnique({
      where: { id: responseId },
      include: {
        request: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!response) {
      throw new NotFoundException('响应不存在');
    }

    // 检查权限，只有需求创建者可以更新响应状态
    if (response.request.userId !== userId) {
      throw new ForbiddenException('没有权限更新此响应状态');
    }

    // 更新响应状态
    const updatedResponse = await this.prisma.requestResponse.update({
      where: { id: responseId },
      data: { status },
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

    // 如果状态是已接受，更新需求状态为进行中
    if (status === ResponseStatus.ACCEPTED) {
      await this.prisma.request.update({
        where: { id: response.request.id },
        data: {
          status: RequestStatus.IN_PROGRESS,
        },
      });
    }

    return updatedResponse;
  }

  async findUserResponses(userId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [responses, total] = await Promise.all([
      this.prisma.requestResponse.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          request: {
            select: {
              id: true,
              title: true,
              status: true,
              user: {
                select: {
                  id: true,
                  nickname: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.requestResponse.count({ where: { userId } }),
    ]);

    return {
      responses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
} 