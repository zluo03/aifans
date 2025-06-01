import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateResourceCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
} 