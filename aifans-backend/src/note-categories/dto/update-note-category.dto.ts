import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class UpdateNoteCategoryDto {
  @ApiProperty({
    description: '分类名称',
    example: '编程技术',
  })
  @IsOptional()
  @IsNotEmpty({ message: '分类名称不能为空' })
  @IsString({ message: '分类名称必须是字符串' })
  @Length(1, 50, { message: '分类名称长度必须在1到50个字符之间' })
  name?: string;

  @ApiProperty({
    description: '分类描述',
    example: '编程相关的技术文章和教程',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '分类描述必须是字符串' })
  @Length(0, 500, { message: '分类描述长度不能超过500个字符' })
  description?: string;
} 