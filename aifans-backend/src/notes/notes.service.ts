import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto, UpdateNoteDto } from './dto';
import { EntityType, NoteStatus, Role, User } from '../types';
import { CreatorsService } from '../creators/creators.service';
import { SensitiveWordsCheckService } from '../common/services/sensitive-words.service';

@Injectable()
export class NotesService {
  constructor(
    private prisma: PrismaService,
    private creatorsService: CreatorsService,
    private sensitiveWordsCheckService: SensitiveWordsCheckService,
  ) {}

  async create(createNoteDto: CreateNoteDto, user: User) {
    // 检查分类是否存在
    const category = await this.prisma.noteCategory.findUnique({
      where: { id: createNoteDto.categoryId },
    });

    if (!category) {
      throw new BadRequestException(`ID为${createNoteDto.categoryId}的分类不存在`);
    }

    // 敏感词检测
    const textsToCheck: string[] = [createNoteDto.title];
    
    // 提取内容中的文本进行检测
    if (createNoteDto.content) {
      if (typeof createNoteDto.content === 'string') {
        textsToCheck.push(createNoteDto.content);
      } else if (typeof createNoteDto.content === 'object') {
        // 如果是JSON对象，尝试提取文本内容
        const contentStr = JSON.stringify(createNoteDto.content);
        textsToCheck.push(contentStr);
      }
    }

    const sensitiveCheck = await this.sensitiveWordsCheckService.checkMultipleTexts(textsToCheck);
    if (sensitiveCheck.isSensitive) {
      throw new BadRequestException(`内容包含敏感词：${sensitiveCheck.matchedWords.join(', ')}`);
    }

    const note = await this.prisma.note.create({
      data: {
        userId: user.id,
        title: createNoteDto.title,
        content: createNoteDto.content,
        coverImageUrl: createNoteDto.coverImageUrl,
        categoryId: createNoteDto.categoryId,
        status: createNoteDto.status || NoteStatus.VISIBLE,
      },
      include: {
        user: {
          select: { id: true, username: true, nickname: true, avatarUrl: true }
        },
        category: true,
      },
    });

    // 异步更新创作者积分
    this.creatorsService.onNoteCreated(user.id).catch(error => {
      console.error('更新创作者积分失败:', error);
    });

    return note;
  }

