import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveAnnouncements(userId?: number) {
    const now = new Date();
    
    // 获取当前有效的公告（最多3个，按优先级排序）
    const announcements = await this.prisma.announcement.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 3,
    });

    if (!userId) {
      return announcements;
    }

    // 检查用户今天是否已经查看过这些公告
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const viewedToday = await this.prisma.announcementView.findMany({
      where: {
        userId,
        viewDate: today,
        announcementId: {
          in: announcements.map(a => a.id),
        },
      },
    });

    const viewedIds = new Set(viewedToday.map(v => v.announcementId));
    
    // 只返回用户今天还没有查看过的公告
    const unviewedAnnouncements = announcements.filter(a => !viewedIds.has(a.id));
    
    return unviewedAnnouncements;
  }

  async markAsViewed(announcementId: number, userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 检查公告是否存在
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new NotFoundException('公告不存在');
    }

    // 检查今天是否已经记录过
    const existingView = await this.prisma.announcementView.findFirst({
      where: {
        userId,
        announcementId,
        viewDate: today,
      },
    });

    // 如果今天还没有记录，则创建新记录
    if (!existingView) {
      try {
        await this.prisma.announcementView.create({
          data: {
            userId,
            announcementId,
            viewDate: today,
          },
        });
      } catch (error) {
        // 如果创建时发生唯一约束冲突，说明在并发情况下已经被创建了，忽略错误
        if (error.code !== 'P2002') {
          throw error;
        }
      }
    }

    return { success: true };
  }

  async findOne(id: number) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('公告不存在');
    }

    return announcement;
  }
} 