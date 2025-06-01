import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { RequestPriority } from '../../types/prisma-enums';

export class CreateRequestDto {
  @ApiProperty({
    description: '需求标题',
    example: '需要一位AI图像生成专家',
  })
  @IsNotEmpty({ message: '标题不能为空' })
  @IsString({ message: '标题必须是字符串' })
  title: string;

  @ApiProperty({
    description: '需求内容',
    example: '我需要一位擅长AI图像生成的专家，帮助我优化提示词和生成高质量图片。',
  })
  @IsNotEmpty({ message: '内容不能为空' })
  @IsString({ message: '内容必须是字符串' })
  content: string;

  @ApiProperty({
    description: '需求分类ID',
    example: 1,
  })
  @IsNotEmpty({ message: '分类不能为空' })
  @IsInt({ message: '分类ID必须是整数' })
  categoryId: number;

  @ApiProperty({
    description: '需求优先级',
    enum: RequestPriority,
    default: RequestPriority.NORMAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(RequestPriority, { message: '优先级必须是有效值' })
  priority?: RequestPriority;

  @ApiProperty({
    description: '预算(可选)',
    example: 200,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: '预算必须是数字' })
  budget?: number;
} 