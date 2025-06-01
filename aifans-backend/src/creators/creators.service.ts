import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreatorDto } from './dto/create-creator.dto';
import { SensitiveWordsCheckService } from '../common/services/sensitive-words.service';

@Injectable()
export class CreatorsService {
  constructor(
    private prisma: PrismaService,
    private sensitiveWordsCheckService: SensitiveWordsCheckService,
  ) {}

  async findAll() {
    // 按积分降序排列，积分越高越靠前
    return this.prisma.creator.findMany({
      orderBy: {
        score: 'desc'
      }
    });
  }

  async findOne(id: number) {
    return this.prisma.creator.findUnique({ where: { id } });
  }

  async findByUserId(userId: number) {
    return this.prisma.creator.findUnique({ where: { userId } });
  }

  // 计算创作者积分
  async calculateCreatorScore(userId: number): Promise<number> {
    let totalScore = 0;

    // 1. 灵感板块积分 - 通过Post表计算（更准确）
    const posts = await this.prisma.post.findMany({
      where: { 
        userId,
        status: 'VISIBLE'
      }
    });
    
    for (const post of posts) {
      // 根据类型给不同的基础分
      if (post.type === 'IMAGE') {
        totalScore += 10; // 图片10分
      } else if (post.type === 'VIDEO') {
        totalScore += 20; // 视频20分
      }
      
      totalScore += post.likesCount * 1; // 每个赞1分
      totalScore += post.favoritesCount * 2; // 每个收藏2分
    }

    // 2. 笔记板块积分
    const notes = await this.prisma.note.findMany({
      where: { 
        userId,
        status: 'VISIBLE' // 只计算可见的笔记
      }
    });
    
    // 每发布一篇笔记增加100分
    totalScore += notes.length * 100;
    
    // 笔记的赞和收藏积分
    for (const note of notes) {
      totalScore += note.likesCount * 2; // 每个赞2分
      totalScore += note.favoritesCount * 5; // 每个收藏5分
    }

    // 3. 每日登录积分
    const dailyLogins = await this.prisma.userDailyLogin.findMany({
      where: { userId }
    });
    
    // 每天登录20分
    totalScore += dailyLogins.length * 20;

    // 4. 灵感板块积分 - 通过SpiritPost表计算
    const spiritPosts = await this.prisma.spiritPost.findMany({
      where: { 
        userId,
        isHidden: false
      }
    });
    
    // 每发布一个灵感增加基础分（这里统一按15分计算，实际应该根据内容类型区分）
    totalScore += spiritPosts.length * 15;

    return totalScore;
  }

  // 更新创作者积分
  async updateCreatorScore(userId: number): Promise<void> {
    const score = await this.calculateCreatorScore(userId);
    
    // 确保创作者记录存在，如果不存在则创建
    const creator = await this.prisma.creator.findUnique({
      where: { userId }
    });
    
    if (creator) {
      await this.prisma.creator.update({
        where: { userId },
        data: { score }
      });
    } else {
      // 如果创作者记录不存在，获取用户信息并创建
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (user) {
        await this.prisma.creator.create({
          data: {
            userId,
            nickname: user.nickname || `创作者_${user.id}`,
            avatarUrl: user.avatarUrl,
            score
          }
        });
      }
    }
  }

  // 批量更新所有创作者积分
  async updateAllCreatorScores(): Promise<void> {
    // 获取所有有内容的用户（发过笔记或作品的用户）
    const usersWithContent = await this.prisma.user.findMany({
      where: {
        OR: [
          { notes: { some: { status: 'VISIBLE' } } },
          { posts: { some: { status: 'VISIBLE' } } },
          { spiritPosts: { some: { isHidden: false } } }
        ]
      }
    });
    
    for (const user of usersWithContent) {
      await this.updateCreatorScore(user.id);
    }
    
    // 同时更新现有的创作者
    const existingCreators = await this.prisma.creator.findMany();
    for (const creator of existingCreators) {
      await this.updateCreatorScore(creator.userId);
    }
  }

  // 当用户发布笔记时更新积分
  async onNoteCreated(userId: number): Promise<void> {
    await this.updateCreatorScore(userId);
  }

  // 当用户删除笔记时更新积分
  async onNoteDeleted(userId: number): Promise<void> {
    await this.updateCreatorScore(userId);
  }

  // 当用户发布作品时更新积分
  async onPostCreated(userId: number): Promise<void> {
    await this.updateCreatorScore(userId);
  }

  // 当用户删除作品时更新积分
  async onPostDeleted(userId: number): Promise<void> {
    await this.updateCreatorScore(userId);
  }

  // 当用户发布灵感时更新积分
  async onSpiritPostCreated(userId: number): Promise<void> {
    await this.updateCreatorScore(userId);
  }

  // 当用户删除灵感时更新积分
  async onSpiritPostDeleted(userId: number): Promise<void> {
    await this.updateCreatorScore(userId);
  }

  // 当作品获得赞/收藏时更新积分
  async onPostInteraction(userId: number): Promise<void> {
    await this.updateCreatorScore(userId);
  }

  // 当笔记获得赞/收藏时更新积分
  async onNoteInteraction(userId: number): Promise<void> {
    await this.updateCreatorScore(userId);
  }

  // 记录用户每日登录
  async recordDailyLogin(userId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 设置为当天的开始时间
    
    try {
      await this.prisma.userDailyLogin.create({
        data: {
          userId,
          loginDate: today
        }
      });
      
      // 登录后更新积分
      await this.updateCreatorScore(userId);
    } catch (error) {
      // 如果今天已经记录过登录，忽略错误
      if (error.code !== 'P2002') { // P2002是唯一约束违反错误
        throw error;
      }
    }
  }

  async createOrUpdate(userId: number, dto: CreateCreatorDto) {
    const nickname = dto.nickname;
    if (!nickname) {
      throw new Error('nickname 不能为空');
    }

    // 敏感词检测
    const textsToCheck: string[] = [nickname];
    if (dto.bio) textsToCheck.push(dto.bio);
    if (dto.expertise) textsToCheck.push(dto.expertise);

    const sensitiveCheck = await this.sensitiveWordsCheckService.checkMultipleTexts(textsToCheck);
    if (sensitiveCheck.isSensitive) {
      throw new BadRequestException(`内容包含敏感词：${sensitiveCheck.matchedWords.join(', ')}`);
    }
    
    const processedImages = Array.isArray(dto.images)
      ? dto.images.filter(img => img && img.url)
      : [];
    
    const processedVideos = Array.isArray(dto.videos)
      ? dto.videos.filter(v => v && v.url)
      : [];
    
    const processedAudios = Array.isArray(dto.audios)
      ? dto.audios.filter(a => a && a.url)
      : [];
    
    const data = {
      ...dto,
      userId,
      nickname,
      images: processedImages,
      videos: processedVideos,
      audios: processedAudios,
    };
    
    const exist = await this.prisma.creator.findUnique({ where: { userId } });
    
    try {
      let result;
      if (exist) {
        result = await this.prisma.creator.update({
          where: { userId },
          data: { ...data, updatedAt: new Date() }
        });
      } else {
        result = await this.prisma.creator.create({
          data
        });
      }
      
      // 创建或更新后，重新计算积分
      await this.updateCreatorScore(userId);
      
      return result;
    } catch (error) {
      console.error('创建/更新创作者失败:', error);
      throw error;
    }
  }
} 