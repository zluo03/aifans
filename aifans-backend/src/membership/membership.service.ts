import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateMembershipProductDto, 
  UpdateMembershipProductDto,
  CreateRedemptionCodeDto,
  RedeemCodeDto,
  UpdatePaymentSettingsDto,
  MembershipQueryDto
} from './dto';
import { User, Role } from '../types';

@Injectable()
export class MembershipService {
  constructor(private prisma: PrismaService) {}

  // 生成随机兑换码
  private generateRedemptionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 会员管理
  async getMembers(query: MembershipQueryDto) {
    const { page = 1, limit = 10, search, role } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      role: {
        in: [Role.PREMIUM, Role.LIFETIME]
      }
    };

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { nickname: { contains: search } },
        { email: { contains: search } }
      ];
    }

    if (role && (role === 'PREMIUM' || role === 'LIFETIME')) {
      where.role = role;
    }

    const [members, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          nickname: true,
          email: true,
          role: true,
          createdAt: true,
          premiumExpiryDate: true,
          status: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      data: members,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // 会员产品管理
  async createMembershipProduct(createDto: CreateMembershipProductDto) {
    return this.prisma.membershipProduct.create({
      data: createDto
    });
  }

  async getMembershipProducts() {
    return this.prisma.membershipProduct.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async getMembershipProduct(id: number) {
    const product = await this.prisma.membershipProduct.findUnique({
      where: { id }
    });
    if (!product) {
      throw new NotFoundException('会员产品不存在');
    }
    return product;
  }

  async updateMembershipProduct(id: number, updateDto: UpdateMembershipProductDto) {
    const product = await this.getMembershipProduct(id);
    return this.prisma.membershipProduct.update({
      where: { id },
      data: updateDto
    });
  }

  async deleteMembershipProduct(id: number) {
    const product = await this.getMembershipProduct(id);
    return this.prisma.membershipProduct.delete({
      where: { id }
    });
  }

  // 兑换码管理
  async createRedemptionCode(createDto: CreateRedemptionCodeDto) {
    let code: string;
    let isUnique = false;
    
    // 确保生成的兑换码是唯一的
    while (!isUnique) {
      code = this.generateRedemptionCode();
      const existing = await this.prisma.redemptionCode.findUnique({
        where: { code }
      });
      if (!existing) {
        isUnique = true;
      }
    }

    return this.prisma.redemptionCode.create({
      data: {
        code: code!,
        durationDays: createDto.durationDays
      }
    });
  }

  async getRedemptionCodes(query: MembershipQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.code = { contains: search };
    }

    const [codes, total] = await Promise.all([
      this.prisma.redemptionCode.findMany({
        where,
        include: {
          usedByUser: {
            select: {
              id: true,
              username: true,
              nickname: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.redemptionCode.count({ where })
    ]);

    return {
      data: codes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async redeemCode(user: User, redeemDto: RedeemCodeDto) {
    const code = await this.prisma.redemptionCode.findUnique({
      where: { code: redeemDto.code }
    });

    if (!code) {
      throw new BadRequestException('兑换码不存在');
    }

    if (code.isUsed) {
      throw new BadRequestException('兑换码已被使用');
    }

    // 查找用户最新premiumExpiryDate
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id }
    });

    const now = new Date();
    let baseDate: Date;
    if (dbUser?.premiumExpiryDate && new Date(dbUser.premiumExpiryDate) > now) {
      baseDate = new Date(dbUser.premiumExpiryDate);
    } else {
      baseDate = now;
    }
    const newExpiry = new Date(baseDate.getTime() + code.durationDays * 24 * 60 * 60 * 1000);

    // 更新用户会员状态
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        role: Role.PREMIUM,
        premiumExpiryDate: newExpiry
      }
    });

    // 标记兑换码为已使用
    await this.prisma.redemptionCode.update({
      where: { id: code.id },
      data: {
        isUsed: true,
        usedByUserId: user.id,
        usedAt: now
      }
    });

    return {
      success: true,
      message: '兑换成功',
      expiryDate: newExpiry
    };
  }

  // 会员订单管理
  async getMembershipOrders(query: MembershipQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { user: { username: { contains: search } } },
        { user: { nickname: { contains: search } } },
        { alipayTradeNo: { contains: search } }
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.paymentOrder.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              nickname: true,
              email: true
            }
          },
          product: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.paymentOrder.count({ where })
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // 支付设置管理
  async getPaymentSettings() {
    const settings = await this.prisma.paymentSettings.findFirst();
    return settings || {
      alipayAppId: '',
      alipayPrivateKey: '',
      alipayPublicKey: '',
      alipayGatewayUrl: 'https://openapi.alipay.com/gateway.do',
      isSandbox: true
    };
  }

  async updatePaymentSettings(updateDto: UpdatePaymentSettingsDto) {
    const existing = await this.prisma.paymentSettings.findFirst();
    
    if (existing) {
      return this.prisma.paymentSettings.update({
        where: { id: existing.id },
        data: updateDto
      });
    } else {
      return this.prisma.paymentSettings.create({
        data: updateDto
      });
    }
  }

  async testPaymentSettings() {
    const settings = await this.getPaymentSettings();
    
    // 这里可以添加支付宝API测试逻辑
    // 暂时返回模拟结果
    if (!settings.alipayAppId || !settings.alipayPrivateKey) {
      return {
        success: false,
        message: '支付配置不完整'
      };
    }

    return {
      success: true,
      message: '支付配置测试成功'
    };
  }
} 