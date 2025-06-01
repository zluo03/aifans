import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAIModelDto {
  @ApiProperty({ description: '模型名称', required: false })
  @IsOptional()
  @IsString({ message: '模型名称必须是字符串' })
  name?: string;
} 