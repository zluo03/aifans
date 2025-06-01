import { IsInt, Min, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ModuleLimitDto {
  @ApiProperty({ description: '图片最大大小(MB)', minimum: 1 })
  @IsInt()
  @Min(1)
  imageSize: number;

  @ApiProperty({ description: '视频最大大小(MB)', minimum: 1 })
  @IsInt()
  @Min(1)
  videoSize: number;
}

export class ScreeningsLimitDto {
  @ApiProperty({ description: '视频最大大小(MB)', minimum: 1 })
  @IsInt()
  @Min(1)
  videoSize: number;
}

export class CreatorLimitDto {
  @ApiProperty({ description: '图片最大大小(MB)', minimum: 1 })
  @IsInt()
  @Min(1)
  imageMaxSizeMB: number;

  @ApiProperty({ description: '视频最大大小(MB)', minimum: 1 })
  @IsInt()
  @Min(1)
  videoMaxSizeMB: number;

  @ApiProperty({ description: '音频最大大小(MB)', minimum: 1 })
  @IsInt()
  @Min(1)
  audioMaxSizeMB: number;
}

export class UploadLimitDto {
  @ApiProperty({ description: '笔记模块上传限制' })
  @IsObject()
  @ValidateNested()
  @Type(() => ModuleLimitDto)
  notes: ModuleLimitDto;

  @ApiProperty({ description: '灵感模块上传限制' })
  @IsObject()
  @ValidateNested()
  @Type(() => ModuleLimitDto)
  inspiration: ModuleLimitDto;

  @ApiProperty({ description: '影院模块上传限制' })
  @IsObject()
  @ValidateNested()
  @Type(() => ScreeningsLimitDto)
  screenings: ScreeningsLimitDto;
} 