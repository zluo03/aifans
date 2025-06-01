import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpiritPostDto, UpdateSpiritPostDto, CreateMessageDto, MarkCompletedDto } from './dto';
import { Role, User } from '../types';
import { CreatorsService } from '../creators/creators.service';
import { SensitiveWordsCheckService } from '../common/services/sensitive-words.service';

@Injectable()
export class SpiritPostsService {
  constructor(
    private prisma: PrismaService,
    private creatorsService: CreatorsService,
    private sensitiveWordsCheckService: SensitiveWordsCheckService,
  ) {}

  // 检查用户是否可以发布灵贴
  private canCreatePost(user: User): boolean {
    return user.role === Role.PREMIUM || user.role === Role.LIFETIME || user.role === Role.ADMIN;
  }

  // 检查用户是否可以查看灵贴详情
  private canViewDetail(user: User): boolean {
    return user.role === Role.PREMIUM || user.role === Role.LIFETIME || user.role === Role.ADMIN;
  }

  // 创建灵贴
  async create(createDto: CreateSpiritPostDto, user: User) {
    if (!this.canCreatePost(user)) {
      throw new ForbiddenException('只有高级用户和终身会员可以发布灵贴');
    }

    // 敏感词检测
    const sensitiveCheck = await this.sensitiveWordsCheckService.checkMultipleTexts([
      createDto.title,
      createDto.content
    ]);

    if (sensitiveCheck.isSensitive) {
      throw new BadRequestException(`内容包含敏感词：${sensitiveCheck.matchedWords.join(', ')}`);
    }

    const spiritPost = await this.prisma.spiritPost.create({
      data: {
        userId: user.id,
        title: createDto.title,
        content: createDto.content,
      },
      include: {
        user: {
          select: { id: true, username: true, nickname: true, avatarUrl: true }
        },
      },
    });

    // 异步更新创作者积分
    this.creatorsService.onSpiritPostCreated(user.id).catch(error => {
      console.error('更新创作者积分失败:', error);
    });

    return spiritPost;
  }

