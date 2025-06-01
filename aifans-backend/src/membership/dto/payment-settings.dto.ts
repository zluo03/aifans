import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdatePaymentSettingsDto {
  @IsOptional()
  @IsString()
  alipayAppId?: string;

  @IsOptional()
  @IsString()
  alipayPrivateKey?: string;

  @IsOptional()
  @IsString()
  alipayPublicKey?: string;

  @IsOptional()
  @IsString()
  alipayGatewayUrl?: string;

  @IsOptional()
  @IsBoolean()
  isSandbox?: boolean;
} 