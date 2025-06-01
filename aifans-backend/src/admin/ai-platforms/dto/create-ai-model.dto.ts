import { IsNotEmpty, IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAIModelDto {
  @ApiProperty({ description: '模型名称' })
  @IsNotEmpty({ message: '模型名称不能为空' })
  @IsString({ message: '模型名称必须是字符串' })
  name: string;

  @ApiProperty({ description: 'AI平台ID' })
  @IsNotEmpty({ message: 'AI平台ID不能为空' })
  @IsInt({ message: 'AI平台ID必须是整数' })
  aiPlatformId: number;
} 