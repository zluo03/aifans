import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestCategoryDto, UpdateRequestCategoryDto } from './dto';

@Injectable()
export class RequestCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRequestCategoryDto) {
    try {
      return await this.prisma.requestCategory.create({
        data: {
          name: dto.name,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('分类名称已存在');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.requestCategory.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.requestCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return category;
  }

  async update(id: number, dto: UpdateRequestCategoryDto) {
    try {
      return await this.prisma.requestCategory.update({
        where: { id },
        data: {
          name: dto.name,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('分类名称已存在');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('分类不存在');
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.requestCategory.delete({
        where: { id },
      });
      return { success: true };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('分类不存在');
      }
      throw error;
    }
  }
} 