import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSensitiveWordDto {
  @ApiProperty({ description: '敏感词内容' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  word: string;
} 