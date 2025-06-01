// 不再需要前端加密，密码将以明文发送到后端
// 后端会使用 bcrypt 进行安全的密码加密和验证
export const encryptPassword = (password: string): string => {
  return password;
}; 