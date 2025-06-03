import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto, CreateUserDto, PaginationQueryDto, UpdateUserDto } from './dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { EntityType } from '../types/prisma-enums';
import { adaptUserCreateInput, adaptUserUpdateInput, mapUserPasswordField } from '../types/prisma-extend';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;
    
    // 生成密码哈希
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 创建用户 - 使用适配器转换密码字段
    const createData = adaptUserCreateInput({
      ...userData,
      passwordHash: hashedPassword,
    });
    
    return this.prisma.user.create({
      data: createData,
    });
  }

  async findUserById(id: number) {
    this.logger.debug('查找用户:', { id });

    if (!id) {
      this.logger.error('用户ID不能为空');
      throw new Error('用户ID不能为空');
    }
    
    try {
      const user = await this.prisma.user.findUnique({
        where: { id }
    });

      if (!user) {
        this.logger.warn('未找到用户:', { id });
        return null;
      }

      this.logger.debug('找到用户:', { 
        id: user.id,
        username: user.username,
        role: user.role
      });

      return user;
    } catch (error) {
      this.logger.error('查找用户失败:', { id, error });
      throw error;
    }
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findUserByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  // 更新用户信息
  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    try {
      this.logger.debug('更新用户信息:', { userId: id, updateData: updateUserDto });
      
      // 如果要更新邮箱，先检查新邮箱是否已被使用
      if (updateUserDto.email) {
        const existingUser = await this.prisma.user.findFirst({
          where: {
            email: updateUserDto.email,
            NOT: {
              id: id
            }
          }
        });

        if (existingUser) {
          throw new BadRequestException('该邮箱已被其他用户使用');
        }
      }
      
      // 先获取用户信息，判断是否是微信用户
      const existingUser = await this.prisma.user.findUnique({
        where: { id }
      });
      
      if (!existingUser) {
        throw new NotFoundException('用户不存在');
      }
      
      // 准备更新数据
      let updateData = { ...updateUserDto };
      
      // 如果是微信用户且更新了头像，同时更新wechatAvatar字段
      if (existingUser.isWechatUser && updateUserDto.avatarUrl) {
        this.logger.debug('微信用户更新头像:', { 
          userId: id, 
          oldAvatar: existingUser.avatarUrl,
          newAvatar: updateUserDto.avatarUrl,
          oldWechatAvatar: existingUser.wechatAvatar
        });
        
        updateData.wechatAvatar = updateUserDto.avatarUrl;
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });
      
      this.logger.debug('用户信息更新成功:', { userId: id, updatedFields: Object.keys(updateData) });
      
      // 如果更新了昵称或头像，同步更新创作者信息
      if (updateUserDto.nickname || updateUserDto.avatarUrl) {
        await this.syncCreatorProfile(id, updateUserDto.nickname, updateUserDto.avatarUrl);
      }
      
      // 使用类型转换函数
      const userWithHash = mapUserPasswordField(user);
      const { passwordHash, ...result } = userWithHash;
      return result;
    } catch (error) {
      this.logger.error('更新用户信息失败:', { userId: id, error });
      
      if (error.code === 'P2025') {
        throw new NotFoundException('用户不存在');
      }
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('更新用户信息失败');
    }
  }

  // 同步更新创作者信息
  private async syncCreatorProfile(userId: number, nickname?: string, avatarUrl?: string) {
    try {
      // 检查用户是否有创作者信息
      const creator = await this.prisma.creator.findUnique({
        where: { userId }
      });
      
      if (creator) {
        this.logger.debug('同步更新创作者信息:', { userId, nickname, avatarUrl });
        
        // 准备更新数据
        const updateData: any = {};
        
        // 只更新提供的字段
        if (nickname) {
          updateData.nickname = nickname;
        }
        
        if (avatarUrl) {
          updateData.avatarUrl = avatarUrl;
        }
        
        // 只有当有数据需要更新时才执行更新
        if (Object.keys(updateData).length > 0) {
          await this.prisma.creator.update({
            where: { userId },
            data: updateData
          });
          
          this.logger.debug('创作者信息同步更新成功:', { userId, updatedFields: Object.keys(updateData) });
        }
      } else {
        this.logger.debug('用户没有创作者信息，无需同步:', { userId });
      }
    } catch (error) {
      this.logger.error('同步更新创作者信息失败:', { userId, error });
      // 不抛出异常，避免影响主流程
    }
  }

  // 同步所有用户信息到创作者信息
  async syncAllCreatorsWithUsers(): Promise<{ updated: number, total: number }> {
    this.logger.log('开始同步所有用户信息到创作者信息');
    
    try {
      // 获取所有创作者记录
      const creators = await this.prisma.creator.findMany();
      this.logger.log(`找到 ${creators.length} 个创作者记录`);
      
      let updatedCount = 0;
      
      // 遍历所有创作者，同步信息
      for (const creator of creators) {
        try {
          // 获取对应的用户信息
          const user = await this.prisma.user.findUnique({
            where: { id: creator.userId }
          });
          
          if (!user) {
            this.logger.warn(`创作者(${creator.id})对应的用户(${creator.userId})不存在，跳过同步`);
            continue;
          }
          
          // 检查是否需要更新
          const needUpdate = creator.nickname !== user.nickname || creator.avatarUrl !== user.avatarUrl;
          
          if (needUpdate) {
            // 准备更新数据，处理可能的null值
            const updateData: any = {
              updatedAt: new Date()
            };
            
            // 只有当用户昵称不为null时才更新
            if (user.nickname) {
              updateData.nickname = user.nickname;
            }
            
            // 只有当用户头像不为null时才更新
            if (user.avatarUrl) {
              updateData.avatarUrl = user.avatarUrl;
            }
            
            // 更新创作者信息
            await this.prisma.creator.update({
              where: { id: creator.id },
              data: updateData
            });
            
            this.logger.log(`已同步创作者(${creator.id})的信息与用户(${user.id})信息`);
            updatedCount++;
          }
        } catch (error) {
          this.logger.error(`同步创作者(${creator.id})信息失败:`, error);
          // 继续处理下一个，不中断整个流程
        }
      }
      
      this.logger.log(`同步完成，共更新了 ${updatedCount}/${creators.length} 个创作者信息`);
      return { updated: updatedCount, total: creators.length };
    } catch (error) {
      this.logger.error('批量同步创作者信息失败:', error);
      throw error;
    }
  }

  // 修改密码
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    this.logger.log(`开始修改用户(${userId})的密码`);
    
    const { currentPassword, newPassword } = changePasswordDto;
    
    const trimmedCurrentPassword = currentPassword.trim();
    const trimmedNewPassword = newPassword.trim();
    
    // 密码复杂度验证
    if (!this.validatePasswordComplexity(trimmedNewPassword)) {
      this.logger.warn(`用户(${userId})提供的新密码不符合复杂度要求`);
      throw new BadRequestException('新密码必须包含大小写字母、数字，长度至少8位');
    }
    
    // 查找用户
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        role: true,
      }
    });
    
    if (!user) {
      this.logger.warn(`用户不存在: ${userId}`);
      throw new NotFoundException('用户不存在');
    }

    if (!user.password) {
      this.logger.warn(`用户(${userId})没有设置密码`);
      throw new BadRequestException('用户未设置密码，请使用其他登录方式');
    }
    
    // 验证当前密码
    const isPasswordValid = await bcrypt.compare(trimmedCurrentPassword, user.password);
    this.logger.log(`密码验证结果: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      this.logger.warn(`用户(${userId})密码验证失败`);
      throw new BadRequestException('当前密码不正确');
    }
    
    this.logger.log(`用户(${userId})当前密码验证通过，开始更新密码`);
    
    try {
      // 生成新密码哈希并更新
      const salt = await bcrypt.genSalt();
      const newHashedPassword = await bcrypt.hash(trimmedNewPassword, salt);
      
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          password: newHashedPassword,
          updatedAt: new Date(),
        },
      });
      
      this.logger.log(`用户(${userId})密码更新成功`);
      return { message: '密码修改成功' };
    } catch (error) {
      this.logger.error(`更新用户(${userId})密码时出错: ${error.message}`);
      throw new BadRequestException('更新密码失败，请重试');
    }
  }

  // 验证密码复杂度
  private validatePasswordComplexity(password: string): boolean {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const isLengthValid = password.length >= 8;
    
    return hasUpperCase && hasLowerCase && hasNumbers && isLengthValid;
  }

  // 获取用户点赞列表
  async getUserLikes(userId: number, query: PaginationQueryDto) {
    const { page = 1, limit = 10, entityType } = query;
    const skip = (page - 1) * limit;
    
    const where: any = { userId };
    if (entityType) {
      where.entityType = entityType;
    }
    
    const [likes, total] = await Promise.all([
      this.prisma.like.findMany({
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
            }
          }
        }
      }),
      this.prisma.like.count({ where })
    ]);

    // 手动查询相关实体数据
    const enrichedLikes = await Promise.all(
      likes.map(async (like) => {
        let entity: any = null;
        
        try {
          switch (like.entityType) {
            case 'POST':
              entity = await this.prisma.post.findUnique({
                where: { id: like.entityId },
                select: {
                  id: true,
                  title: true,
                  prompt: true,
                  fileUrl: true,
                  thumbnailUrl: true,
                  createdAt: true,
                  user: {
                    select: {
                      id: true,
                      username: true,
                      nickname: true,
                      avatarUrl: true,
                    }
                  }
                }
              });
              break;
            case 'NOTE':
              entity = await this.prisma.note.findUnique({
                where: { id: like.entityId },
                select: {
                  id: true,
                  title: true,
                  content: true,
                  coverImageUrl: true,
                  createdAt: true,
                  user: {
                    select: {
                      id: true,
                      username: true,
                      nickname: true,
                      avatarUrl: true,
                    }
                  }
                }
              });
              break;
            case 'REQUEST':
              entity = await this.prisma.request.findUnique({
                where: { id: like.entityId },
                select: {
                  id: true,
                  title: true,
                  content: true,
                  createdAt: true,
                  user: {
                    select: {
                      id: true,
                      username: true,
                      nickname: true,
                      avatarUrl: true,
                    }
                  }
                }
              });
              break;
            case 'SCREENING':
              entity = await this.prisma.screening.findUnique({
                where: { id: like.entityId },
                select: {
                  id: true,
                  title: true,
                  description: true,
                  thumbnailUrl: true,
                  createdAt: true,
                  adminUploader: {
                    select: {
                      id: true,
                      username: true,
                      nickname: true,
                      avatarUrl: true,
                    }
                  }
                }
              });
              break;
          }
        } catch (error) {
          // 如果实体已被删除，记录日志但继续处理
          console.warn(`找不到实体: ${like.entityType} ID ${like.entityId}`);
        }
        
        return {
          ...like,
          entity
        };
      })
    );
    
    return {
      items: enrichedLikes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // 获取用户收藏列表
  async getUserFavorites(userId: number, query: PaginationQueryDto) {
    const { page = 1, limit = 10, entityType } = query;
    const skip = (page - 1) * limit;
    
    const where: any = { userId };
    if (entityType) {
      where.entityType = entityType;
    }
    
    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
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
            }
          }
        }
      }),
      this.prisma.favorite.count({ where })
    ]);

    // 手动查询相关实体数据
    const enrichedFavorites = await Promise.all(
      favorites.map(async (favorite) => {
        let entity: any = null;
        
        try {
          switch (favorite.entityType) {
            case 'POST':
              entity = await this.prisma.post.findUnique({
                where: { id: favorite.entityId },
                select: {
                  id: true,
                  title: true,
                  prompt: true,
                  fileUrl: true,
                  thumbnailUrl: true,
                  createdAt: true,
                  user: {
                    select: {
                      id: true,
                      username: true,
                      nickname: true,
                      avatarUrl: true,
                    }
                  }
                }
              });
              break;
            case 'NOTE':
              entity = await this.prisma.note.findUnique({
                where: { id: favorite.entityId },
                select: {
                  id: true,
                  title: true,
                  content: true,
                  coverImageUrl: true,
                  createdAt: true,
                  user: {
                    select: {
                      id: true,
                      username: true,
                      nickname: true,
                      avatarUrl: true,
                    }
                  }
                }
              });
              break;
            case 'REQUEST':
              entity = await this.prisma.request.findUnique({
                where: { id: favorite.entityId },
                select: {
                  id: true,
                  title: true,
                  content: true,
                  createdAt: true,
                  user: {
                    select: {
                      id: true,
                      username: true,
                      nickname: true,
                      avatarUrl: true,
                    }
                  }
                }
              });
              break;
            case 'SCREENING':
              entity = await this.prisma.screening.findUnique({
                where: { id: favorite.entityId },
                select: {
                  id: true,
                  title: true,
                  description: true,
                  thumbnailUrl: true,
                  createdAt: true,
                  adminUploader: {
                    select: {
                      id: true,
                      username: true,
                      nickname: true,
                      avatarUrl: true,
                    }
                  }
                }
              });
              break;
          }
        } catch (error) {
          // 如果实体已被删除，记录日志但继续处理
          console.warn(`找不到实体: ${favorite.entityType} ID ${favorite.entityId}`);
        }
        
        return {
          ...favorite,
          entity
        };
      })
    );
    
    return {
      items: enrichedFavorites,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
