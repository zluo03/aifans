import { Injectable, NotFoundException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSensitiveWordDto } from './dto/sensitive-word.dto';
import { SensitiveWordsCheckService } from '../common/services/sensitive-words.service';

@Injectable()
export class SensitiveWordsService implements OnModuleInit {
  // 敏感词缓存
  private sensitiveWordsCache: { word: string; id: number }[] = [];
  private cacheLastUpdated: Date = new Date(0); // 初始化为过期状态

  constructor(
    private readonly prisma: PrismaService,
    private readonly sensitiveWordsCheckService: SensitiveWordsCheckService
  ) {
    // 初始化时加载敏感词到缓存
    this.updateCache();
  }

  // 更新缓存
  private async updateCache() {
    try {
      const words = await this.prisma.sensitiveWord.findMany({
        select: { id: true, word: true },
      });
      this.sensitiveWordsCache = words;
      this.cacheLastUpdated = new Date();
    } catch (error) {
      console.error('Error updating sensitive words cache:', error);
    }
  }

  // 检查缓存是否需要更新（缓存过期时间设为1小时）
  private async ensureCacheUpdated() {
    const cacheAgeInMilliseconds = Date.now() - this.cacheLastUpdated.getTime();
    if (cacheAgeInMilliseconds > 3600000 || this.sensitiveWordsCache.length === 0) {
      await this.updateCache();
    }
  }

  async findAll() {
    await this.ensureCacheUpdated();
    return this.sensitiveWordsCache;
  }

  async create(createSensitiveWordDto: CreateSensitiveWordDto) {
    // 检查敏感词是否已存在
    const existingWord = await this.prisma.sensitiveWord.findFirst({
      where: { word: createSensitiveWordDto.word },
    });

    if (existingWord) {
      throw new BadRequestException(`敏感词 "${createSensitiveWordDto.word}" 已存在`);
    }

    // 创建新敏感词
    const newWord = await this.prisma.sensitiveWord.create({
      data: createSensitiveWordDto,
    });

    // 更新缓存
    await this.updateCache();
    
    // 刷新检测服务的缓存
    await this.sensitiveWordsCheckService.refreshCache();

    return newWord;
  }

  async remove(id: number) {
    // 检查敏感词是否存在
    const word = await this.prisma.sensitiveWord.findUnique({
      where: { id },
    });

    if (!word) {
      throw new NotFoundException(`ID为${id}的敏感词不存在`);
    }

    // 删除敏感词
    await this.prisma.sensitiveWord.delete({
      where: { id },
    });

    // 更新缓存
    await this.updateCache();
    
    // 刷新检测服务的缓存
    await this.sensitiveWordsCheckService.refreshCache();

    return { id, deleted: true };
  }

  // 敏感词检测方法，供其他服务调用
  async isTextSensitive(text: string): Promise<{ isSensitive: boolean; matchedWords: string[] }> {
    if (!text) {
      return { isSensitive: false, matchedWords: [] };
    }
    
    await this.ensureCacheUpdated();
    
    const matchedWords: string[] = [];
    
    for (const { word } of this.sensitiveWordsCache) {
      if (text.includes(word)) {
        matchedWords.push(word);
      }
    }
    
    return {
      isSensitive: matchedWords.length > 0,
      matchedWords,
    };
  }

  async onModuleInit() {
    // 初始化时加载敏感词到缓存
    await this.updateCache();
  }
} 