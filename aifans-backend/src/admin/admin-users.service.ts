import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UpdateUserStatusDto, UpdateUserRoleDto, CreateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { adaptUserCreateInput } from '../types/prisma-extend';
import { CacheService } from '../common/services/cache.service';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(
    paginationQuery: PaginationQueryDto,
    filters: { search?: string; role?: string; status?: string },
  ) {
    const { page = 1, limit = 10 } = paginationQuery;
    // 确保page和limit是数字类型
    const pageNum = Number(page);
    const limitNum = Number(limit);
    
    this.logger.debug(`获取用户列表: page=${pageNum}, limit=${limitNum}, filters=${JSON.stringify(filters)}`);

    // 尝试从缓存获取数据
    const cachedData = await this.cacheService.getCachedUsersList(pageNum, limitNum, filters);
    if (cachedData) {
      this.logger.debug('从缓存获取用户列表成功');
      return cachedData;
    }
    this.logger.debug('缓存未命中，从数据库获取用户列表');

    const skip = (pageNum - 1) * limitNum;

    // 构建查询条件
    const where: any = {};
    
    // 搜索条件处理
    if (filters.search) {
      where.OR = [
        { nickname: { contains: filters.search } },
        { username: { contains: filters.search } },
      ];
    }
    
    // 角色过滤
    if (filters.role && filters.role !== 'all') {
      where.role = filters.role;
    }
    
    // 状态过滤
    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }
    
    this.logger.debug(`查询条件: ${JSON.stringify(where)}`);
    
    try {
      // 查询用户列表
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limitNum,
          select: {
            id: true,
            username: true,
            nickname: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            avatarUrl: true,
            premiumExpiryDate: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      this.logger.debug(`查询到 ${users.length} 个用户，总计 ${total} 个用户`);

      const result = {
        items: users,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      // 缓存结果
      await this.cacheService.cacheUsersList(page, limit, filters, result);
      this.logger.debug('用户列表已缓存');
      
      return result;
    } catch (error) {
      this.logger.error('获取用户列表失败:', error);
      throw error;
    }
  }
  
  async updateStatus(id: number, dto: UpdateUserStatusDto) {
    // 查询用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    
    if (!user) {
      throw new NotFoundException(`ID为${id}的用户不存在`);
    }
    
    // 更新用户状态
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        status: dto.status,
      },
      select: {
        id: true,
        status: true,
      },
    });

    // 清除相关缓存
    await Promise.all([
      this.cacheService.invalidateUserBasicInfo(id),
      this.cacheService.invalidateUsersListCache(),
    ]);

    return updatedUser;
  }
  
  async updateRole(id: number, dto: UpdateUserRoleDto) {
    // 查询用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    
    if (!user) {
      throw new NotFoundException(`ID为${id}的用户不存在`);
    }
    
    // 构建更新数据
    const updateData: any = {
      role: dto.role,
    };
    
    // 如果是高级会员，设置过期时间
    if (dto.role === 'PREMIUM' && dto.premiumExpiryDate) {
      updateData.premiumExpiryDate = new Date(dto.premiumExpiryDate);
    } else if (dto.role === 'NORMAL') {
      // 如果降级为普通用户，清除过期时间
      updateData.premiumExpiryDate = null;
    }
    
    // 更新用户角色
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        role: true,
        premiumExpiryDate: true,
      },
    });

    // 清除相关缓存
    await Promise.all([
      this.cacheService.invalidateUserBasicInfo(id),
      this.cacheService.invalidateUsersListCache(),
    ]);

    return updatedUser;
  }
  
  async create(dto: CreateUserDto) {
    // 检查用户名和邮箱是否已存在
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: dto.username },
          { email: dto.email },
        ],
      },
    });
    
    if (existingUser) {
      throw new BadRequestException('用户名或邮箱已存在');
    }
    
    // 密码加密
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.password, salt);
    
    // 创建新用户
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        nickname: dto.nickname || dto.username,
        email: dto.email,
        password: hashedPassword,
        role: dto.role || 'NORMAL',
        status: dto.status || 'ACTIVE',
        premiumExpiryDate: dto.premiumExpiryDate ? new Date(dto.premiumExpiryDate) : null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // 清除用户列表缓存
    await this.cacheService.invalidateUsersListCache();
    
    return user;
  }

  async resetUserPassword(userId: number) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('123456', salt);
    
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });
  }
} 