import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateUserMessageDto {
  @ApiProperty() @IsNotEmpty() @IsNumber() receiverId: number;
  @ApiProperty() @IsNotEmpty() @IsString() content: string;
}

export class UserMessageResponseDto {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  read: boolean;
  createdAt: Date;
  sender?: {
    id: number;
    nickname: string;
    avatarUrl: string;
  };
  receiver?: {
    id: number;
    nickname: string;
    avatarUrl: string;
  };
} 