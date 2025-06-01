import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateMembershipProductDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(1)
  durationDays: number;

  @IsString()
  type: string;
} 