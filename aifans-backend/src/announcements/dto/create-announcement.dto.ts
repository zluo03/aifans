import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsDateString, IsInt, IsUrl, ValidateIf } from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty({ description: '公告标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '公告内容（BlockNote JSON）' })
  content: any;

  @ApiProperty({ description: '公告图片URL', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: '内容简介', required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ description: '链接地址', required: false })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiProperty({ description: '是否显示图片', default: true })
  @IsOptional()
  @IsBoolean()
  showImage?: boolean;

  @ApiProperty({ description: '是否显示简介', default: true })
  @IsOptional()
  @IsBoolean()
  showSummary?: boolean;

  @ApiProperty({ description: '是否显示链接', default: false })
  @IsOptional()
  @IsBoolean()
  showLink?: boolean;

  @ApiProperty({ description: '生效日期' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: '结束日期' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: '优先级', default: 0 })
  @IsOptional()
  @IsInt()
  priority?: number;
} 