  async findAll(
    userId?: number, 
    categoryId?: number, 
    query?: string, 
    page: number = 1, 
    limit: number = 10,
    includeHidden: boolean = false,
    orderBy: string = 'latest',
    timeRange?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {
      status: includeHidden 
        ? { in: [NoteStatus.VISIBLE, NoteStatus.HIDDEN_BY_ADMIN] } 
        : NoteStatus.VISIBLE,
    };

    if (userId) {
      where.userId = userId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // 高级搜索功能：支持标题、正文内容和作者名搜索
    if (query) {
      where.OR = [
        { title: { contains: query } },
        { content: { 
            // 假设content是JSON格式，这里需要根据实际情况调整
            path: ['text'],
            string_contains: query 
          } 
        },
        { user: { nickname: { contains: query } } },
        { user: { username: { contains: query } } },
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
      case 'favorites':
        orderByClause = { favoritesCount: 'desc' };
        break;
      case 'oldest':
        orderByClause = { createdAt: 'asc' };
        break;
      case 'latest':
      default:
        orderByClause = { createdAt: 'desc' };
        break;
    }

    const [notes, total] = await Promise.all([
      this.prisma.note.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderByClause,
        include: {
          user: {
            select: { id: true, username: true, nickname: true, avatarUrl: true }
          },
          category: true,
        },
      }),
      this.prisma.note.count({ where }),
    ]);

    return {
      notes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, incrementViews: boolean = false, currentUserId?: number) {
    const note = await this.prisma.note.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, nickname: true, avatarUrl: true }
        },
        category: true,
      },
    });

    if (!note || note.status === NoteStatus.ADMIN_DELETED) {
      throw new NotFoundException(`ID为${id}的笔记不存在`);
    }

    // 增加浏览量
    if (incrementViews) {
      await this.prisma.note.update({
        where: { id },
        data: { viewsCount: { increment: 1 } },
      });
    }

    // 如果提供了当前用户ID，检查点赞和收藏状态
    let isLiked = false;
    let isFavorited = false;
    
    if (currentUserId) {
      const [like, favorite] = await Promise.all([
        this.prisma.like.findFirst({
          where: {
            userId: currentUserId,
            entityType: EntityType.NOTE,
            entityId: id,
          },
        }),
        this.prisma.favorite.findFirst({
          where: {
            userId: currentUserId,
            entityType: EntityType.NOTE,
            entityId: id,
          },
        }),
      ]);
      
      isLiked = !!like;
      isFavorited = !!favorite;
    }

    return {
      ...note,
      isLiked,
      isFavorited,
    };
  }

  async update(id: number, updateNoteDto: UpdateNoteDto, user: User) {
    const note = await this.prisma.note.findUnique({ where: { id } });

    if (!note || note.status === NoteStatus.ADMIN_DELETED) {
      throw new NotFoundException(`ID为${id}的笔记不存在`);
    }

    // 检查用户权限 - 只有笔记作者或管理员可以更新
    if (note.userId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('您没有权限更新此笔记');
    }

    // 如果更改分类，检查分类是否存在
    if (updateNoteDto.categoryId) {
      const category = await this.prisma.noteCategory.findUnique({
        where: { id: updateNoteDto.categoryId },
      });

      if (!category) {
        throw new BadRequestException(`ID为${updateNoteDto.categoryId}的分类不存在`);
      }
    }

    // 敏感词检测（只检测有更新的字段）
    const textsToCheck: string[] = [];
    if (updateNoteDto.title) textsToCheck.push(updateNoteDto.title);
    
    if (updateNoteDto.content) {
      if (typeof updateNoteDto.content === 'string') {
        textsToCheck.push(updateNoteDto.content);
      } else if (typeof updateNoteDto.content === 'object') {
        const contentStr = JSON.stringify(updateNoteDto.content);
        textsToCheck.push(contentStr);
      }
    }

    if (textsToCheck.length > 0) {
      const sensitiveCheck = await this.sensitiveWordsCheckService.checkMultipleTexts(textsToCheck);
      if (sensitiveCheck.isSensitive) {
        throw new BadRequestException(`内容包含敏感词：${sensitiveCheck.matchedWords.join(', ')}`);
      }
    }

    return this.prisma.note.update({
      where: { id },
      data: updateNoteDto,
      include: {
        user: {
          select: { id: true, username: true, nickname: true, avatarUrl: true }
        },
        category: true,
      },
    });
  }

  async remove(id: number, user: User) {
    const note = await this.prisma.note.findUnique({ where: { id } });

    if (!note || note.status === NoteStatus.ADMIN_DELETED) {
      throw new NotFoundException(`ID为${id}的笔记不存在`);
    }

    // 检查用户权限 - 只有笔记作者或管理员可以删除
    if (note.userId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('您没有权限删除此笔记');
    }

    let result;
    // 对于普通用户，只标记为删除
    if (user.role !== Role.ADMIN) {
      result = await this.prisma.note.update({
        where: { id },
        data: { status: NoteStatus.HIDDEN_BY_ADMIN },
      });
    } else {
      // 管理员可以彻底删除
      result = await this.prisma.note.update({
        where: { id },
        data: { status: NoteStatus.ADMIN_DELETED },
      });
    }

    // 异步更新创作者积分（删除笔记会减少积分）
    this.creatorsService.onNoteDeleted(note.userId).catch(error => {
      console.error('更新创作者积分失败:', error);
    });

    return result;
  }

  async toggleLike(noteId: number, userId: number) {
    // 检查笔记是否存在
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note || note.status === NoteStatus.ADMIN_DELETED) {
      throw new NotFoundException(`ID为${noteId}的笔记不存在`);
    }

    // 查找是否已点赞
    const existingLike = await this.prisma.like.findFirst({
      where: {
        userId,
        entityType: EntityType.NOTE,
        entityId: noteId,
      },
    });

    let result;
    if (existingLike) {
      // 取消点赞
      await this.prisma.like.delete({ where: { id: existingLike.id } });
      await this.prisma.note.update({
        where: { id: noteId },
        data: { likesCount: { decrement: 1 } },
      });
      result = { liked: false };
    } else {
      // 添加点赞
      await this.prisma.like.create({
        data: {
          userId,
          entityType: EntityType.NOTE,
          entityId: noteId,
        },
      });
      await this.prisma.note.update({
        where: { id: noteId },
        data: { likesCount: { increment: 1 } },
      });
      result = { liked: true };
    }

    // 异步更新笔记作者的创作者积分
    this.creatorsService.onNoteInteraction(note.userId).catch(error => {
      console.error('更新创作者积分失败:', error);
    });

    return result;
  }

  async toggleFavorite(noteId: number, userId: number) {
    // 检查笔记是否存在
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note || note.status === NoteStatus.ADMIN_DELETED) {
      throw new NotFoundException(`ID为${noteId}的笔记不存在`);
    }

    // 查找是否已收藏
    const existingFavorite = await this.prisma.favorite.findFirst({
      where: {
        userId,
        entityType: EntityType.NOTE,
        entityId: noteId,
      },
    });

    let result;
    if (existingFavorite) {
      // 取消收藏
      await this.prisma.favorite.delete({ where: { id: existingFavorite.id } });
      await this.prisma.note.update({
        where: { id: noteId },
        data: { favoritesCount: { decrement: 1 } },
      });
      result = { favorited: false };
    } else {
      // 添加收藏
      await this.prisma.favorite.create({
        data: {
          userId,
          entityType: EntityType.NOTE,
          entityId: noteId,
        },
      });
      await this.prisma.note.update({
        where: { id: noteId },
        data: { favoritesCount: { increment: 1 } },
      });
      result = { favorited: true };
    }

    // 异步更新笔记作者的创作者积分
    this.creatorsService.onNoteInteraction(note.userId).catch(error => {
      console.error('更新创作者积分失败:', error);
    });

    return result;
  }

  async getUserLikedNotes(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    // 查找用户点赞的所有笔记ID
    const likes = await this.prisma.like.findMany({
      where: {
        userId,
        entityType: EntityType.NOTE,
      },
      select: { entityId: true },
    });
    
    const noteIds = likes.map(like => like.entityId);
    
    // 如果没有点赞的笔记，返回空结果
    if (noteIds.length === 0) {
      return {
        notes: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }
    
    const [notes, total] = await Promise.all([
      this.prisma.note.findMany({
        where: {
          id: { in: noteIds },
          status: NoteStatus.VISIBLE,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, nickname: true, avatarUrl: true }
          },
          category: true,
        },
      }),
      this.prisma.note.count({
        where: {
          id: { in: noteIds },
          status: NoteStatus.VISIBLE,
        },
      }),
    ]);
    
    return {
      notes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserFavoritedNotes(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    // 查找用户收藏的所有笔记ID
    const favorites = await this.prisma.favorite.findMany({
      where: {
        userId,
        entityType: EntityType.NOTE,
      },
      select: { entityId: true },
    });
    
    const noteIds = favorites.map(fav => fav.entityId);
    
    // 如果没有收藏的笔记，返回空结果
    if (noteIds.length === 0) {
      return {
        notes: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }
    
    const [notes, total] = await Promise.all([
      this.prisma.note.findMany({
        where: {
          id: { in: noteIds },
          status: NoteStatus.VISIBLE,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, nickname: true, avatarUrl: true }
          },
          category: true,
        },
      }),
      this.prisma.note.count({
        where: {
          id: { in: noteIds },
          status: NoteStatus.VISIBLE,
        },
      }),
    ]);
    
    return {
      notes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
} 