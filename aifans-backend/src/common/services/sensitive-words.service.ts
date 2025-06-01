import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SensitiveWordsCheckService {
  // 敏感词缓存
  private sensitiveWordsCache: string[] = [];
  private cacheLastUpdated: Date = new Date(0); // 初始化为过期状态

  constructor(private readonly prisma: PrismaService) {
    // 初始化时加载敏感词到缓存
    this.updateCache();
  }

  // 更新缓存
  private async updateCache() {
    try {
      const words = await this.prisma.sensitiveWord.findMany({
        select: { word: true },
      });
      this.sensitiveWordsCache = words.map(w => w.word);
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

  // 敏感词检测方法，供其他服务调用
  async checkSensitiveWords(text: string): Promise<{ isSensitive: boolean; matchedWords: string[] }> {
    if (!text) {
      return { isSensitive: false, matchedWords: [] };
    }
    
    await this.ensureCacheUpdated();
    
    const matchedWords: string[] = [];
    
    for (const word of this.sensitiveWordsCache) {
      if (text.includes(word)) {
        matchedWords.push(word);
      }
    }
    
    return {
      isSensitive: matchedWords.length > 0,
      matchedWords,
    };
  }

  // 检测多个文本字段
  async checkMultipleTexts(texts: string[]): Promise<{ isSensitive: boolean; matchedWords: string[] }> {
    const allMatchedWords: string[] = [];
    
    for (const text of texts) {
      if (text) {
        const result = await this.checkSensitiveWords(text);
        allMatchedWords.push(...result.matchedWords);
      }
    }
    
    // 去重
    const uniqueMatchedWords = [...new Set(allMatchedWords)];
    
    return {
      isSensitive: uniqueMatchedWords.length > 0,
      matchedWords: uniqueMatchedWords,
    };
  }

  // 强制刷新缓存（当管理员添加/删除敏感词时调用）
  async refreshCache() {
    await this.updateCache();
  }
} 