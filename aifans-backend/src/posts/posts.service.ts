import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, PostQueryDto, UpdatePostDto } from './dto';
import { EntityType, PostType, Role } from '../types/prisma-enums';
import { Post } from '.prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { CreatorsService } from '../creators/creators.service';
import { SensitiveWordsCheckService } from '../common/services/sensitive-words.service';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private creatorsService: CreatorsService,
    private sensitiveWordsCheckService: SensitiveWordsCheckService,
  ) {}

  async createPost(
    userId: number, 
    createPostDto: CreatePostDto, 
    file: Express.Multer.File
  ): Promise<Post> {
    // 确保aiPlatformId是数字类型
    const aiPlatformId = typeof createPostDto.aiPlatformId === 'string' 
      ? parseInt(createPostDto.aiPlatformId, 10) 
      : createPostDto.aiPlatformId;

    // 检查AI平台是否存在
    const aiPlatform = await this.prisma.aIPlatform.findUnique({
      where: { id: aiPlatformId },
    });

    if (!aiPlatform) {
      throw new BadRequestException(`ID为${aiPlatformId}的AI平台不存在`);
    }

    // 检查文件类型与选择的作品类型是否匹配
    const isImageFile = file.mimetype.startsWith('image/');
    const isVideoFile = file.mimetype.startsWith('video/');
    
    if (createPostDto.type === 'IMAGE' && !isImageFile) {
      throw new BadRequestException('作品类型为图片，但上传的不是图片文件');
    }
    
    if (createPostDto.type === 'VIDEO' && !isVideoFile) {
      throw new BadRequestException('作品类型为视频，但上传的不是视频文件');
    }

    // 视频类别检查
    if (createPostDto.type === 'VIDEO' && !createPostDto.videoCategory) {
      throw new BadRequestException('视频作品必须选择视频类别');
    }

    // 如果是图片，视频类别应为空
    if (createPostDto.type === 'IMAGE' && createPostDto.videoCategory) {
      throw new BadRequestException('图片作品不应设置视频类别');
    }

    // 敏感词检测
    const textsToCheck: string[] = [createPostDto.prompt];
    if (createPostDto.title) textsToCheck.push(createPostDto.title);

    const sensitiveCheck = await this.sensitiveWordsCheckService.checkMultipleTexts(textsToCheck);
    if (sensitiveCheck.isSensitive) {
      throw new BadRequestException(`内容包含敏感词：${sensitiveCheck.matchedWords.join(', ')}`);
    }

    // 构建文件URL
    // 统一使用正斜杠，确保跨平台兼容性
    const normalizedPath = file.path.split('\\').join('/');
    
    // 从文件路径中提取相对路径（与服务器配置对应的目录）
    // 注意：文件保存在uploads/posts目录，URL应该是/uploads/posts/文件名
    let relativePath = '';
    
    if (normalizedPath.includes('/uploads/')) {
      // 如果路径包含/uploads/，直接提取
      relativePath = normalizedPath.split('/uploads/')[1];
    } else {
      // 否则，尝试找到posts/部分
      relativePath = normalizedPath.includes('/posts/') 
        ? `posts/${normalizedPath.split('/posts/')[1]}`
        : path.basename(normalizedPath); // 最后回退到仅使用文件名
    }
    
    // 使用正确的URL前缀格式
    const fileUrl = `/uploads/${relativePath}`;
    
    console.log('文件上传成功:', {
      originalPath: file.path,
      normalizedPath,
      relativePath,
      fileUrl
    });
    
    // 创建Post记录
    const post = await this.prisma.post.create({
      data: {
        userId,
        type: createPostDto.type,
        title: createPostDto.title,
        fileUrl,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        aiPlatformId: aiPlatformId,
        modelUsed: createPostDto.modelUsed,
        prompt: createPostDto.prompt,
        videoCategory: createPostDto.videoCategory,
        allowDownload: true,
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

    // 异步更新创作者积分
    this.creatorsService.onPostCreated(userId).catch(error => {
      console.error('更新创作者积分失败:', error);
    });

    return post;
  }

  async findAllPosts(query: PostQueryDto, currentUserId?: number) {
    const { page = 1, limit = 20, type, aiPlatformId, aiPlatformIds, search, userId, order, onlyFavorites, onlyMyPosts } = query;
    const skip = (page - 1) * limit;
    
    console.log('PostsService.findAllPosts 接收到的参数:', {
      query,
      currentUserId,
      onlyFavorites,
      onlyMyPosts,
      aiPlatformIds,
      aiPlatformId
    });
    
    // 构建查询条件
    const where: any = {
      status: 'VISIBLE',
    };
    
    console.log('初始查询条件:', where);
    
    // 类型过滤
    if (type) {
      where.type = type;
      console.log('添加类型过滤:', { type });
    }
    
    // AI平台过滤 - 支持单个ID或多个ID
    if (aiPlatformIds && aiPlatformIds.length > 0) {
      // 多平台ID查询（OR查询）
      where.aiPlatformId = { in: aiPlatformIds };
      console.log('添加多平台过滤:', { aiPlatformIds });
    } else if (aiPlatformId) {
      // 单个平台ID查询（兼容旧格式）
      where.aiPlatformId = aiPlatformId;
      console.log('添加单平台过滤:', { aiPlatformId });
    }
    
    // 用户过滤
    if (userId) {
      where.userId = parseInt(userId.toString());
      console.log('添加用户过滤:', { userId: where.userId });
    }
    
    // 仅显示我的作品过滤
    if (onlyMyPosts && currentUserId) {
      where.userId = currentUserId;
      console.log('启用我的作品过滤:', { currentUserId, whereUserId: where.userId });
    }
    
    // 收藏过滤 - 只显示当前用户收藏的作品
    if (onlyFavorites && currentUserId) {
      console.log('启用收藏过滤:', { currentUserId });
      // 获取用户收藏的所有作品ID
      const favoriteRecords = await this.prisma.favorite.findMany({
        where: {
          userId: currentUserId,
          entityType: 'POST',
        },
        select: { entityId: true },
      });
      
      const favoritePostIds = favoriteRecords.map(fav => fav.entityId);
      console.log('用户收藏的作品ID列表:', favoritePostIds);
      
      // 如果用户没有收藏任何作品，返回空结果
      if (favoritePostIds.length === 0) {
        console.log('用户没有收藏任何作品，返回空结果');
        return {
          data: [],
          meta: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      }
      
      // 添加ID过滤条件，只查询用户收藏的作品
      where.id = { in: favoritePostIds };
      console.log('设置收藏过滤条件:', { favoritePostIds });
    }
    
    // 关键词搜索增强
    if (search) {
      where.OR = [
        { prompt: { contains: search } },
        { description: { contains: search } },
        { tags: { has: search } }, // 假设tags是数组类型
        { user: { nickname: { contains: search } } },
        { user: { username: { contains: search } } },
        { aiPlatform: { name: { contains: search } } },
      ];
      console.log('添加搜索过滤:', { search });
    }
    
    console.log('最终查询条件:', where);
    
    // 排序方式
    let orderBy: any = { createdAt: 'desc' };
    console.log('🔄 处理排序参数:', { order, 收到的order值: order });
    if (order) {
      switch (order) {
        case 'popular':
          orderBy = { likesCount: 'desc' };
          console.log('📊 使用人气排序');
          break;
        case 'views':
          orderBy = { viewsCount: 'desc' };
          console.log('👀 使用浏览量排序');
          break;
        case 'favorites':
          orderBy = { favoritesCount: 'desc' };
          console.log('⭐ 使用收藏数排序');
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          console.log('🆕 使用最新排序');
          break;
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          console.log('🕰️ 使用最早排序');
          break;
        default:
          console.log('❓ 未知排序方式，使用默认排序:', order);
      }
    } else {
      console.log('🆕 未指定排序方式，使用默认排序');
    }
    
    // 查询总数
    const total = await this.prisma.post.count({ where });
    console.log('查询到的总记录数:', total);
    
    // 查询数据 - 使用select优化性能，只获取必要字段
    const posts = await this.prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        type: true,
        title: true,
        fileUrl: true,
        thumbnailUrl: true,
        prompt: true,
        modelUsed: true,
        likesCount: true,
        favoritesCount: true,
        viewsCount: true,
        allowDownload: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        videoCategory: true,
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
          },
        },
      },
    });
    
    console.log('查询到的帖子数量:', posts.length);
    console.log('帖子列表:', posts.map(post => ({
      id: post.id,
      type: post.type,
      status: post.status,
      userId: post.userId,
      aiPlatformId: post.aiPlatform.id
    })));

    // 优化用户状态查询 - 只在有用户且帖子数量不为空时执行
    let postsWithUserStatus = posts;
    if (currentUserId && posts.length > 0) {
      const postIds = posts.map(post => post.id);
      
      // 并行查询并直接转换为Set，减少内存操作
      const [likedPostIds, favoritedPostIds] = await Promise.all([
        this.prisma.like.findMany({
          where: {
            userId: currentUserId,
            entityType: 'POST',
            entityId: { in: postIds },
          },
          select: { entityId: true },
        }).then(likes => new Set(likes.map(like => like.entityId))),
        
        this.prisma.favorite.findMany({
          where: {
            userId: currentUserId,
            entityType: 'POST',
            entityId: { in: postIds },
          },
          select: { entityId: true },
        }).then(favorites => new Set(favorites.map(fav => fav.entityId))),
      ]);
      
      // 一次性映射，避免多次循环
      postsWithUserStatus = posts.map(post => ({
        ...post,
        hasLiked: likedPostIds.has(post.id),
        hasFavorited: favoritedPostIds.has(post.id),
      }));
      
      console.log('添加用户状态后的帖子数量:', postsWithUserStatus.length);
    } else {
      // 未登录用户或无帖子时，直接添加默认状态，避免map操作
      postsWithUserStatus = posts.length > 0 ? posts.map(post => ({
        ...post,
        hasLiked: false,
        hasFavorited: false,
      })) : [];
      
      console.log('未添加用户状态的帖子数量:', postsWithUserStatus.length);
    }
    
    return {
      data: postsWithUserStatus,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPostById(id: number, userId?: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
            role: true,
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
    
    if (!post || post.status !== 'VISIBLE') {
      throw new NotFoundException(`ID为${id}的作品不存在`);
    }
    
    // 增加浏览量
    await this.prisma.post.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });
    
    // 检查登录用户是否已经点赞和收藏
    let hasLiked = false;
    let hasFavorited = false;
    
    if (userId) {
      const likeRecord = await this.prisma.like.findFirst({
        where: {
          userId,
          entityType: 'POST',
          entityId: id,
        },
      });
      
      const favoriteRecord = await this.prisma.favorite.findFirst({
        where: {
          userId,
          entityType: 'POST',
          entityId: id,
        },
      });
      
      hasLiked = !!likeRecord;
      hasFavorited = !!favoriteRecord;
    }
    
    // 更新返回数据的浏览量
    post.viewsCount += 1;
    
    return {
      ...post,
      hasLiked,
      hasFavorited,
    };
  }

  async updatePost(userId: number | any, postId: number, updatePostDto: UpdatePostDto) {
    // 确保userId是数字类型
    const userIdValue = typeof userId === 'object' && userId !== null ? userId.id : userId;
    
    // 检查作品是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: { id: true, role: true },
        },
      },
    });
    
    if (!post) {
      throw new NotFoundException(`ID为${postId}的作品不存在`);
    }
    
    // 检查权限 (只有管理员或作者可以更新)
    const isAdmin = await this.prisma.user.findUnique({
      where: { id: userIdValue },
      select: { role: true },
    }).then(user => user?.role === 'ADMIN');
    
    if (post.userId !== userIdValue && !isAdmin) {
      throw new ForbiddenException('您没有权限更新此作品');
    }
    
    // 如果更新了AI平台，检查平台是否存在
    if (updatePostDto.aiPlatformId) {
      const aiPlatform = await this.prisma.aIPlatform.findUnique({
        where: { id: updatePostDto.aiPlatformId },
      });
      
      if (!aiPlatform) {
        throw new BadRequestException(`ID为${updatePostDto.aiPlatformId}的AI平台不存在`);
      }
    }
    
    // 检查视频类别与作品类型是否匹配
    if (post.type === 'IMAGE' && updatePostDto.videoCategory) {
      throw new BadRequestException('图片作品不应设置视频类别');
    }

    // 敏感词检测（只检测有更新的字段）
    const textsToCheck: string[] = [];
    if (updatePostDto.title) textsToCheck.push(updatePostDto.title);
    if (updatePostDto.prompt) textsToCheck.push(updatePostDto.prompt);

    if (textsToCheck.length > 0) {
      const sensitiveCheck = await this.sensitiveWordsCheckService.checkMultipleTexts(textsToCheck);
      if (sensitiveCheck.isSensitive) {
        throw new BadRequestException(`内容包含敏感词：${sensitiveCheck.matchedWords.join(', ')}`);
      }
    }
    
    // 更新作品
    return this.prisma.post.update({
      where: { id: postId },
      data: updatePostDto,
    });
  }

  async deletePost(userId: number | any, postId: number) {
    // 确保userId是数字类型
    const userIdValue = typeof userId === 'object' && userId !== null ? userId.id : userId;
    
    // 检查作品是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: { id: true, role: true },
        },
      },
    });
    
    if (!post) {
      throw new NotFoundException(`ID为${postId}的作品不存在`);
    }
    
    // 检查权限 (只有管理员或作者可以删除)
    const isAdmin = await this.prisma.user.findUnique({
      where: { id: userIdValue },
      select: { role: true },
    }).then(user => user?.role === 'ADMIN');
    
    if (post.userId !== userIdValue && !isAdmin) {
      throw new ForbiddenException('您没有权限删除此作品');
    }
    
    // 执行软删除 (设置status为ADMIN_DELETED)
    const result = await this.prisma.post.update({
      where: { id: postId },
      data: { status: isAdmin ? 'ADMIN_DELETED' : 'HIDDEN' },
    });

    // 异步更新创作者积分（删除作品会减少积分）
    this.creatorsService.onPostDeleted(post.userId).catch(error => {
      console.error('更新创作者积分失败:', error);
    });

    return result;
  }

  async likePost(userId: number | any, postId: number) {
    try {
      // 确保userId是数字类型
      const userIdValue = typeof userId === 'object' && userId !== null ? userId.id : userId;
      
      // 确保postId是数字类型
      const postIdValue = Number(postId);
      
      if (isNaN(postIdValue) || postIdValue <= 0) {
        throw new BadRequestException(`无效的作品ID: ${postId}`);
      }
      
      // 检查作品是否存在
      const post = await this.prisma.post.findFirst({
        where: { 
          id: postIdValue,
          status: 'VISIBLE'
        },
      });
      
      if (!post) {
        throw new NotFoundException(`ID为${postIdValue}的作品不存在或不可见`);
      }
      
      // 检查是否已经点赞
      const existingLike = await this.prisma.like.findFirst({
        where: {
          userId: userIdValue,
          entityType: 'POST',
          entityId: postIdValue,
        },
      });
      
      let result;
      // 已有点赞，执行取消点赞操作
      if (existingLike) {
        try {
          // 使用事务，同时删除点赞记录并减少点赞计数
          await this.prisma.$transaction([
            this.prisma.like.delete({
              where: { id: existingLike.id },
            }),
            this.prisma.post.update({
              where: { id: postIdValue },
              data: { 
                likesCount: { 
                  // 确保likesCount不会小于0
                  decrement: post.likesCount > 0 ? 1 : 0
                } 
              },
            }),
          ]);
          
          result = { success: true, message: '取消点赞成功', liked: false };
        } catch (error) {
          console.error(`取消点赞失败: userId=${userIdValue}, postId=${postIdValue}`, error);
          throw error;
        }
      } else {
        // 没有已存在的点赞，执行点赞操作
        try {
          // 使用更严格的事务处理，带有明确的错误处理
          await this.prisma.$transaction(async (tx) => {
            // 最终确认帖子仍然存在
            const finalPost = await tx.post.findFirst({
              where: {
                id: postIdValue,
                status: 'VISIBLE'
              }
            });
            
            if (!finalPost) {
              throw new NotFoundException('在创建点赞记录前作品已不存在或状态改变');
            }
            
            // 创建点赞记录并更新计数
            await tx.like.create({
              data: {
                userId: userIdValue,
                entityType: 'POST',
                entityId: postIdValue
              }
            });
            
            await tx.post.update({
              where: { id: postIdValue },
              data: { likesCount: { increment: 1 } }
            });
          });
          
          console.log('点赞成功');
          result = { success: true, message: '点赞成功', liked: true };
        } catch (error) {
          console.error(`创建点赞失败: userId=${userIdValue}, postId=${postIdValue}`, {
            error: error.message,
            code: error.code,
            meta: error.meta
          });
          
          // 针对外键约束错误给出更明确的错误信息
          if (error.code === 'P2003') {
            throw new NotFoundException('要点赞的作品不存在或已被删除');
          }
          
          throw error;
        }
      }

      // 异步更新作品作者的创作者积分
      this.creatorsService.onPostInteraction(post.userId).catch(error => {
        console.error('更新创作者积分失败:', error);
      });

      return result;
    } catch (error) {
      console.error(`点赞操作出错: userId=${userId}, postId=${postId}`, error);
      throw error;
    }
  }

  async favoritePost(userId: number | any, postId: number) {
    try {
      // 确保userId是数字类型
      const userIdValue = typeof userId === 'object' && userId !== null ? userId.id : userId;
      
      // 确保postId是数字类型
      const postIdValue = Number(postId);
      
      if (isNaN(postIdValue) || postIdValue <= 0) {
        throw new BadRequestException(`无效的作品ID: ${postId}`);
      }
      
      // 检查作品是否存在
      const post = await this.prisma.post.findFirst({
        where: { 
          id: postIdValue,
          status: 'VISIBLE'
        },
      });
      
      if (!post) {
        throw new NotFoundException(`ID为${postIdValue}的作品不存在或不可见`);
      }
      
      // 检查是否已经收藏
      const existingFavorite = await this.prisma.favorite.findFirst({
        where: {
          userId,
          entityType: 'POST',
          entityId: postIdValue,
        },
      });
      
      let result;
      // 已有收藏，执行取消收藏操作
      if (existingFavorite) {
        try {
          // 使用事务，同时删除收藏记录并减少收藏计数
          await this.prisma.$transaction([
            this.prisma.favorite.delete({
              where: { id: existingFavorite.id },
            }),
            this.prisma.post.update({
              where: { id: postIdValue },
              data: { 
                favoritesCount: { 
                  // 确保favoritesCount不会小于0
                  decrement: post.favoritesCount > 0 ? 1 : 0
                } 
              },
            }),
          ]);
          
          result = { success: true, message: '取消收藏成功', favorited: false };
        } catch (error) {
          console.error(`取消收藏失败: userId=${userIdValue}, postId=${postIdValue}`, error);
          throw error;
        }
      } else {
        // 没有已存在的收藏，执行收藏操作
        try {
          // 使用更严格的事务处理，带有明确的错误处理
          await this.prisma.$transaction(async (tx) => {
            // 最终确认帖子仍然存在
            const finalPost = await tx.post.findFirst({
              where: {
                id: postIdValue,
                status: 'VISIBLE'
              }
            });
            
            if (!finalPost) {
              throw new NotFoundException('在创建收藏记录前作品已不存在或状态改变');
            }
            
            // 创建收藏记录并更新计数
            await tx.favorite.create({
              data: {
                userId: userIdValue,
                entityType: 'POST',
                entityId: postIdValue
              }
            });
            
            await tx.post.update({
              where: { id: postIdValue },
              data: { favoritesCount: { increment: 1 } }
            });
          });
          
          result = { success: true, message: '收藏成功', favorited: true };
        } catch (error) {
          console.error(`创建收藏失败: userId=${userIdValue}, postId=${postIdValue}`, {
            error: error.message,
            code: error.code,
            meta: error.meta
          });
          
          // 针对外键约束错误给出更明确的错误信息
          if (error.code === 'P2003') {
            throw new NotFoundException('要收藏的作品不存在或已被删除');
          }
          
          throw error;
        }
      }

      // 异步更新作品作者的创作者积分
      this.creatorsService.onPostInteraction(post.userId).catch(error => {
        console.error('更新创作者积分失败:', error);
      });

      return result;
    } catch (error) {
      console.error(`收藏操作出错: userId=${userId}, postId=${postId}`, error);
      throw error;
    }
  }

  async downloadPost(userId: number | any, postId: number): Promise<{ filePath: string; fileName: string; mimeType: string }> {
    // 确保userId是数字类型
    const userIdValue = typeof userId === 'object' && userId !== null ? userId.id : userId;
    
    // 检查作品是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: { role: true },
        },
      },
    });
    
    if (!post || post.status !== 'VISIBLE') {
      throw new NotFoundException(`ID为${postId}的作品不存在`);
    }
    
    // 检查是否允许下载
    if (!post.allowDownload) {
      // 检查用户权限 (作者或管理员可以下载)
      const user = await this.prisma.user.findUnique({
        where: { id: userIdValue },
        select: { role: true },
      });
      
      const isAdmin = user?.role === 'ADMIN';
      const isAuthor = post.userId === userIdValue;
      
      if (!isAdmin && !isAuthor) {
        throw new ForbiddenException('此作品不允许下载');
      }
    }
    
    // 检查文件是否存在
    // 从文件URL提取相对路径
    const relativePath = post.fileUrl.replace('/uploads/', '');
    // 构建绝对路径
    const filePath = path.join(process.cwd(), 'uploads', relativePath);
    
    console.log('下载文件:', {
      originalUrl: post.fileUrl,
      relativePath,
      absolutePath: filePath
    });
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('文件不存在或已被删除');
    }
    
    return {
      filePath,
      fileName: post.originalFilename || 'download',
      mimeType: post.mimeType || 'application/octet-stream',
    };
  }
}
