import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAIPlatformDto } from './dto/create-ai-platform.dto';
import { UpdateAIPlatformDto } from './dto/update-ai-platform.dto';
import { AIPlatformType } from '../types';

@Injectable()
export class AiPlatformsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.aIPlatform.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findAllByType(type: AIPlatformType) {
    return this.prisma.aIPlatform.findMany({
      where: { type },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const platform = await this.prisma.aIPlatform.findUnique({
      where: { id },
    });

    if (!platform) {
      throw new NotFoundException(`ID为 ${id} 的AI平台不存在`);
    }

    return platform;
  }

  async create(createAiPlatformDto: CreateAIPlatformDto) {
    return this.prisma.aIPlatform.create({
      data: createAiPlatformDto,
    });
  }

  async update(id: number, updateAiPlatformDto: UpdateAIPlatformDto) {
    // 首先检查平台是否存在
    await this.findOne(id);

    return this.prisma.aIPlatform.update({
      where: { id },
      data: updateAiPlatformDto,
    });
  }

  async remove(id: number) {
    // 首先检查平台是否存在
    await this.findOne(id);

    return this.prisma.aIPlatform.delete({
      where: { id },
    });
  }

  async getPlatformModels(platformId: number) {
    // 首先检查平台是否存在
    await this.findOne(platformId);

    return this.prisma.aIModel.findMany({
      where: { aiPlatformId: platformId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
      }
    });
  }
}
