/**
 * 密码规则：
 * 1. 长度至少8位
 * 2. 必须包含大小写字母和数字
 * 3. 可以包含特殊字符
 */

// 密码规则提示文本
export const PASSWORD_RULES = {
  text: '密码必须至少8位，包含大小写字母和数字',
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/
};

// 验证密码是否符合规则
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  console.log('开始验证密码规则');
  
  if (!password) {
    console.warn('密码验证失败：密码为空');
    return { isValid: false, message: '密码不能为空' };
  }

  if (password.length < 8) {
    console.warn('密码验证失败：密码长度不足8位');
    return { isValid: false, message: '密码长度不能少于8位' };
  }

  // 检查是否包含大写字母
  const hasUppercase = /[A-Z]/.test(password);
  // 检查是否包含小写字母
  const hasLowercase = /[a-z]/.test(password);
  // 检查是否包含数字
  const hasDigit = /\d/.test(password);

  console.log('密码复杂度检查:', {
    length: password.length,
    hasUppercase,
    hasLowercase,
    hasDigit,
    patternTest: PASSWORD_RULES.pattern.test(password)
  });

  if (!PASSWORD_RULES.pattern.test(password)) {
    console.warn('密码验证失败：不符合复杂度要求');
    return { isValid: false, message: PASSWORD_RULES.text };
  }

  console.log('密码验证通过');
  return { isValid: true };
} 