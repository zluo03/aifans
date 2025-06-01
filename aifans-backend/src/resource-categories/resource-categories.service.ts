import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResourceCategoryDto } from './dto/create-resource-category.dto';
import { UpdateResourceCategoryDto } from './dto/update-resource-category.dto';

@Injectable()
export class ResourceCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createResourceCategoryDto: CreateResourceCategoryDto) {
    try {
      return await this.prisma.resourceCategory.create({
        data: createResourceCategoryDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('分类名称已存在');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.resourceCategory.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            resources: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.resourceCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            resources: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return category;
  }

  async update(id: number, updateResourceCategoryDto: UpdateResourceCategoryDto) {
    try {
      const category = await this.prisma.resourceCategory.update({
        where: { id },
        data: updateResourceCategoryDto,
      });
      return category;
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
    // 检查是否有资源使用此分类
    const resourceCount = await this.prisma.resource.count({
      where: { categoryId: id },
    });

    if (resourceCount > 0) {
      throw new ConflictException(`无法删除分类，还有 ${resourceCount} 个资源正在使用此分类`);
    }

    try {
      return await this.prisma.resourceCategory.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('分类不存在');
      }
      throw error;
    }
  }
} 