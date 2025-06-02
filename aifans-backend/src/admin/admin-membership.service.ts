import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMembershipProductDto, UpdateMembershipProductDto } from './dto/membership.dto';
import { UpdatePaymentSettingsDto } from '../membership/dto/payment-settings.dto';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class AdminMembershipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService
  ) {}

  async findAll() {
    return this.prisma.membershipProduct.findMany({
      orderBy: {
        price: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.membershipProduct.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`ID为${id}的会员产品不存在`);
    }

    return product;
  }

  async create(createDto: CreateMembershipProductDto) {
    return this.prisma.membershipProduct.create({
      data: {
        ...createDto,
        price: typeof createDto.price === 'string' 
          ? parseFloat(createDto.price) 
          : createDto.price,
      },
    });
  }

  async update(id: number, updateDto: UpdateMembershipProductDto) {
    // 检查产品是否存在
    await this.findOne(id);

    return this.prisma.membershipProduct.update({
      where: { id },
      data: {
        ...updateDto,
        price: updateDto.price !== undefined 
          ? (typeof updateDto.price === 'string' 
            ? parseFloat(updateDto.price) 
            : updateDto.price)
          : undefined,
      },
    });
  }

  async remove(id: number) {
    // 检查产品是否存在
    await this.findOne(id);

    // 检查是否有关联的订单
    const orderCount = await this.prisma.paymentOrder.count({
      where: { productId: id },
    });

    if (orderCount > 0) {
      throw new Error(`该会员产品已有${orderCount}个关联订单，无法删除`);
    }

    await this.prisma.membershipProduct.delete({
      where: { id },
    });

    return { id, deleted: true };
  }

  async findAllOrders() {
    return this.prisma.paymentOrder.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            email: true,
            avatarUrl: true,
          },
        },
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // 支付设置相关方法
  async getPaymentSettings() {
    const settings = await this.prisma.paymentSettings.findFirst();
    const result = settings || {
      alipayAppId: '',
      alipayPrivateKey: '',
      alipayPublicKey: '',
      alipayGatewayUrl: 'https://openapi.alipay.com/gateway.do',
      isSandbox: true
    };
    
    // 隐藏敏感信息
    if (result.alipayPrivateKey) {
      result.alipayPrivateKey = '******';
    }
    
    return {
      success: true,
      data: result
    };
  }

  async updatePaymentSettings(updateDto: UpdatePaymentSettingsDto) {
    const existing = await this.prisma.paymentSettings.findFirst();
    
    // 如果提供了占位符密钥，则不更新该字段
    if (updateDto.alipayPrivateKey === '******') {
      delete updateDto.alipayPrivateKey;
    }
    
    let result;
    if (existing) {
      result = await this.prisma.paymentSettings.update({
        where: { id: existing.id },
        data: updateDto
      });
    } else {
      result = await this.prisma.paymentSettings.create({
        data: updateDto
      });
    }
    
    // 刷新支付宝配置
    await this.refreshAlipayConfig();
    
    // 隐藏敏感信息
    if (result.alipayPrivateKey) {
      result.alipayPrivateKey = '******';
    }
    
    return {
      success: true,
      message: '支付设置已更新',
      data: result
    };
  }

  async testPaymentSettings() {
    const settings = await this.prisma.paymentSettings.findFirst();
    
    if (!settings || !settings.alipayAppId || !settings.alipayPrivateKey || !settings.alipayPublicKey) {
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

  async refreshAlipayConfig() {
    return this.paymentsService.refreshAlipayConfig();
  }
} 