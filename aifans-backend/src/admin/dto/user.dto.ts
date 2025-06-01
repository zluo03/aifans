import { IsString, IsEmail, IsOptional, IsEnum, IsISO8601, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// 用户角色和状态枚举
export enum UserRole {
  NORMAL = 'NORMAL',
  PREMIUM = 'PREMIUM',
  LIFETIME = 'LIFETIME',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  MUTED = 'MUTED',
  BANNED = 'BANNED',
}

// 创建用户DTO
export class CreateUserDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  username: string;

  @ApiProperty({ description: '昵称' })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty({ description: '邮箱' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: '用户角色', enum: UserRole, default: UserRole.NORMAL })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ description: '用户状态', enum: UserStatus, default: UserStatus.ACTIVE })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiProperty({ description: '高级会员过期时间', required: false })
  @IsISO8601()
  @IsOptional()
  premiumExpiryDate?: string;
}

// 更新用户状态DTO
export class UpdateUserStatusDto {
  @ApiProperty({ description: '用户状态', enum: UserStatus })
  @IsEnum(UserStatus)
  status: UserStatus;
}

// 更新用户角色DTO
export class UpdateUserRoleDto {
  @ApiProperty({ description: '用户角色', enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ description: '高级会员过期时间', required: false })
  @IsISO8601()
  @IsOptional()
  premiumExpiryDate?: string;
} 