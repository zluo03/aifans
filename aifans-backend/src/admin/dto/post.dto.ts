import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PostStatus } from '../../types/prisma-enums';

// 更新帖子可见性DTO
export class UpdatePostVisibilityDto {
  @ApiProperty({ description: '帖子状态', enum: PostStatus })
  @IsEnum(PostStatus)
  status: PostStatus;
} 