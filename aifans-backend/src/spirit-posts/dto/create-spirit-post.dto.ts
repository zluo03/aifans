import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSpiritPostDto {
  @ApiProperty({ description: '灵贴标题', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: '灵贴内容' })
  @IsString()
  @IsNotEmpty()
  content: string;
} 