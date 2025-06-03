import { ApiProperty } from '@nestjs/swagger';
import { PostType } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// 定义PostVideoCategory枚举，因为Prisma中已经移除
export enum PostVideoCategory {
  IMAGE_TO_VIDEO = 'IMAGE_TO_VIDEO',
  TEXT_TO_VIDEO = 'TEXT_TO_VIDEO',
  FRAME_INTERPOLATION = 'FRAME_INTERPOLATION',
  MULTI_IMAGE_REF = 'MULTI_IMAGE_REF'
}

export class CreatePostDto {
  @ApiProperty({
    description: '作品类型',
    enum: PostType,
    example: 'IMAGE',
  })
  @IsEnum(PostType, { message: '作品类型必须是IMAGE或VIDEO' })
  type: PostType;

  @ApiProperty({
    description: '作品标题',
    required: false,
    example: '我的AI生成图片',
  })
  @IsOptional()
  @IsString({ message: '标题必须是字符串' })
  title?: string;

  @ApiProperty({
    description: 'AI平台ID',
    example: 1,
  })
  @IsNotEmpty({ message: 'AI平台ID不能为空' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      if (!isNaN(num)) return num;
    }
    return typeof value === 'number' ? value : Number(value);
  })
  @Type(() => Number)
  @IsInt({ message: 'AI平台ID必须是整数' })
  aiPlatformId: number;

  @ApiProperty({
    description: '使用的模型',
    example: 'Midjourney v6',
  })
  @IsNotEmpty({ message: '模型不能为空' })
  @IsString({ message: '模型必须是字符串' })
  modelUsed: string;

  @ApiProperty({
    description: '提示词',
    example: 'A beautiful sunset over mountains, photorealistic',
  })
  @IsNotEmpty({ message: '提示词不能为空' })
  @IsString({ message: '提示词必须是字符串' })
  prompt: string;

  @ApiProperty({
    description: '视频类别 (仅视频)',
    enum: PostVideoCategory,
    required: false,
    example: 'IMAGE_TO_VIDEO',
  })
  @IsOptional()
  @IsEnum(PostVideoCategory, { message: '视频类别必须是有效的值' })
  videoCategory?: PostVideoCategory;

  @ApiProperty({
    description: '是否允许下载',
    default: true,
    required: false,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  @IsBoolean({ message: '允许下载必须是布尔值' })
  allowDownload?: boolean;
} 