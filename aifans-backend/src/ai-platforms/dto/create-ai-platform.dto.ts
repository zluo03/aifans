import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AIPlatformType } from '../../types/prisma-enums';

export class CreateAIPlatformDto {
  @ApiProperty({
    description: 'AI平台名称',
    example: 'Midjourney',
  })
  @IsNotEmpty({ message: '平台名称不能为空' })
  @IsString({ message: '平台名称必须是字符串' })
  name: string;

  @ApiProperty({
    description: 'AI平台Logo URL',
    example: 'https://cdn.example.com/logos/midjourney.png',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Logo URL必须是字符串' })
  logoUrl?: string;

  @ApiProperty({
    description: 'AI平台类型',
    enum: AIPlatformType,
    example: 'IMAGE',
  })
  @IsNotEmpty({ message: '平台类型不能为空' })
  @IsEnum(AIPlatformType, { message: '平台类型必须是IMAGE或VIDEO' })
  type: AIPlatformType;
} 