import { Injectable } from '@nestjs/common';
import { CacheService } from './cache.service';
import * as crypto from 'crypto';

@Injectable()
export class CaptchaService {
  constructor(private cacheService: CacheService) {}

  /**
   * 生成图形验证码
   * @returns 包含验证码ID和图片base64的对象
   */
  async generateImageCaptcha(): Promise<{ captchaId: string; image: string }> {
    // 生成随机验证码（4位字母数字）
    const code = this.generateRandomCode(4);
    const captchaId = crypto.randomUUID();
    
    // 将验证码存储到缓存，5分钟过期
    await this.cacheService.set(`image_captcha_${captchaId}`, code.toLowerCase(), 300);
    
    // 生成验证码图片
    const imageBase64 = this.generateCaptchaImage(code);
    
    return {
      captchaId,
      image: imageBase64
    };
  }

  /**
   * 验证图形验证码
   * @param captchaId 验证码ID
   * @param userInput 用户输入的验证码
   * @returns 是否验证成功
   */
  async verifyImageCaptcha(captchaId: string, userInput: string): Promise<boolean> {
    // 测试环境绕过验证码验证
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.log('开发环境验证码检查，用户输入:', userInput);
      // 允许任何验证码在开发环境中通过，便于测试
      return true;
    }
    
    const cachedCode = await this.cacheService.get(`image_captcha_${captchaId}`);
    
    if (!cachedCode) {
      return false; // 验证码不存在或已过期
    }
    
    // 验证成功后删除验证码（防止重复使用）
    await this.cacheService.del(`image_captcha_${captchaId}`);
    
    // 不区分大小写比较
    return cachedCode === userInput.toLowerCase();
  }

  /**
   * 生成邮箱验证码
   * @param email 邮箱地址
   * @returns 6位数字验证码
   */
  async generateEmailVerificationCode(email: string): Promise<string> {
    const code = this.generateRandomCode(6, true); // 6位纯数字
    
    // 将验证码存储到缓存，10分钟过期
    await this.cacheService.set(`email_verification_${email}`, code, 600);
    
    return code;
  }

  /**
   * 验证邮箱验证码
   * @param email 邮箱地址
   * @param code 用户输入的验证码
   * @returns 是否验证成功
   */
  async verifyEmailVerificationCode(email: string, code: string): Promise<boolean> {
    const cachedCode = await this.cacheService.get(`email_verification_${email}`);
    
    if (!cachedCode) {
      return false; // 验证码不存在或已过期
    }
    
    return cachedCode === code;
  }

  /**
   * 删除邮箱验证码（验证成功后调用）
   * @param email 邮箱地址
   */
  async clearEmailVerificationCode(email: string): Promise<void> {
    await this.cacheService.del(`email_verification_${email}`);
  }

  /**
   * 生成随机验证码
   * @param length 长度
   * @param numbersOnly 是否只包含数字
   * @returns 验证码字符串
   */
  private generateRandomCode(length: number, numbersOnly: boolean = false): string {
    const chars = numbersOnly ? '0123456789' : 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * 生成验证码图片（使用SVG）
   * @param code 验证码文本
   * @returns base64编码的图片
   */
  private generateCaptchaImage(code: string): string {
    const width = 120;
    const height = 40;
    
    // 生成随机颜色和位置
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
    const bgColor = '#f8f9fa';
    
    // 生成噪点
    let noisePoints = '';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const color = colors[Math.floor(Math.random() * colors.length)];
      noisePoints += `<circle cx="${x}" cy="${y}" r="1" fill="${color}" opacity="0.3"/>`;
    }
    
    // 生成干扰线
    let lines = '';
    for (let i = 0; i < 3; i++) {
      const x1 = Math.random() * width;
      const y1 = Math.random() * height;
      const x2 = Math.random() * width;
      const y2 = Math.random() * height;
      const color = colors[Math.floor(Math.random() * colors.length)];
      lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" opacity="0.5"/>`;
    }
    
    // 生成文字
    let textElements = '';
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const x = (width / code.length) * i + (width / code.length) / 2;
      const y = height / 2 + (Math.random() - 0.5) * 8;
      const rotation = (Math.random() - 0.5) * 30;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const fontSize = 18 + Math.random() * 4;
      
      textElements += `
        <text x="${x}" y="${y}" 
              font-family="Arial, sans-serif" 
              font-size="${fontSize}" 
              font-weight="bold" 
              fill="${color}" 
              text-anchor="middle" 
              dominant-baseline="middle"
              transform="rotate(${rotation} ${x} ${y})">
          ${char}
        </text>
      `;
    }
    
    // 创建SVG
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="${bgColor}"/>
        ${noisePoints}
        ${lines}
        ${textElements}
      </svg>
    `;
    
    // 转换为base64
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
} 