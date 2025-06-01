import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateResponseDto {
  @ApiProperty({
    description: '响应内容',
    example: '我很擅长AI图像生成，可以帮助你优化提示词并生成高质量图片。',
  })
  @IsNotEmpty({ message: '内容不能为空' })
  @IsString({ message: '内容必须是字符串' })
  content: string;

  @ApiProperty({
    description: '报价(可选)',
    example: 180,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: '报价必须是数字' })
  price?: number;

  @ApiProperty({
    description: '是否公开',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '公开状态必须是布尔值' })
  isPublic?: boolean;
} 