import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateCreatorDto {
  @ApiProperty() @IsOptional() @IsString() avatarUrl?: string;
  @ApiProperty() @IsNotEmpty() @IsString() nickname: string;
  @ApiProperty() @IsOptional() @IsString() bio?: string;
  @ApiProperty() @IsOptional() @IsString() expertise?: string;
  @ApiProperty() @IsOptional() @IsString() backgroundUrl?: string;
  @ApiProperty() @IsOptional() @IsArray() images?: any[];
  @ApiProperty() @IsOptional() @IsArray() videos?: any[];
  @ApiProperty() @IsOptional() @IsArray() audios?: any[];
} 