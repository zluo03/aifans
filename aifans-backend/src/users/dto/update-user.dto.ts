import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: '用户昵称',
    example: '新昵称',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  nickname?: string;

  @ApiProperty({
    description: '用户头像URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '头像URL必须是字符串' })
  avatarUrl?: string;

  @ApiProperty({
    description: '用户邮箱',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email?: string;
  
  @ApiProperty({
    description: '微信头像URL',
    example: 'https://example.com/wechat-avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '微信头像URL必须是字符串' })
  wechatAvatar?: string;
} 