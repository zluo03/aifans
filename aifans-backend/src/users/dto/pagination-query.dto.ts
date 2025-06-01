import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EntityType } from '../../types/prisma-enums';

export class PaginationQueryDto {
  @ApiProperty({
    description: '页码',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码最小为1' })
  page?: number;

  @ApiProperty({
    description: '每页条数',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页条数必须是整数' })
  @Min(1, { message: '每页条数最小为1' })
  @Max(100, { message: '每页条数最大为100' })
  limit?: number;

  @ApiProperty({
    description: '实体类型',
    enum: EntityType,
    required: false,
  })
  @IsOptional()
  @IsEnum(EntityType, { message: '实体类型必须是有效值' })
  entityType?: EntityType;
} 