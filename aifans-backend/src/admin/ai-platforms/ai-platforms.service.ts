import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAIModelDto } from './dto/create-ai-model.dto';
import { UpdateAIModelDto } from './dto/update-ai-model.dto';
import { CreateAIPlatformDto } from '../../ai-platforms/dto/create-ai-platform.dto';
import { UpdateAIPlatformDto } from '../../ai-platforms/dto/update-ai-platform.dto';

@Injectable()
export class AIPlatformsService {
  constructor(private prisma: PrismaService) {}

  // AI平台相关方法
  async findAllPlatforms() {
    return this.prisma.aIPlatform.findMany({
      include: {
        models: {
          orderBy: { name: 'asc' }
        },
        _count: {
          select: { posts: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async findOnePlatform(id: number) {
    const platform = await this.prisma.aIPlatform.findUnique({
      where: { id },
      include: {
        models: {
          orderBy: { name: 'asc' }
        },
        _count: {
          select: { posts: true }
        }
      }
    });

    if (!platform) {
      throw new NotFoundException(`AI平台 ID ${id} 不存在`);
    }

    return platform;
  }

  // AI模型相关方法
  async createModel(createModelDto: CreateAIModelDto) {
    // 检查平台是否存在
    const platform = await this.prisma.aIPlatform.findUnique({
      where: { id: createModelDto.aiPlatformId }
    });

    if (!platform) {
      throw new NotFoundException(`AI平台 ID ${createModelDto.aiPlatformId} 不存在`);
    }

    // 检查同一平台下是否已存在同名模型
    const existingModel = await this.prisma.aIModel.findFirst({
      where: {
        name: createModelDto.name,
        aiPlatformId: createModelDto.aiPlatformId
      }
    });

    if (existingModel) {
      throw new ConflictException(`该平台下已存在名为 "${createModelDto.name}" 的模型`);
    }

    return this.prisma.aIModel.create({
      data: createModelDto,
      include: {
        aiPlatform: true
      }
    });
  }

  async findAllModels(aiPlatformId?: number) {
    const where = aiPlatformId ? { aiPlatformId } : {};
    
    return this.prisma.aIModel.findMany({
      where,
      include: {
        aiPlatform: true
      },
      orderBy: [
        { aiPlatformId: 'asc' },
        { name: 'asc' }
      ]
    });
  }

  async findOneModel(id: number) {
    const model = await this.prisma.aIModel.findUnique({
      where: { id },
      include: {
        aiPlatform: true
      }
    });

    if (!model) {
      throw new NotFoundException(`AI模型 ID ${id} 不存在`);
    }

    return model;
  }

  async updateModel(id: number, updateModelDto: UpdateAIModelDto) {
    const model = await this.findOneModel(id);

    // 如果要更新名称，检查是否与同平台其他模型重名
    if (updateModelDto.name && updateModelDto.name !== model.name) {
      const existingModel = await this.prisma.aIModel.findFirst({
        where: {
          name: updateModelDto.name,
          aiPlatformId: model.aiPlatformId,
          NOT: { id }
        }
      });

      if (existingModel) {
        throw new ConflictException(`该平台下已存在名为 "${updateModelDto.name}" 的模型`);
      }
    }

    return this.prisma.aIModel.update({
      where: { id },
      data: updateModelDto,
      include: {
        aiPlatform: true
      }
    });
  }

  async removeModel(id: number) {
    await this.findOneModel(id);

    return this.prisma.aIModel.delete({
      where: { id }
    });
  }

  // 获取平台的所有模型
  async getPlatformModels(platformId: number) {
    await this.findOnePlatform(platformId);

    return this.prisma.aIModel.findMany({
      where: { aiPlatformId: platformId },
      orderBy: { name: 'asc' }
    });
  }

  // 创建AI平台
  async create(createDto: CreateAIPlatformDto) {
    return this.prisma.aIPlatform.create({
      data: createDto
    });
  }

  // 删除AI平台
  async removePlatform(id: number) {
    await this.findOnePlatform(id);

    return this.prisma.aIPlatform.delete({
      where: { id }
    });
  }

  // 更新AI平台
  async updatePlatform(id: number, updateDto: UpdateAIPlatformDto) {
    await this.findOnePlatform(id);

    return this.prisma.aIPlatform.update({
      where: { id },
      data: updateDto
    });
  }
} 