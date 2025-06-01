import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageConfig {
  readonly isOssEnabled: boolean;
  readonly ossRegion: string;
  readonly ossAccessKeyId: string;
  readonly ossAccessKeySecret: string;
  readonly ossBucket: string;
  readonly ossCdnDomain: string;

  constructor(private configService: ConfigService) {
    this.isOssEnabled = this.configService.get<boolean>('STORAGE_USE_OSS') === true;
    this.ossRegion = this.configService.get<string>('OSS_REGION') || '';
    this.ossAccessKeyId = this.configService.get<string>('OSS_ACCESS_KEY_ID') || '';
    this.ossAccessKeySecret = this.configService.get<string>('OSS_ACCESS_KEY_SECRET') || '';
    this.ossBucket = this.configService.get<string>('OSS_BUCKET') || '';
    this.ossCdnDomain = this.configService.get<string>('OSS_CDN_DOMAIN') || '';
  }
} 