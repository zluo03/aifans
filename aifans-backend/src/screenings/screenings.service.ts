import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScreeningDto } from './dto/create-screening.dto';
import { AddScreeningCommentDto } from './dto/add-screening-comment.dto';
import { Prisma } from '@prisma/client';
import { Role, EntityType } from '../types/prisma-enums';
import { SensitiveWordsCheckService } from '../common/services/sensitive-words.service';

@Injectable()
export class ScreeningsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sensitiveWordsCheckService: SensitiveWordsCheckService,
  ) {}

  async createScreening(adminUserId: number, dto: CreateScreeningDto, videoUrl: string, thumbnailUrl?: string) {
    // 验证用户是否为管理员
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
    });

    if (!admin || admin.role !== Role.ADMIN) {
      throw new ForbiddenException('只有管理员可以上传放映视频');
    }

    // 如果指定了创作者ID，验证创作者是否存在
    if (dto.creatorId) {
      const creator = await this.prisma.user.findUnique({
        where: { id: dto.creatorId },
      });

      if (!creator) {
        throw new BadRequestException('指定的创作者不存在');
      }
    }

    // 敏感词检测
    const textsToCheck: string[] = [dto.title];
    if (dto.description) textsToCheck.push(dto.description);

    const sensitiveCheck = await this.sensitiveWordsCheckService.checkMultipleTexts(textsToCheck);
    if (sensitiveCheck.isSensitive) {
      throw new BadRequestException(`内容包含敏感词：${sensitiveCheck.matchedWords.join(', ')}`);
    }

    return this.prisma.screening.create({
      data: {
        adminUploaderId: adminUserId,
        creatorId: dto.creatorId,
        title: dto.title,
        description: dto.description,
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl,
      },
      include: {
        adminUploader: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findAllScreenings(page = 1, limit = 10, search?: string, orderBy: string = 'latest', timeRange?: string) {
    const skip = (page - 1) * limit;
    
    // 构建查询条件
    const where: any = {};
    
    // 搜索条件
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { adminUploader: { nickname: { contains: search } } },
        { adminUploader: { username: { contains: search } } },
      ];
    }
    
    // 时间范围过滤
    if (timeRange) {
      const now = new Date();
      let startDate: Date | null = null;
      
      switch (timeRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
      }
      
      if (startDate) {
        where.createdAt = { gte: startDate };
      }
    }
    
    // 排序处理
    let orderByClause: any;
    switch (orderBy) {
      case 'popular':
        orderByClause = { likesCount: 'desc' };
        break;
      case 'views':
        orderByClause = { viewsCount: 'desc' };
        break;
      case 'oldest':
        orderByClause = { createdAt: 'asc' };
        break;
      case 'latest':
      default:
        orderByClause = { createdAt: 'desc' };
        break;
    }
    
    const [screenings, total] = await Promise.all([
      this.prisma.screening.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderByClause,
        include: {
          adminUploader: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatarUrl: true,
            },
          },
          creator: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.screening.count({ where }),
    ]);

    return {
      screenings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findScreeningById(id: number, userId?: number) {
    const screening = await this.prisma.screening.findUnique({
      where: { id },
      include: {
        adminUploader: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!screening) {
      throw new NotFoundException('放映视频不存在');
    }

    // 增加浏览量
    await this.prisma.screening.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });

    // 如果提供了用户ID，检查用户是否点赞过
    if (userId) {
      const userLike = await this.prisma.like.findUnique({
        where: {
          userId_entityType_entityId: {
            userId,
            entityType: EntityType.SCREENING,
            entityId: id,
          },
        },
      });

      return {
        ...screening,
        isLiked: !!userLike,
      };
    }

    return screening;
  }

  async findOneScreening(id: number) {
    const screening = await this.prisma.screening.findUnique({
      where: { id },
      include: {
        adminUploader: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!screening) {
      throw new NotFoundException('放映视频不存在');
    }

    return screening;
  }

  async updateScreening(adminUserId: number, id: number, dto: Partial<CreateScreeningDto>, videoUrl?: string, thumbnailUrl?: string) {
    // 验证用户是否为管理员
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
    });

    if (!admin || admin.role !== Role.ADMIN) {
      throw new ForbiddenException('只有管理员可以更新放映视频');
    }

    const screening = await this.prisma.screening.findUnique({
      where: { id },
    });

    if (!screening) {
      throw new NotFoundException('放映视频不存在');
    }

    const updateData: any = {};
    
    if (dto.title) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (videoUrl) updateData.videoUrl = videoUrl;
    if (thumbnailUrl) updateData.thumbnailUrl = thumbnailUrl;

    return this.prisma.screening.update({
      where: { id },
      data: updateData,
      include: {
        adminUploader: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async deleteScreening(adminUserId: number, id: number) {
    // 验证用户是否为管理员
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
    });

    if (!admin || admin.role !== Role.ADMIN) {
      throw new ForbiddenException('只有管理员可以删除放映视频');
    }

    const screening = await this.prisma.screening.findUnique({
      where: { id },
    });

    if (!screening) {
      throw new NotFoundException('放映视频不存在');
    }

    // 删除所有相关的点赞、收藏和评论
    await this.prisma.$transaction([
      this.prisma.like.deleteMany({
        where: {
          entityType: EntityType.SCREENING,
          entityId: id,
        },
      }),
      this.prisma.favorite.deleteMany({
        where: {
          entityType: EntityType.SCREENING,
          entityId: id,
        },
      }),
      this.prisma.comment.deleteMany({
        where: {
          entityType: EntityType.SCREENING,
          entityId: id,
        },
      }),
      this.prisma.screening.delete({
        where: { id },
      }),
    ]);

    return { success: true };
  }

  async addCommentToScreening(userId: number, screeningId: number, dto: AddScreeningCommentDto) {
    const screening = await this.prisma.screening.findUnique({
      where: { id: screeningId },
    });

    if (!screening) {
      throw new NotFoundException('放映视频不存在');
    }

    // 敏感词检测
    const sensitiveCheck = await this.sensitiveWordsCheckService.checkSensitiveWords(dto.content);
    if (sensitiveCheck.isSensitive) {
      throw new BadRequestException(`评论包含敏感词：${sensitiveCheck.matchedWords.join(', ')}`);
    }

    return this.prisma.comment.create({
      data: {
        userId,
        entityType: EntityType.SCREENING,
        entityId: screeningId,
        content: dto.content,
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
  }

  async getCommentsForScreening(screeningId: number) {
    const screening = await this.prisma.screening.findUnique({
      where: { id: screeningId },
    });

    if (!screening) {
      throw new NotFoundException('放映视频不存在');
    }

    return this.prisma.comment.findMany({
      where: {
        entityType: EntityType.SCREENING,
        entityId: screeningId,
      },
      orderBy: { createdAt: 'asc' },
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
  }

  async likeScreening(userId: number, screeningId: number) {
    const screening = await this.prisma.screening.findUnique({
      where: { id: screeningId },
    });

    if (!screening) {
      throw new NotFoundException('放映视频不存在');
    }

    // 检查用户是否已经点赞过
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_entityType_entityId: {
          userId,
          entityType: EntityType.SCREENING,
          entityId: screeningId,
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
        this.prisma.screening.update({
          where: { id: screeningId },
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
          entityType: EntityType.SCREENING,
          entityId: screeningId,
        },
      }),
      this.prisma.screening.update({
        where: { id: screeningId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return { liked: true };
  }
}
