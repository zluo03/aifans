import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AlipayConfig {
  public readonly appId: string;
  public readonly privateKey: string;
  public readonly alipayPublicKey: string;
  public readonly returnUrl: string;
  public readonly notifyUrl: string;

  constructor(private configService: ConfigService) {
    this.appId = this.configService.get<string>('ALIPAY_APP_ID', '');
    this.privateKey = this.configService.get<string>('ALIPAY_PRIVATE_KEY', '');
    this.alipayPublicKey = this.configService.get<string>('ALIPAY_PUBLIC_KEY', '');
    
    // 使用完整URL，从环境变量获取
    const baseUrl = this.configService.get<string>('APP_BASE_URL', '');
    const serverDomain = this.configService.get<string>('SERVER_DOMAIN', 'https://aifans.pro');
    
    // 前端URL用于用户支付完成后跳转
    this.returnUrl = this.configService.get<string>('ALIPAY_RETURN_URL', baseUrl + '/membership/payment-result');
    
    // 服务器域名用于支付宝异步通知
    this.notifyUrl = this.configService.get<string>('ALIPAY_NOTIFY_URL', serverDomain + '/api/payments/alipay/notify');
  }
} 