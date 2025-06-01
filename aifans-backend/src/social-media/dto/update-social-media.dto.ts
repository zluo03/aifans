import { PartialType } from '@nestjs/swagger';
import { CreateSocialMediaDto } from './create-social-media.dto';
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSocialMediaDto extends PartialType(CreateSocialMediaDto) {
  @ApiProperty({ description: 'Logo图片URL', required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ description: '二维码图片URL', required: false })
  @IsOptional()
  @IsString()
  qrCodeUrl?: string;
} 