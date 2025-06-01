import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from '../announcements/dto/create-announcement.dto';
import { UpdateAnnouncementDto } from '../announcements/dto/update-announcement.dto';

interface FindAllOptions {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
}

@Injectable()
export class AdminAnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAnnouncementDto: CreateAnnouncementDto) {
    const announcement = await this.prisma.announcement.create({
      data: {
        ...createAnnouncementDto,
        startDate: new Date(createAnnouncementDto.startDate),
        endDate: new Date(createAnnouncementDto.endDate),
      },
    });

    return announcement;
  }

  async findAll(options: FindAllOptions) {
    const { page, limit, search, isActive } = options;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { summary: { contains: search } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // 获取总数
    const total = await this.prisma.announcement.count({ where });

    // 获取数据
    const announcements = await this.prisma.announcement.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        _count: {
          select: {
            viewRecords: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      items: announcements,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOne(id: number) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            viewRecords: true,
          },
        },
      },
    });

    if (!announcement) {
      throw new NotFoundException(`ID为${id}的公告不存在`);
    }

    return announcement;
  }

  async update(id: number, updateAnnouncementDto: UpdateAnnouncementDto) {
    const existingAnnouncement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!existingAnnouncement) {
      throw new NotFoundException(`ID为${id}的公告不存在`);
    }

    const updateData: any = { ...updateAnnouncementDto };
    
    if (updateAnnouncementDto.startDate) {
      updateData.startDate = new Date(updateAnnouncementDto.startDate);
    }
    
    if (updateAnnouncementDto.endDate) {
      updateData.endDate = new Date(updateAnnouncementDto.endDate);
    }

    const announcement = await this.prisma.announcement.update({
      where: { id },
      data: updateData,
    });

    return announcement;
  }

  async remove(id: number) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException(`ID为${id}的公告不存在`);
    }

    await this.prisma.announcement.delete({
      where: { id },
    });

    return {
      id,
      message: '公告已删除',
    };
  }

  async getStats() {
    const [
      totalAnnouncements,
      activeAnnouncements,
      expiredAnnouncements,
      scheduledAnnouncements,
    ] = await Promise.all([
      this.prisma.announcement.count(),
      this.prisma.announcement.count({
        where: {
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
      }),
      this.prisma.announcement.count({
        where: {
          endDate: { lt: new Date() },
        },
      }),
      this.prisma.announcement.count({
        where: {
          isActive: true,
          startDate: { gt: new Date() },
        },
      }),
    ]);

    return {
      totalAnnouncements,
      activeAnnouncements,
      expiredAnnouncements,
      scheduledAnnouncements,
    };
  }
} 