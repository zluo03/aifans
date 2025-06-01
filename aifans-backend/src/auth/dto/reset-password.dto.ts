import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: '密码重置令牌',
    example: 'abc123def456',
  })
  @IsNotEmpty({ message: '请提供重置令牌' })
  @IsString()
  token: string;

  @ApiProperty({
    description: '新密码',
    example: 'newPassword123',
  })
  @IsNotEmpty({ message: '请提供新密码' })
  @IsString()
  @MinLength(8, { message: '密码至少需要8个字符' })
  newPassword: string;
} 