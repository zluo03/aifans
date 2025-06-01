import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/payment.dto';
import { AlipaySdk } from 'alipay-sdk';
import { AlipayConfig } from './alipay.config';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  private alipaySdk: AlipaySdk | null = null;
  private readonly logger = new Logger(PaymentsService.name);
  private readonly testMode: boolean = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly alipayConfig: AlipayConfig,
    private readonly configService: ConfigService
  ) {
    // 检查是否使用测试模式
    this.testMode = this.configService.get<string>('NODE_ENV') !== 'production';
    
    // 检查支付宝配置是否完整
    if (this.alipayConfig.appId && this.alipayConfig.privateKey && this.alipayConfig.alipayPublicKey) {
      // 初始化支付宝 SDK
      this.alipaySdk = new AlipaySdk({
        appId: this.alipayConfig.appId,
        privateKey: this.alipayConfig.privateKey,
        alipayPublicKey: this.alipayConfig.alipayPublicKey,
        gateway: 'https://openapi.alipay.com/gateway.do',
        signType: 'RSA2',
      });
      this.logger.log('支付宝SDK初始化成功');
    } else if (this.testMode) {
      this.logger.warn('支付宝配置不完整，启用测试模式，将使用模拟支付');
    } else {
      this.logger.warn('支付宝配置不完整，支付功能将不可用');
    }
  }

  async createOrder(userId: number, createOrderDto: CreateOrderDto) {
    this.logger.log(`创建订单: 用户ID=${userId}, 产品ID=${createOrderDto.productId}`);
    
    // 查询产品信息
    const product = await this.prisma.membershipProduct.findUnique({
      where: { id: createOrderDto.productId },
    });
    
    if (!product) {
      throw new NotFoundException('会员产品不存在');
    }
    
    // 创建订单记录
    const order = await this.prisma.paymentOrder.create({
      data: {
        userId,
        productId: product.id,
        amount: product.price.toNumber(),
        status: 'PENDING',
      },
      include: {
        product: true,
      },
    });

    // 测试模式下返回模拟支付URL
    if (this.testMode && !this.alipaySdk) {
      this.logger.log('使用测试模式创建订单');
      return {
        orderId: order.id,
        paymentUrl: `http://localhost:3000/api/payments/mock-pay?orderId=${order.id}`,
      };
    }
    
    // 检查支付宝SDK是否已初始化
    if (!this.alipaySdk) {
      throw new BadRequestException('支付宝服务未配置，无法创建订单');
    }

    // 生成支付宝支付参数
    try {
      const result = await this.alipaySdk.exec('alipay.trade.page.pay', {
        method: 'GET',
        bizContent: {
          outTradeNo: `ORDER_${order.id}`,
          productCode: 'FAST_INSTANT_TRADE_PAY',
          totalAmount: order.amount.toString(),
          subject: `AI灵感社 - ${product.title}`,
          body: product.description || '会员购买',
        },
        returnUrl: `${this.alipayConfig.returnUrl}?orderId=${order.id}`,
        notifyUrl: this.alipayConfig.notifyUrl,
      });

      return {
        orderId: order.id,
        paymentUrl: result,
      };
    } catch (error) {
      this.logger.error(`创建支付失败: ${error.message}`, error.stack);
      
      // 更新订单状态为失败
      await this.prisma.paymentOrder.update({
        where: { id: order.id },
        data: { status: 'FAILED' },
      });
      
      throw new BadRequestException('创建支付失败: ' + error.message);
    }
  }

  async handleAlipayNotification(notifyData: any) {
    // 测试模式下，模拟验证成功
    if (this.testMode && !this.alipaySdk) {
      this.logger.log('测试模式：模拟支付宝通知验证');
      return { success: true, message: '测试模式' };
    }
    
    // 检查支付宝SDK是否已初始化
    if (!this.alipaySdk) {
      this.logger.error('支付宝服务未配置，无法处理通知');
      return { success: false, message: '支付宝服务未配置' };
    }

    // 验证支付宝异步通知
    const isValid = this.alipaySdk.checkNotifySign(notifyData);
    if (!isValid) {
      this.logger.warn('支付宝通知签名验证失败');
      return { success: false, message: '签名验证失败' };
    }

    // 提取订单号和交易状态
    const outTradeNo = notifyData.out_trade_no;
    const tradeStatus = notifyData.trade_status;
    const alipayTradeNo = notifyData.trade_no;

    // 从订单号中提取我们的订单ID
    const orderId = parseInt(outTradeNo.replace('ORDER_', ''));
    
    if (isNaN(orderId)) {
      this.logger.warn(`无效的订单号: ${outTradeNo}`);
      return { success: false, message: '无效的订单号' };
    }

    this.logger.log(`支付宝通知: 订单ID=${orderId}, 交易状态=${tradeStatus}`);
    
    // 查询订单
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        product: true,
      },
    });
    
    if (!order) {
      this.logger.warn(`订单不存在: ${orderId}`);
      return { success: false, message: '订单不存在' };
    }
    
    // 处理交易状态
    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      // 如果订单已经是成功状态，避免重复处理
      if (order.status === 'SUCCESS') {
        return { success: true, message: '订单已处理' };
      }
      
      // 更新订单状态
      await this.prisma.paymentOrder.update({
        where: { id: orderId },
        data: {
          status: 'SUCCESS',
          alipayTradeNo,
        },
      });
      
      // 更新用户会员状态
      const { durationDays, type } = order.product;
      const userRole = type === 'LIFETIME' ? 'LIFETIME' : 'PREMIUM';
      
      // 计算会员过期时间
      let premiumExpiryDate: Date | null = null;
      if (durationDays > 0) {
        premiumExpiryDate = new Date();
        premiumExpiryDate.setDate(premiumExpiryDate.getDate() + durationDays);
      }
      
      // 更新用户信息
      await this.prisma.user.update({
        where: { id: order.userId },
        data: {
          role: userRole,
          premiumExpiryDate,
        },
      });
      
      this.logger.log(`用户 ${order.userId} 已升级为 ${userRole}, 过期时间: ${premiumExpiryDate}`);
      return { success: true, message: '订单处理成功' };
    } else if (tradeStatus === 'TRADE_CLOSED') {
      // 更新订单状态为失败
      await this.prisma.paymentOrder.update({
        where: { id: orderId },
        data: {
          status: 'FAILED',
          alipayTradeNo,
        },
      });
      
      return { success: true, message: '订单已关闭' };
    }

    return { success: true, message: '订单状态已记录' };
  }

  // 模拟支付完成（仅在测试模式下使用）
  async mockPaymentSuccess(orderId: number) {
    if (!this.testMode) {
      throw new BadRequestException('此功能仅在测试模式下可用');
    }
    
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        product: true,
      },
    });
    
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    
    if (order.status === 'SUCCESS') {
      return { success: true, message: '订单已处理' };
    }
    
    // 更新订单状态
    await this.prisma.paymentOrder.update({
      where: { id: orderId },
      data: {
        status: 'SUCCESS',
        alipayTradeNo: `MOCK_${Date.now()}`,
      },
    });
    
    // 更新用户会员状态
    const { durationDays, type } = order.product;
    const userRole = type === 'LIFETIME' ? 'LIFETIME' : 'PREMIUM';
    
    // 计算会员过期时间
    let premiumExpiryDate: Date | null = null;
    if (durationDays > 0) {
      premiumExpiryDate = new Date();
      premiumExpiryDate.setDate(premiumExpiryDate.getDate() + durationDays);
    }
    
    // 更新用户信息
    await this.prisma.user.update({
      where: { id: order.userId },
      data: {
        role: userRole,
        premiumExpiryDate,
      },
    });
    
    this.logger.log(`[测试] 用户 ${order.userId} 已升级为 ${userRole}, 过期时间: ${premiumExpiryDate}`);
    return { success: true, message: '测试支付成功' };
  }

  async getOrderStatus(orderId: number, userId: number) {
    // 查询订单
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: orderId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
      },
    });
    
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    
    // 验证用户权限
    if (order.userId !== userId) {
      throw new UnauthorizedException('无权访问此订单');
    }
    
    return {
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      product: {
        id: order.product.id,
        title: order.product.title,
        price: order.product.price,
      },
      createdAt: order.createdAt,
    };
  }

  // 定时任务：每天凌晨1点检查过期的高级会员，并将其降级为普通会员
  @Cron('0 0 1 * * *')
  async checkExpiredMemberships() {
    const now = new Date();
    this.logger.log('检查过期会员...');
    
    // 查找过期的会员用户
    const expiredUsers = await this.prisma.user.findMany({
      where: {
        role: 'PREMIUM',
        premiumExpiryDate: {
          lt: now,
        },
      },
    });
    
    if (expiredUsers.length === 0) {
      this.logger.log('没有发现过期会员');
      return;
    }
    
    // 批量更新过期用户的角色
    const updateResult = await this.prisma.user.updateMany({
      where: {
        id: {
          in: expiredUsers.map(user => user.id),
        },
      },
      data: {
        role: 'NORMAL',
        premiumExpiryDate: null,
      },
    });
    
    this.logger.log(`已将 ${updateResult.count} 个过期会员降级为普通用户`);
  }
} 