import { IsNumber, Min } from 'class-validator';

export class CreateRedemptionCodeDto {
  @IsNumber()
  @Min(1)
  durationDays: number;
} 