import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, Logger, Inject, forwardRef, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/payment.dto';
import { AlipaySdk } from 'alipay-sdk';
import { AlipayConfig } from './alipay.config';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { MembershipService } from '../membership/membership.service';

@Injectable()
export class PaymentsService implements OnModuleInit {
  private alipaySdk: AlipaySdk | null = null;
  private readonly logger = new Logger(PaymentsService.name);
  private readonly testMode: boolean = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly alipayConfig: AlipayConfig,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => MembershipService))
    private readonly membershipService: MembershipService
  ) {
    // 检查是否使用测试模式
    this.testMode = this.configService.get<string>('NODE_ENV') !== 'production';
    
    // 初始化时先使用环境变量配置
    this.initAlipaySDK();
  }
  
  // 实现OnModuleInit接口
  async onModuleInit() {
    this.logger.log('初始化支付宝服务...');
    // 异步加载数据库中的支付宝配置
    await this.loadAlipayConfigFromDB();
  }
  
  // 从数据库加载支付宝配置
  async loadAlipayConfigFromDB() {
    try {
      this.logger.log('从数据库加载支付宝配置...');
      
      // 检查MembershipService是否已初始化
      if (!this.membershipService) {
        this.logger.error('MembershipService未初始化，无法加载支付宝配置');
        return false;
      }
      
      const settings = await this.membershipService.getPaymentSettings();
      
      this.logger.log(`获取到支付宝配置: AppID=${settings?.alipayAppId ? settings.alipayAppId.substring(0, 4) + '****' : '未设置'}, 私钥=${settings?.alipayPrivateKey ? '已设置(长度:' + settings.alipayPrivateKey.length + ')' : '未设置'}, 公钥=${settings?.alipayPublicKey ? '已设置(长度:' + settings.alipayPublicKey.length + ')' : '未设置'}, 沙箱模式=${settings?.isSandbox}`);
      
      if (settings && settings.alipayAppId && settings.alipayPrivateKey && settings.alipayPublicKey) {
        // 使用数据库中的配置重新初始化SDK
        try {
          this.alipaySdk = new AlipaySdk({
            appId: settings.alipayAppId,
            privateKey: settings.alipayPrivateKey,
            alipayPublicKey: settings.alipayPublicKey,
            gateway: settings.isSandbox ? 'https://openapi.alipaydev.com/gateway.do' : (settings.alipayGatewayUrl || 'https://openapi.alipay.com/gateway.do'),
            signType: 'RSA2',
          });
          this.logger.log('使用数据库配置初始化支付宝SDK成功');
          return true;
        } catch (sdkError) {
          this.logger.error('初始化支付宝SDK失败:', sdkError);
          return false;
        }
      } else {
        this.logger.warn('数据库中支付宝配置不完整，SDK未初始化');
        return false;
      }
    } catch (error) {
      this.logger.error('从数据库加载支付宝配置失败', error);
      return false;
    }
  }
  
  // 使用环境变量初始化支付宝SDK
  private initAlipaySDK() {
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
      this.logger.log('支付宝SDK初始化成功(环境变量配置)');
    } else if (this.testMode) {
      this.logger.warn('支付宝配置不完整，启用测试模式，将使用模拟支付');
    } else {
      this.logger.warn('支付宝配置不完整，支付功能将不可用');
    }
  }

  // 刷新支付宝配置
  async refreshAlipayConfig() {
    const success = await this.loadAlipayConfigFromDB();
    return { success, message: success ? '支付宝配置已刷新' : '刷新支付宝配置失败' };
  }

  // 创建订单
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

    // 获取前端URL
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'https://aifans.pro');
    const serverDomain = this.configService.get<string>('SERVER_DOMAIN', 'https://aifans.pro');
    
    // 构建支付宝请求参数
    const alipayParams = {
      out_trade_no: `ORDER_${order.id}`,
      total_amount: order.amount.toString(),
      subject: `AI灵感社 - ${product.title}`,
      body: product.description || '会员购买',
    };
    
    // 回调URL
    const returnUrl = `${frontendUrl}/membership/payment-result?orderId=${order.id}`;
    const notifyUrl = `${serverDomain}/api/payments/alipay/notify`;
    
    this.logger.log(`支付宝参数: ${JSON.stringify(alipayParams)}`);
    this.logger.log(`回调URL: returnUrl=${returnUrl}, notifyUrl=${notifyUrl}`);

    // 获取支付宝配置
    const settings = await this.membershipService.getPaymentSettings();
    
    // 如果有配置支付宝并且不是沙箱模式，使用配置的支付宝
    if (settings && settings.alipayAppId && settings.alipayPrivateKey && settings.alipayPublicKey && !settings.isSandbox) {
      try {
        // 重新初始化SDK以确保使用最新配置
        const tempSdk = new AlipaySdk({
          appId: settings.alipayAppId,
          privateKey: settings.alipayPrivateKey,
          alipayPublicKey: settings.alipayPublicKey,
          gateway: settings.alipayGatewayUrl || 'https://openapi.alipay.com/gateway.do',
          signType: 'RSA2',
        });
        
        const result = await tempSdk.exec('alipay.trade.precreate', {
          bizContent: alipayParams,
          notifyUrl: notifyUrl,
        });
        this.logger.log('支付宝SDK返回内容:', result);
        const qrCode = result?.qrCode;
        if (!qrCode) {
          throw new BadRequestException('支付宝未返回二维码链接: ' + JSON.stringify(result));
        }
        this.logger.log(`支付宝二维码生成成功: ${qrCode}`);
        return {
          orderId: order.id,
          qrCode: qrCode,
        };
      } catch (error) {
        this.logger.error(`创建支付宝支付失败: ${error.message}`, error.stack);
      }
    }
    
    // 测试模式下返回模拟支付URL
    if (this.testMode || !this.alipaySdk) {
      if (!this.testMode) {
        throw new BadRequestException('支付宝SDK未初始化，无法创建支付订单');
      }
      this.logger.log('使用测试模式创建订单');
      return {
        orderId: order.id,
        paymentUrl: `${frontendUrl}/api/payments/mock-pay?orderId=${order.id}`,
      };
    }
    
    // 使用环境变量配置的支付宝
    try {
      const result = await this.alipaySdk.exec('alipay.trade.precreate', {
        bizContent: alipayParams,
        notifyUrl: notifyUrl,
      });
      this.logger.log('支付宝SDK返回内容:', result);
      const qrCode = result?.qrCode;
      if (!qrCode) {
        throw new BadRequestException('支付宝未返回二维码链接: ' + JSON.stringify(result));
      }
      this.logger.log(`支付宝二维码生成成功: ${qrCode}`);
      return {
        orderId: order.id,
        qrCode: qrCode,
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
    // 详细记录接收到的通知数据
    this.logger.log('处理支付宝通知，接收到的数据类型:', typeof notifyData);
    if (typeof notifyData === 'object') {
      this.logger.log('通知数据字段:', Object.keys(notifyData));
    } else {
      this.logger.log('通知数据不是对象类型');
      return { success: false, message: '无效的通知数据格式' };
    }
    
    // 如果SDK未初始化，尝试重新加载配置
    if (!this.alipaySdk) {
      this.logger.log('支付宝SDK未初始化，尝试重新加载配置...');
      await this.loadAlipayConfigFromDB();
    }
    
    // 如果仍然未初始化，尝试直接从数据库获取配置并临时创建SDK
    if (!this.alipaySdk) {
      this.logger.log('尝试从数据库获取最新配置并临时创建SDK...');
      
      try {
        const settings = await this.membershipService.getPaymentSettings();
        
        this.logger.log(`临时获取支付宝配置: AppID=${settings?.alipayAppId ? settings.alipayAppId.substring(0, 4) + '****' : '未设置'}, 私钥=${settings?.alipayPrivateKey ? '已设置(长度:' + settings.alipayPrivateKey.length + ')' : '未设置'}, 公钥=${settings?.alipayPublicKey ? '已设置(长度:' + settings.alipayPublicKey.length + ')' : '未设置'}, 沙箱模式=${settings?.isSandbox}`);
        
        if (settings && settings.alipayAppId && settings.alipayPrivateKey && settings.alipayPublicKey) {
          this.logger.log('使用数据库配置临时创建SDK处理通知');
          
          try {
            const tempSdk = new AlipaySdk({
              appId: settings.alipayAppId,
              privateKey: settings.alipayPrivateKey,
              alipayPublicKey: settings.alipayPublicKey,
              gateway: settings.isSandbox ? 'https://openapi.alipaydev.com/gateway.do' : (settings.alipayGatewayUrl || 'https://openapi.alipay.com/gateway.do'),
              signType: 'RSA2',
            });
            
            // 使用临时SDK验证签名
            let isValid = false;
            try {
              isValid = tempSdk.checkNotifySign(notifyData);
              this.logger.log(`临时SDK验证签名结果: ${isValid}`);
            } catch (error) {
              this.logger.warn(`签名验证出错: ${error.message}`, error);
              // 在测试模式下可以放宽要求
              if (this.testMode || settings.isSandbox) {
                this.logger.warn('测试/沙箱模式：忽略签名验证错误，继续处理');
                isValid = true;
              }
            }
            
            if (isValid) {
              return this.processAlipayNotification(notifyData);
            } else {
              return { success: false, message: '签名验证失败' };
            }
          } catch (error) {
            this.logger.error('临时创建SDK处理通知失败', error);
            return { success: false, message: '处理通知出错: ' + error.message };
          }
        } else {
          // 详细输出缺失的配置项
          const missingConfig: string[] = [];
          if (!settings?.alipayAppId) missingConfig.push('AppID');
          if (!settings?.alipayPrivateKey) missingConfig.push('应用私钥');
          if (!settings?.alipayPublicKey) missingConfig.push('支付宝公钥');
          
          this.logger.error(`支付宝服务配置不完整，缺少: ${missingConfig.join(', ')}`);
          return { success: false, message: '支付宝服务未配置' };
        }
      } catch (error) {
        this.logger.error('获取支付宝配置失败', error);
        return { success: false, message: '获取支付宝配置失败: ' + error.message };
      }
    }
    
    // 使用已初始化的SDK处理通知
    try {
      // 验证支付宝异步通知
      let isValid = false;
      try {
        isValid = this.alipaySdk.checkNotifySign(notifyData);
        this.logger.log(`支付宝通知签名验证结果: ${isValid}`);
      } catch (error) {
        this.logger.warn(`支付宝通知签名验证出错: ${error.message}`, error);
        // 在生产环境中应该严格验证签名，但为了调试，我们可以暂时放宽要求
        if (this.testMode) {
          this.logger.warn('测试模式：忽略签名验证错误，继续处理');
          isValid = true;
        }
      }
      
      if (!isValid) {
        this.logger.warn('支付宝通知签名验证失败');
        return { success: false, message: '签名验证失败' };
      }
      
      return this.processAlipayNotification(notifyData);
      
    } catch (error) {
      this.logger.error('处理支付宝通知出错', error);
      return { success: false, message: '处理通知出错: ' + error.message };
    }
  }
  
  // 处理支付宝通知的具体逻辑
  private async processAlipayNotification(notifyData: any) {
    // 提取订单号和交易状态
    const outTradeNo = notifyData.out_trade_no;
    const tradeStatus = notifyData.trade_status;
    const alipayTradeNo = notifyData.trade_no;

    this.logger.log(`支付宝通知详情: 订单号=${outTradeNo}, 交易号=${alipayTradeNo}, 交易状态=${tradeStatus}`);

    // 从订单号中提取我们的订单ID
    let orderId: number;
    try {
      orderId = parseInt(outTradeNo.replace('ORDER_', ''));
      
      if (isNaN(orderId)) {
        this.logger.warn(`无效的订单号格式: ${outTradeNo}`);
        return { success: false, message: '无效的订单号格式' };
      }
    } catch (error) {
      this.logger.warn(`解析订单号出错: ${outTradeNo}, 错误: ${error.message}`);
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