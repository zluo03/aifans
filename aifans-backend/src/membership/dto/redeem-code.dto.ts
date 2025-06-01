import { IsString, Length } from 'class-validator';

export class RedeemCodeDto {
  @IsString()
  @Length(16, 16)
  code: string;
} 