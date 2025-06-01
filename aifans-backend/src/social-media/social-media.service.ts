import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSocialMediaDto } from './dto/create-social-media.dto';
import { UpdateSocialMediaDto } from './dto/update-social-media.dto';

@Injectable()
export class SocialMediaService {
  constructor(private prisma: PrismaService) {}

  async create(createSocialMediaDto: CreateSocialMediaDto & { logoUrl: string; qrCodeUrl: string }) {
    return this.prisma.socialMedia.create({
      data: createSocialMediaDto,
    });
  }

  async findAll() {
    return this.prisma.socialMedia.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'asc' }
      ],
    });
  }

  async findActive() {
    return this.prisma.socialMedia.findMany({
      where: { isActive: true },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'asc' }
      ],
    });
  }

  async findOne(id: number) {
    const socialMedia = await this.prisma.socialMedia.findUnique({
      where: { id },
    });

    if (!socialMedia) {
      throw new NotFoundException(`社交媒体 ID ${id} 不存在`);
    }

    return socialMedia;
  }

  async update(id: number, updateSocialMediaDto: UpdateSocialMediaDto) {
    await this.findOne(id); // 检查是否存在

    return this.prisma.socialMedia.update({
      where: { id },
      data: updateSocialMediaDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // 检查是否存在

    return this.prisma.socialMedia.delete({
      where: { id },
    });
  }

  async updateSortOrder(items: { id: number; sortOrder: number }[]) {
    const updatePromises = items.map(item =>
      this.prisma.socialMedia.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    );

    await Promise.all(updatePromises);
    return { message: '排序更新成功' };
  }
} 