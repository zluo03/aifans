import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { RequestPriority, RequestStatus } from '../../types/prisma-enums';

export class UpdateRequestDto {
  @ApiProperty({
    description: '需求标题',
    example: '需要一位AI图像生成专家',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '标题必须是字符串' })
  title?: string;

  @ApiProperty({
    description: '需求内容',
    example: '我需要一位擅长AI图像生成的专家，帮助我优化提示词和生成高质量图片。',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '内容必须是字符串' })
  content?: string;

  @ApiProperty({
    description: '需求分类ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: '分类ID必须是整数' })
  categoryId?: number;

  @ApiProperty({
    description: '需求优先级',
    enum: RequestPriority,
    required: false,
  })
  @IsOptional()
  @IsEnum(RequestPriority, { message: '优先级必须是有效值' })
  priority?: RequestPriority;

  @ApiProperty({
    description: '需求状态',
    enum: RequestStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(RequestStatus, { message: '状态必须是有效值' })
  status?: RequestStatus;

  @ApiProperty({
    description: '预算',
    example: 200,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: '预算必须是数字' })
  budget?: number;
} 