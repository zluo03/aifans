import { ApiProperty } from '@nestjs/swagger';
import { PostVideoCategory } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdatePostDto {
  @ApiProperty({
    description: '作品标题',
    required: false,
    example: '更新后的标题',
  })
  @IsOptional()
  @IsString({ message: '标题必须是字符串' })
  title?: string;

  @ApiProperty({
    description: 'AI平台ID',
    required: false,
    example: 2,
  })
  @IsOptional()
  @IsInt({ message: 'AI平台ID必须是整数' })
  aiPlatformId?: number;

  @ApiProperty({
    description: '使用的模型',
    required: false,
    example: 'DALLE-3',
  })
  @IsOptional()
  @IsString({ message: '模型必须是字符串' })
  modelUsed?: string;

  @ApiProperty({
    description: '提示词',
    required: false,
    example: '更新后的提示词',
  })
  @IsOptional()
  @IsString({ message: '提示词必须是字符串' })
  prompt?: string;

  @ApiProperty({
    description: '视频类别 (仅视频)',
    enum: PostVideoCategory,
    required: false,
    example: 'TEXT_TO_VIDEO',
  })
  @IsOptional()
  @IsEnum(PostVideoCategory, { message: '视频类别必须是有效的值' })
  videoCategory?: PostVideoCategory;

  @ApiProperty({
    description: '是否允许下载',
    required: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: '允许下载必须是布尔值' })
  allowDownload?: boolean;
} 