import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateSocialMediaDto {
  @ApiProperty({ description: '社交媒体名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '排序顺序', required: false, default: 0 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({ description: '是否启用', required: false, default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
} 