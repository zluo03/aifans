import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  // 用户可以使用email或username登录
  @ApiProperty({
    description: '登录凭证（邮箱或用户名）',
    example: 'john@example.com',
  })
  @IsNotEmpty({ message: '请提供用户名或邮箱' })
  @IsString()
  login: string; // email或username

  @ApiProperty({
    description: '密码',
    example: 'password123',
  })
  @IsNotEmpty({ message: '请提供密码' })
  @IsString()
  password: string;

  @ApiProperty({
    description: '图形验证码ID',
    example: 'uuid-captcha-id',
  })
  @IsNotEmpty({ message: '请提供验证码ID' })
  @IsString()
  captchaId: string;

  @ApiProperty({
    description: '图形验证码',
    example: 'A2B3',
  })
  @IsNotEmpty({ message: '请提供验证码' })
  @IsString()
  captcha: string;
} 