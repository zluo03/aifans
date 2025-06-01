import { Request } from 'express';

// 扩展Express的Request接口，添加user属性
export interface RequestWithUser extends Request {
  user: { id: number; role: string };
} 