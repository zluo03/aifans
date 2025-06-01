import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CacheService implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private isRedisAvailable = false;
  private readonly defaultTTL: number = 3600; // 默认缓存1小时

  // 为不同类型的数据设置不同的TTL
  private readonly TTL = {
    usersList: 300, // 用户列表缓存5分钟
    userBasic: 1800, // 用户基本信息缓存30分钟
    posts: 600, // 帖子缓存10分钟
    notes: 900, // 笔记缓存15分钟
    categories: 3600, // 分类缓存1小时
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.initRedis();
  }

  private initRedis() {
    try {
      this.redis = new Redis({
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
        password: this.configService.get('REDIS_PASSWORD'),
        db: this.configService.get('REDIS_DB', 0),
        retryStrategy: (times) => {
          if (times > 3) {
            this.isRedisAvailable = false;
            this.logger.warn('Redis连接失败，切换到无缓存模式');
            return null; // 停止重试
          }
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.redis.on('error', (error) => {
        this.logger.error('Redis连接错误:', error.message);
        this.isRedisAvailable = false;
      });

      this.redis.on('connect', () => {
        this.logger.log('Redis连接成功');
        this.isRedisAvailable = true;
      });
    } catch (error) {
      this.logger.error('Redis初始化失败:', error.message);
      this.isRedisAvailable = false;
      this.redis = null;
    }
  }

  async onModuleInit() {
    // 应用启动时进行缓存预热
    await this.warmupCache();
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isRedisAvailable) return null;
    
    try {
      const data = await this.redis?.get(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      this.logger.error(`获取缓存失败 [${key}]:`, error.message);
      return null;
    }
  }

  async mget(keys: string[]): Promise<Array<any | null>> {
    if (!this.isRedisAvailable) return new Array(keys.length).fill(null);
    
    try {
      const data = await this.redis?.mget(keys);
      return data?.map(item => item ? JSON.parse(item) : null) || [];
    } catch (error) {
      this.logger.error(`批量获取缓存失败:`, error.message);
      return new Array(keys.length).fill(null);
    }
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    if (!this.isRedisAvailable) return;
    
    try {
      await this.redis?.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (error) {
      this.logger.error(`设置缓存失败 [${key}]:`, error.message);
    }
  }

  async mset(keyValues: { key: string; value: any; ttl?: number }[]): Promise<void> {
    if (!this.isRedisAvailable) return;
    
    try {
      const pipeline = this.redis?.pipeline();
      keyValues.forEach(({ key, value, ttl }) => {
        pipeline?.set(key, JSON.stringify(value), 'EX', ttl || this.defaultTTL);
      });
      await pipeline?.exec();
    } catch (error) {
      this.logger.error(`批量设置缓存失败:`, error.message);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isRedisAvailable) return;
    
    try {
      await this.redis?.del(key);
    } catch (error) {
      this.logger.error(`删除缓存失败 [${key}]:`, error.message);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.isRedisAvailable) return;
    
    try {
      const keys = await this.redis?.keys(pattern);
      if (keys?.length) {
        await this.redis?.del(...keys);
      }
    } catch (error) {
      this.logger.error(`批量删除缓存失败 [${pattern}]:`, error.message);
    }
  }

  // 缓存预热
  async warmupCache(): Promise<void> {
    if (!this.isRedisAvailable) {
      this.logger.warn('Redis不可用，跳过缓存预热');
      return;
    }

    try {
      this.logger.log('开始缓存预热...');
      
      // 预热热门用户数据
      const popularUsers = await this.prisma.user.findMany({
        where: {
          OR: [
            { role: 'PREMIUM' },
            { role: 'LIFETIME' },
          ]
        },
        take: 100,
        orderBy: {
          createdAt: 'desc'
        }
      });

      await this.mset(
        popularUsers.map(user => ({
          key: this.getUserBasicInfoCacheKey(user.id),
          value: user,
          ttl: this.TTL.userBasic
        }))
      );

      // 预热分类数据
      const categories = await this.prisma.noteCategory.findMany();
      await this.set('categories:all', categories, this.TTL.categories);

      // 预热热门笔记
      const popularNotes = await this.prisma.note.findMany({
        where: { status: 'VISIBLE' },
        take: 20,
        orderBy: [
          { likesCount: 'desc' },
          { viewsCount: 'desc' }
        ],
        include: {
          category: true,
          user: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true
            }
          }
        }
      });

      await this.mset(
        popularNotes.map(note => ({
          key: `notes:${note.id}`,
          value: note,
          ttl: this.TTL.notes
        }))
      );

      this.logger.log('缓存预热完成');
    } catch (error) {
      this.logger.error('缓存预热失败:', error.message);
    }
  }

  // 用户列表缓存相关方法
  async getUsersListCacheKey(page: number, limit: number, filters: any): Promise<string> {
    return `users:list:${page}:${limit}:${JSON.stringify(filters)}`;
  }

  async cacheUsersList(page: number, limit: number, filters: any, data: any): Promise<void> {
    const key = await this.getUsersListCacheKey(page, limit, filters);
    await this.set(key, data, this.TTL.usersList);
  }

  async getCachedUsersList(page: number, limit: number, filters: any): Promise<any | null> {
    const key = await this.getUsersListCacheKey(page, limit, filters);
    return this.get(key);
  }

  async invalidateUsersListCache(): Promise<void> {
    await this.delByPattern('users:list:*');
  }

  // 用户基本信息缓存相关方法
  getUserBasicInfoCacheKey(userId: number): string {
    return `users:${userId}`;
  }

  async cacheUserBasicInfo(userId: number, data: any): Promise<void> {
    const key = this.getUserBasicInfoCacheKey(userId);
    await this.set(key, data, this.TTL.userBasic);
  }

  async getCachedUserBasicInfo(userId: number): Promise<any | null> {
    const key = this.getUserBasicInfoCacheKey(userId);
    return this.get(key);
  }

  async invalidateUserBasicInfo(userId: number): Promise<void> {
    const key = this.getUserBasicInfoCacheKey(userId);
    await this.del(key);
  }
} 