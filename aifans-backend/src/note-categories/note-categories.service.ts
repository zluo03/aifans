import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteCategoryDto, UpdateNoteCategoryDto } from './dto';

@Injectable()
export class NoteCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createNoteCategoryDto: CreateNoteCategoryDto) {
    // 检查同名分类是否存在
    const existingCategory = await this.prisma.noteCategory.findUnique({
      where: { name: createNoteCategoryDto.name },
    });

    if (existingCategory) {
      throw new BadRequestException(`名为 "${createNoteCategoryDto.name}" 的分类已存在`);
    }

    return this.prisma.noteCategory.create({
      data: createNoteCategoryDto,
    });
  }

  async findAll() {
    return this.prisma.noteCategory.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.noteCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`ID为${id}的分类不存在`);
    }

    return category;
  }

  async update(id: number, updateNoteCategoryDto: UpdateNoteCategoryDto) {
    // 检查分类是否存在
    await this.findOne(id);

    // 如果更新名称，检查同名分类是否存在
    if (updateNoteCategoryDto.name) {
      const existingCategory = await this.prisma.noteCategory.findFirst({
        where: {
          name: updateNoteCategoryDto.name,
          id: { not: id },
        },
      });

      if (existingCategory) {
        throw new BadRequestException(`名为 "${updateNoteCategoryDto.name}" 的分类已存在`);
      }
    }

    return this.prisma.noteCategory.update({
      where: { id },
      data: updateNoteCategoryDto,
    });
  }

  async remove(id: number) {
    // 检查分类是否存在
    await this.findOne(id);

    // 检查是否有笔记使用该分类
    // 待Notes模型创建后添加此检查逻辑
    
    return this.prisma.noteCategory.delete({
      where: { id },
    });
  }
}
