import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: '用户名（唯一）',
    example: 'johndoe',
  })
  @IsNotEmpty({ message: '请提供用户名' })
  @IsString()
  username: string;

  @ApiProperty({
    description: '昵称',
    example: 'John Doe',
  })
  @IsString()
  nickname: string;

  @ApiProperty({
    description: '邮箱（唯一）',
    example: 'john@example.com',
  })
  @IsNotEmpty({ message: '请提供邮箱' })
  @IsEmail({}, { message: '请提供有效的邮箱地址' })
  email: string;

  @ApiProperty({
    description: '密码',
    example: 'password123',
  })
  @IsNotEmpty({ message: '请提供密码' })
  @IsString()
  password: string;

  @ApiProperty({
    description: '邮箱验证码',
    example: '123456',
  })
  @IsNotEmpty({ message: '请提供邮箱验证码' })
  @IsString()
  verificationCode: string;
} 