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
    this.returnUrl = this.configService.get<string>('ALIPAY_RETURN_URL', 'http://localhost:3000/membership/payment-result');
    this.notifyUrl = this.configService.get<string>('ALIPAY_NOTIFY_URL', 'http://localhost:3000/api/payments/alipay-notify');
  }
} 