  // 获取灵贴列表（不包含已认领和超过1个月的）
  async findAll(user: User) {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // 获取所有已完成的灵贴ID
    const completedClaims = await this.prisma.spiritPostClaim.findMany({
      where: { isCompleted: true },
      select: { postId: true },
      distinct: ['postId'],
    });
    const completedPostIds = completedClaims.map(claim => claim.postId);

    const posts = await this.prisma.spiritPost.findMany({
      where: {
        isHidden: false,
        createdAt: { gte: oneMonthAgo },
        id: { notIn: completedPostIds },
      },
      include: {
        user: {
          select: { id: true, username: true, nickname: true, avatarUrl: true }
        },
        _count: {
          select: { claims: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // 为每个灵贴计算未读消息数
    const postsWithUnreadCount = await Promise.all(
      posts.map(async (post) => {
        // 只有当前用户是发布者或认领者时才计算未读消息数
        const isOwner = post.userId === user.id;
        const claim = await this.prisma.spiritPostClaim.findUnique({
          where: {
            postId_userId: {
              postId: post.id,
              userId: user.id,
            }
          }
        });
        
        let unreadCount = 0;
        if (isOwner || claim) {
          unreadCount = await this.prisma.spiritPostMessage.count({
            where: {
              postId: post.id,
              receiverId: user.id,
              isRead: false,
            },
          });
        }
        
        return {
          ...post,
          unreadCount,
        };
      })
    );

    return postsWithUnreadCount;
  }

  // 获取灵贴详情
  async findOne(id: number, user: User) {
    if (!this.canViewDetail(user)) {
      throw new ForbiddenException('只有高级用户和终身会员可以查看灵贴详情');
    }

    const post = await this.prisma.spiritPost.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, nickname: true, avatarUrl: true }
        },
        claims: {
          include: {
            user: {
              select: { id: true, username: true, nickname: true, avatarUrl: true }
            }
          }
        },
      },
    });

    if (!post) {
      throw new NotFoundException('灵贴不存在');
    }

    // 检查当前用户是否已认领
    const userClaim = await this.prisma.spiritPostClaim.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: user.id,
        }
      }
    });

    return {
      ...post,
      isClaimed: !!userClaim,
      isOwner: post.userId === user.id,
    };
  }

  // 更新灵贴
  async update(id: number, updateDto: UpdateSpiritPostDto, user: User) {
    const post = await this.prisma.spiritPost.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException('灵贴不存在');
    }

    if (post.userId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('只能编辑自己的灵贴');
    }

    // 敏感词检测（只检测有更新的字段）
    const textsToCheck: string[] = [];
    if (updateDto.title) textsToCheck.push(updateDto.title);
    if (updateDto.content) textsToCheck.push(updateDto.content);

    if (textsToCheck.length > 0) {
      const sensitiveCheck = await this.sensitiveWordsCheckService.checkMultipleTexts(textsToCheck);
      if (sensitiveCheck.isSensitive) {
        throw new BadRequestException(`内容包含敏感词：${sensitiveCheck.matchedWords.join(', ')}`);
      }
    }

    const result = await this.prisma.spiritPost.update({
      where: { id },
      data: updateDto,
      include: {
        user: {
          select: { id: true, username: true, nickname: true, avatarUrl: true }
        },
      },
    });

    // 如果更新了隐藏状态，可能影响积分，异步更新
    if (updateDto.isHidden !== undefined) {
      this.creatorsService.onSpiritPostDeleted(post.userId).catch(error => {
        console.error('更新创作者积分失败:', error);
      });
    }

    return result;
  }

  // 认领灵贴
  async claim(postId: number, user: User) {
    if (!this.canViewDetail(user)) {
      throw new ForbiddenException('只有高级用户和终身会员可以认领灵贴');
    }

    const post = await this.prisma.spiritPost.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('灵贴不存在');
    }

    if (post.userId === user.id) {
      throw new BadRequestException('不能认领自己的灵贴');
    }

    // 检查是否已认领
    const existingClaim = await this.prisma.spiritPostClaim.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        }
      }
    });

    if (existingClaim) {
      throw new BadRequestException('您已经认领过这个灵贴');
    }

    return this.prisma.spiritPostClaim.create({
      data: {
        postId,
        userId: user.id,
      },
      include: {
        post: true,
        user: {
          select: { id: true, username: true, nickname: true, avatarUrl: true }
        },
      },
    });
  }

  // 获取消息列表
  async getMessages(postId: number, user: User) {
    const post = await this.prisma.spiritPost.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('灵贴不存在');
    }

    // 如果是发布者，获取所有对话
    if (post.userId === user.id) {
      // 获取所有与认领者的对话，按认领者分组
      const messages = await this.prisma.spiritPostMessage.findMany({
        where: { postId },
        include: {
          sender: {
            select: { id: true, username: true, nickname: true, avatarUrl: true }
          },
          receiver: {
            select: { id: true, username: true, nickname: true, avatarUrl: true }
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      // 按对话分组
      const conversations = new Map<number, any[]>();
      messages.forEach(msg => {
        const otherUserId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
        if (!conversations.has(otherUserId)) {
          conversations.set(otherUserId, []);
        }
        conversations.get(otherUserId)!.push(msg);
      });

      // 获取每个对话的用户信息
      const claimers = await this.prisma.user.findMany({
        where: { id: { in: Array.from(conversations.keys()) } },
        select: { id: true, username: true, nickname: true, avatarUrl: true }
      });

      return {
        isOwner: true,
        conversations: claimers.map(claimer => ({
          user: claimer,
          messages: conversations.get(claimer.id) || [],
          hasConversation: (conversations.get(claimer.id) || []).length >= 2, // 至少有一来一回
        })),
      };
    } else {
      // 如果是认领者，只获取与发布者的对话
      const claim = await this.prisma.spiritPostClaim.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: user.id,
          }
        }
      });

      if (!claim) {
        throw new ForbiddenException('您还没有认领这个灵贴');
      }

      const messages = await this.prisma.spiritPostMessage.findMany({
        where: {
          postId,
          OR: [
            { senderId: user.id, receiverId: post.userId },
            { senderId: post.userId, receiverId: user.id },
          ],
        },
        include: {
          sender: {
            select: { id: true, username: true, nickname: true, avatarUrl: true }
          },
          receiver: {
            select: { id: true, username: true, nickname: true, avatarUrl: true }
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return {
        isOwner: false,
        messages,
      };
    }
  }

  // 发送消息
  async sendMessage(postId: number, createMessageDto: CreateMessageDto, user: User) {
    const post = await this.prisma.spiritPost.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('灵贴不存在');
    }

    let receiverId: number;

    if (post.userId === user.id) {
      // 发布者发送消息，需要指定接收者
      throw new BadRequestException('请使用回复接口回复特定用户');
    } else {
      // 认领者发送消息给发布者
      const claim = await this.prisma.spiritPostClaim.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: user.id,
          }
        }
      });

      if (!claim) {
        throw new ForbiddenException('您还没有认领这个灵贴');
      }

      receiverId = post.userId;
    }

    // 敏感词检测
    const sensitiveCheck = await this.sensitiveWordsCheckService.checkSensitiveWords(createMessageDto.content);
    if (sensitiveCheck.isSensitive) {
      throw new BadRequestException(`消息包含敏感词：${sensitiveCheck.matchedWords.join(', ')}`);
    }

    return this.prisma.spiritPostMessage.create({
      data: {
        postId,
        senderId: user.id,
        receiverId,
        content: createMessageDto.content,
      },
      include: {
        sender: {
          select: { id: true, username: true, nickname: true, avatarUrl: true }
        },
        receiver: {
          select: { id: true, username: true, nickname: true, avatarUrl: true }
        },
      },
    });
  }

  // 回复消息（发布者专用）
  async replyMessage(postId: number, receiverId: number, createMessageDto: CreateMessageDto, user: User) {
    const post = await this.prisma.spiritPost.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('灵贴不存在');
    }

    if (post.userId !== user.id) {
      throw new ForbiddenException('只有发布者可以使用回复功能');
    }

    // 检查接收者是否认领了这个灵贴
    const claim = await this.prisma.spiritPostClaim.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: receiverId,
        }
      }
    });

    if (!claim) {
      throw new BadRequestException('该用户没有认领这个灵贴');
    }

    // 敏感词检测
    const sensitiveCheck = await this.sensitiveWordsCheckService.checkSensitiveWords(createMessageDto.content);
    if (sensitiveCheck.isSensitive) {
      throw new BadRequestException(`消息包含敏感词：${sensitiveCheck.matchedWords.join(', ')}`);
    }

    return this.prisma.spiritPostMessage.create({
      data: {
        postId,
        senderId: user.id,
        receiverId,
        content: createMessageDto.content,
      },
      include: {
        sender: {
          select: { id: true, username: true, nickname: true, avatarUrl: true }
        },
        receiver: {
          select: { id: true, username: true, nickname: true, avatarUrl: true }
        },
      },
    });
  }

  // 标记已认领
  async markCompleted(postId: number, markCompletedDto: MarkCompletedDto, user: User) {
    const post = await this.prisma.spiritPost.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('灵贴不存在');
    }

    if (post.userId !== user.id) {
      throw new ForbiddenException('只有发布者可以标记已认领');
    }

    // 检查所有指定的用户是否都有对话
    for (const claimerId of markCompletedDto.claimerIds) {
      const messages = await this.prisma.spiritPostMessage.findMany({
        where: {
          postId,
          OR: [
            { senderId: user.id, receiverId: claimerId },
            { senderId: claimerId, receiverId: user.id },
          ],
        },
      });

      if (messages.length < 2) {
        throw new BadRequestException(`用户 ${claimerId} 还没有与您产生双向对话`);
      }
    }

    // 批量更新
    await this.prisma.spiritPostClaim.updateMany({
      where: {
        postId,
        userId: { in: markCompletedDto.claimerIds },
      },
      data: { isCompleted: true },
    });

    return { success: true, message: '已成功标记为已认领' };
  }

  // 获取我的灵贴
  async getMyPosts(user: User) {
    const posts = await this.prisma.spiritPost.findMany({
      where: { userId: user.id },
      include: {
        user: {
          select: { id: true, username: true, nickname: true, avatarUrl: true }
        },
        _count: {
          select: { 
            claims: true,
            messages: true,
          }
        },
        claims: {
          where: { isCompleted: true },
          select: { userId: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // 为每个灵贴计算未读消息数
    const postsWithUnreadCount = await Promise.all(
      posts.map(async (post) => {
        const unreadCount = await this.prisma.spiritPostMessage.count({
          where: {
            postId: post.id,
            receiverId: user.id,
            isRead: false,
          },
        });
        return {
          ...post,
          unreadCount,
        };
      })
    );

    return postsWithUnreadCount;
  }

  // 获取我认领的灵贴
  async getMyClaimedPosts(user: User) {
    const claims = await this.prisma.spiritPostClaim.findMany({
      where: { userId: user.id },
      include: {
        post: {
          include: {
            user: {
              select: { id: true, username: true, nickname: true, avatarUrl: true }
            },
            _count: {
              select: { messages: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // 为每个灵贴计算未读消息数
    const postsWithUnreadCount = await Promise.all(
      claims.map(async (claim) => {
        const unreadCount = await this.prisma.spiritPostMessage.count({
          where: {
            postId: claim.post.id,
            receiverId: user.id,
            isRead: false,
          },
        });
        return {
          ...claim.post,
          unreadCount,
          claimInfo: {
            claimedAt: claim.createdAt,
            isCompleted: claim.isCompleted,
          }
        };
      })
    );

    return postsWithUnreadCount;
  }

  // 标记消息为已读
  async markMessagesAsRead(postId: number, user: User) {
    const post = await this.prisma.spiritPost.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('灵贴不存在');
    }

    // 检查用户是否有权限（发布者或认领者）
    const isOwner = post.userId === user.id;
    const claim = await this.prisma.spiritPostClaim.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        }
      }
    });

    if (!isOwner && !claim) {
      throw new ForbiddenException('您没有权限访问此灵贴的消息');
    }

    // 标记所有发给当前用户的未读消息为已读
    await this.prisma.spiritPostMessage.updateMany({
      where: {
        postId,
        receiverId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { success: true, message: '消息已标记为已读' };
  }

  // 获取用户的未读消息总数
  async getUnreadMessageCount(user: User) {
    // 获取用户发布的灵贴的未读消息数
    const myPostsUnreadCount = await this.prisma.spiritPostMessage.count({
      where: {
        receiverId: user.id,
        isRead: false,
        post: {
          userId: user.id,
        },
      },
    });

    // 获取用户认领的灵贴的未读消息数
    const myClaimsUnreadCount = await this.prisma.spiritPostMessage.count({
      where: {
        receiverId: user.id,
        isRead: false,
        post: {
          claims: {
            some: {
              userId: user.id,
            },
          },
        },
      },
    });

    return {
      total: myPostsUnreadCount + myClaimsUnreadCount,
      myPosts: myPostsUnreadCount,
      myClaims: myClaimsUnreadCount,
    };
  }
} 