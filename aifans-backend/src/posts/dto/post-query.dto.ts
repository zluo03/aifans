import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PostType } from '../../types/prisma-enums';

export class PostQueryDto {
  @ApiProperty({
    description: '页码',
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码必须大于0' })
  page?: number = 1;

  @ApiProperty({
    description: '每页数量',
    default: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量必须大于0' })
  limit?: number = 20;

  @ApiProperty({
    description: '按类型筛选',
    enum: PostType,
    required: false,
  })
  @IsOptional()
  @IsEnum(PostType, { message: '类型必须是IMAGE或VIDEO' })
  type?: PostType;

  @ApiProperty({
    description: '按AI平台ID筛选',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'AI平台ID必须是整数' })
  aiPlatformId?: number;

  @ApiProperty({
    description: '按多个AI平台ID筛选（OR查询）',
    required: false,
    type: [Number],
    example: [1, 2, 3]
  })
  @IsOptional()
  @Transform(({ value }) => {
    // 处理数组格式的平台ID
    if (Array.isArray(value)) {
      return value.map(id => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0);
    }
    // 处理逗号分隔的字符串格式
    if (typeof value === 'string' && value.includes(',')) {
      return value.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id) && id > 0);
    }
    // 处理单个ID
    if (typeof value === 'string' || typeof value === 'number') {
      const id = parseInt(value.toString(), 10);
      return !isNaN(id) && id > 0 ? [id] : [];
    }
    return value;
  })
  aiPlatformIds?: number[];

  @ApiProperty({
    description: '搜索关键词 (搜索提示词、描述、用户名或AI平台)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string;
  
  @ApiProperty({
    description: '按用户ID筛选',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '用户ID必须是整数' })
  userId?: number;
  
  @ApiProperty({
    description: '排序方式',
    enum: ['newest', 'oldest', 'popular', 'views', 'favorites'],
    default: 'newest',
    required: false,
  })
  @IsOptional()
  @IsEnum(['newest', 'oldest', 'popular', 'views', 'favorites'], { message: '排序方式无效' })
  order?: string = 'newest';
  
  @ApiProperty({
    description: '仅显示当前用户收藏的作品',
    default: false,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  @IsBoolean({ message: '仅收藏标识必须是布尔值' })
  onlyFavorites?: boolean = false;
  
  @ApiProperty({
    description: '仅显示当前用户上传的作品',
    default: false,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  @IsBoolean({ message: '仅我的作品标识必须是布尔值' })
  onlyMyPosts?: boolean = false;
}