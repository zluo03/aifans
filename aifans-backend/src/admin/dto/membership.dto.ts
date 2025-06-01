import { IsString, IsNumber, IsInt, IsOptional, IsEnum, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum MembershipType {
  PREMIUM_MONTHLY = 'PREMIUM_MONTHLY',
  PREMIUM_QUARTERLY = 'PREMIUM_QUARTERLY',
  PREMIUM_ANNUAL = 'PREMIUM_ANNUAL',
  LIFETIME = 'LIFETIME',
}

export class CreateMembershipProductDto {
  @ApiProperty({ description: '产品标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '产品描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '产品价格' })
  @IsPositive()
  price: number;

  @ApiProperty({ description: '会员有效天数 (0表示终身)' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  durationDays: number;

  @ApiProperty({ description: '会员类型', enum: MembershipType })
  @IsEnum(MembershipType)
  type: MembershipType;
}

export class UpdateMembershipProductDto {
  @ApiProperty({ description: '产品标题', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: '产品描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '产品价格', required: false })
  @IsPositive()
  @IsOptional()
  price?: number;

  @ApiProperty({ description: '会员有效天数 (0表示终身)', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  durationDays?: number;

  @ApiProperty({ description: '会员类型', enum: MembershipType, required: false })
  @IsEnum(MembershipType)
  @IsOptional()
  type?: MembershipType;
} 