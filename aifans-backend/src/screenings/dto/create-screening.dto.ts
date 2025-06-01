import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateScreeningDto {
  @ApiProperty({ description: '放映视频标题' })
  @IsNotEmpty({ message: '标题不能为空' })
  @IsString({ message: '标题必须是字符串' })
  title: string;

  @ApiProperty({ description: '放映视频描述', required: false })
  @IsOptional()
  @IsString({ message: '描述必须是字符串' })
  description?: string;

  @ApiProperty({ description: '创作者ID', required: false })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @IsInt({ message: '创作者ID必须是整数' })
  creatorId?: number;
} 