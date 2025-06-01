import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateResourceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  content: any; // JSON content from editor

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsInt()
  categoryId: number;
} 