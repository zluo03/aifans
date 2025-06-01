import { Prisma, User } from '@prisma/client';

/**
 * Prisma模型与数据库字段不一致的情况下，使用此类型扩展
 */

/**
 * 用户模型，将password字段映射为passwordHash
 */
export interface UserWithPasswordHash extends Omit<User, 'password'> {
  passwordHash: string;
}

// 扩展Prisma用户查询类型
declare global {
  namespace PrismaJson {
    interface UserGetPayload {
      passwordHash?: string;
      password?: string;
    }
  }
}

// 类型转换辅助函数
export function mapUserPasswordField(user: User): UserWithPasswordHash {
  // 深拷贝用户对象，避免修改原对象
  const userCopy = JSON.parse(JSON.stringify(user));
  
  // 检查用户对象是否包含passwordHash字段
  const hasPasswordHash = Object.prototype.hasOwnProperty.call(userCopy, 'passwordHash');
  
  // 如果已经有passwordHash字段，返回当前对象
  if (hasPasswordHash) {
    return userCopy as UserWithPasswordHash;
  }
  
  // 如果存在password字段，则映射为passwordHash
  const hasPassword = Object.prototype.hasOwnProperty.call(userCopy, 'password');
  if (hasPassword) {
    const { password, ...rest } = userCopy;
    return {
      ...rest,
      passwordHash: password
    };
  }
  
  // 如果既没有password也没有passwordHash，返回空密码
  return {
    ...userCopy,
    passwordHash: ''
  };
}

// 批量转换用户数组
export function mapUsersPasswordField(users: User[]): UserWithPasswordHash[] {
  return users.map(mapUserPasswordField);
}

/**
 * 将包含passwordHash的数据适配成Prisma期望的passwordHash字段
 * 用于创建用户时处理密码字段
 */
export function adaptUserCreateInput(data: any): any {
  // 移除updatedAt字段，因为创建时不需要
  const { updatedAt, ...dataWithoutUpdatedAt } = data;
  
  if (dataWithoutUpdatedAt.passwordHash) {
    // Prisma schema使用的是passwordHash字段，直接返回，但要添加updatedAt
    return {
      ...dataWithoutUpdatedAt,
      updatedAt: new Date()
    };
  }
  
  // 如果传入的是password字段，映射为passwordHash
  if (dataWithoutUpdatedAt.password) {
    const { password, ...rest } = dataWithoutUpdatedAt;
    return {
      ...rest,
      passwordHash: password,
      updatedAt: new Date()
    };
  }
  
  return {
    ...dataWithoutUpdatedAt,
    updatedAt: new Date()
  };
}

/**
 * 将包含passwordHash的数据适配成Prisma期望的passwordHash字段
 * 用于更新用户时处理密码字段
 */
export function adaptUserUpdateInput(data: any): any {
  if (data.passwordHash) {
    // Prisma schema使用的是passwordHash字段，保持原样
    return {
      ...data,
      updatedAt: new Date()
    };
  }
  
  // 如果传入的是password字段，映射为passwordHash
  if (data.password) {
    const { password, ...rest } = data;
    return {
      ...rest,
      passwordHash: password,
      updatedAt: new Date()
    };
  }
  
  return {
    ...data,
    updatedAt: new Date()
  };
} 