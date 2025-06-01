import { PartialType } from '@nestjs/swagger';
import { CreateSpiritPostDto } from './create-spirit-post.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSpiritPostDto extends PartialType(CreateSpiritPostDto) {
  @ApiProperty({ description: '是否隐藏', required: false })
  @IsBoolean()
  @IsOptional()
  isHidden?: boolean;
} 