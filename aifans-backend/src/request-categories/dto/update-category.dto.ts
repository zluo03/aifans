import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateRequestCategoryDto {
  @ApiProperty({
    description: '分类名称',
    example: 'AI图像生成进阶',
  })
  @IsNotEmpty({ message: '分类名称不能为空' })
  @IsString({ message: '分类名称必须是字符串' })
  name: string;
} 