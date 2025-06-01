import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Node 18+ 原生 fetch，否则用 node-fetch 兼容
// @ts-ignore
const fetch = global.fetch || require('node-fetch');

@Injectable()
export class WechatService {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly token: string;
  private readonly encodingAESKey: string;
  private devMockStatus: Map<string, { scanned: boolean; subscribed: boolean; lastUpdate: number; }>;
  private readonly logger = new Logger(WechatService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {
    const appId = this.configService.get<string>('WECHAT_APP_ID');
    const appSecret = this.configService.get<string>('WECHAT_APP_SECRET');
    const token = this.configService.get<string>('WECHAT_TOKEN');

    if (!appId || !appSecret || !token) {
      throw new Error('微信配置信息未完整设置，请检查环境变量 WECHAT_APP_ID, WECHAT_APP_SECRET, WECHAT_TOKEN');
    }

    this.appId = appId;
    this.appSecret = appSecret;
    this.token = token;
    this.encodingAESKey = this.configService.get<string>('WECHAT_ENCODING_AES_KEY') || '';
    
    this.logger.log('微信配置信息:', {
      appId: this.appId,
      token: this.token,
      encodingAESKey: this.encodingAESKey ? '已设置' : '未设置'
    });
    
    // 初始化开发环境模拟状态
    this.devMockStatus = new Map();
  }

  // 获取微信 Token
  getToken(): string {
    return this.token;
  }

  // 验证微信服务器的签名
  verifySignature(signature: string, timestamp: string, nonce: string): boolean {
    try {
      this.logger.log('开始验证签名:', { signature, timestamp, nonce });
      const token = this.getToken();
      this.logger.log('使用的token:', token);

      if (!signature || !timestamp || !nonce) {
        this.logger.error('签名验证失败：缺少必要参数');
        return false;
      }

      // 1. 将token、timestamp、nonce三个参数进行字典序排序
      const arr = [token, timestamp, nonce].sort();
      this.logger.log('排序后的数组:', arr);

      // 2. 将三个参数字符串拼接成一个字符串进行sha1加密
      const str = arr.join('');
      this.logger.log('拼接后的字符串:', str);

      const sha1 = crypto.createHash('sha1');
      sha1.update(str);
      const generatedSignature = sha1.digest('hex');
      this.logger.log('生成的签名:', generatedSignature);
      this.logger.log('收到的签名:', signature);

      // 3. 将sha1加密后的字符串与signature对比
      const result = signature === generatedSignature;
      this.logger.log('验证结果:', result);
      return result;
    } catch (error) {
      this.logger.error('签名验证过程出错:', error);
      return false;
    }
  }

  // 获取微信登录二维码（使用固定的公众号二维码）
  async generateLoginQrCode(): Promise<{ qrCodeUrl: string }> {
    // 直接返回固定的二维码URL
    return { qrCodeUrl: '/icon/wechatlogin.png' };
  }

  // 获取服务器域名
  private getDomain(): string {
    const domain = this.configService.get<string>('server.domain') || process.env.SERVER_DOMAIN;
    if (!domain) {
      throw new Error('服务器域名未配置，请检查环境变量 SERVER_DOMAIN');
    }
    return domain;
  }

  // 获取微信回调URL
  private getCallbackUrl(): string {
    return `${this.getDomain()}/api/auth/wechat`;
  }

  // 检查登录状态
  async checkLoginStatus(openId: string) {
    try {
      console.log('检查登录状态，openId:', openId);
      
      // 查询用户
      let user: any = null;
      try {
        // 先检查是否是临时openId
        if (openId.startsWith('tmp_')) {
          user = await this.prisma.user.findFirst({
            where: { tempOpenId: openId }
          });
        }
        
        // 如果没找到，再用wechatOpenId查找
        if (!user) {
        user = await this.prisma.user.findFirst({
        where: { wechatOpenId: openId }
      });
        }
        
        console.log('查询用户结果:', user ? '找到用户' : '未找到用户');
      } catch (dbError) {
        console.error('数据库查询失败:', dbError);
        return { isLoggedIn: false, error: '数据库查询失败', message: '登录失败，请重试' };
        }

      if (!user) {
        console.log('未找到用户');
        return { isLoggedIn: false, message: '请关注公众号完成登录' };
      }

      // 生成JWT令牌
      try {
      const token = this.jwtService.sign({
        sub: user.id,
        username: user.username
      });

      console.log('生成 token 成功');

      return {
        isLoggedIn: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          role: user.role
        }
      };
      } catch (jwtError) {
        console.error('生成JWT令牌失败:', jwtError);
        return { isLoggedIn: false, error: '生成令牌失败', message: '登录失败，请重试' };
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
      return { isLoggedIn: false, error: '检查登录状态失败', message: '登录失败，请重试' };
    }
  }

  // 生成6位数字验证码
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 保存验证码
  private async saveVerificationCode(openId: string, code: string): Promise<void> {
    try {
      // 设置验证码5分钟后过期
      const expiredAt = new Date(Date.now() + 5 * 60 * 1000);
      
      // 将该用户之前的验证码标记为已使用
      await this.prisma.wechatVerificationCode.updateMany({
        where: { openId, used: false },
        data: { used: true }
      });

      // 保存新验证码
      await this.prisma.wechatVerificationCode.create({
        data: {
          code,
          openId,
          expiredAt,
        }
      });

      this.logger.log(`已为openId ${openId} 生成新验证码`);
    } catch (error) {
      this.logger.error('保存验证码失败:', error);
      throw error;
    }
  }

  // 验证码登录
  async verifyCode(code: string): Promise<any> {
    try {
      this.logger.log(`验证微信登录验证码: ${code}`);
      
      // 查找验证码记录
      const verificationCode = await this.prisma.wechatVerificationCode.findFirst({
        where: {
          code,
          expiredAt: {
            gt: new Date()
          },
          used: false
        }
      });
      
      if (!verificationCode) {
        this.logger.log('验证码无效或已过期');
        return { success: false, message: '验证码无效或已过期' };
      }
      
      const openId = verificationCode.openId;
      this.logger.log(`验证码有效，openId: ${openId}`);
      
      // 标记验证码为已使用
      await this.prisma.wechatVerificationCode.update({
        where: { id: verificationCode.id },
        data: { used: true }
      });
      
      // 获取微信用户信息
      let wechatUserInfo;
      try {
        wechatUserInfo = await this.getWechatUserInfo(openId);
        this.logger.log('获取微信用户信息成功:', {
          nickname: wechatUserInfo.nickname,
          headimgurl: wechatUserInfo.headimgurl ? '存在' : '不存在'
        });
      } catch (error) {
        this.logger.error('获取微信用户信息失败:', error);
        wechatUserInfo = {
          openid: openId,
          nickname: null,
          headimgurl: null
        };
      }
      
      // 查找或创建用户
      let user = await this.prisma.user.findFirst({
        where: {
          wechatOpenId: openId
        }
      });
      
      if (user) {
        this.logger.log(`找到已存在的用户，ID: ${user.id}, 状态: ${user.status}`);
        
        // 如果用户状态不是ACTIVE，更新为ACTIVE
        if (user.status !== 'ACTIVE') {
          this.logger.log(`用户状态为${user.status}，更新为ACTIVE`);
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { status: 'ACTIVE' }
          });
        }
        
        // 更新微信用户信息
        if (wechatUserInfo.nickname || wechatUserInfo.headimgurl) {
          const updateData: any = {};
          
          if (wechatUserInfo.nickname) {
            updateData.wechatNickname = wechatUserInfo.nickname;
          }
          
          if (wechatUserInfo.headimgurl) {
            updateData.wechatAvatar = wechatUserInfo.headimgurl;
            
            // 如果用户没有设置头像，使用微信头像
            if (!user.avatarUrl) {
              updateData.avatarUrl = wechatUserInfo.headimgurl;
              this.logger.log('用户没有头像，使用微信头像');
            } else {
              this.logger.log('用户已有头像，保留现有头像');
            }
          }
          
          if (Object.keys(updateData).length > 0) {
            this.logger.log(`更新用户微信信息: ${JSON.stringify(updateData)}`);
            user = await this.prisma.user.update({
              where: { id: user.id },
              data: updateData
            });
          }
        }
      } else {
        // 创建新用户
        const randomStr = crypto.randomBytes(4).toString('hex');
        this.logger.log(`创建新用户，openId: ${openId}`);
        
        user = await this.prisma.user.create({
          data: {
            username: `wx_${randomStr}`,
            nickname: wechatUserInfo.nickname || `微信用户_${randomStr}`,
            avatarUrl: wechatUserInfo.headimgurl,
            wechatOpenId: openId,
            wechatUnionId: wechatUserInfo.unionid,
            wechatNickname: wechatUserInfo.nickname,
            wechatAvatar: wechatUserInfo.headimgurl,
            isWechatUser: true,
            role: 'NORMAL',
            status: 'ACTIVE'
          }
        });
        
        this.logger.log(`创建新用户成功，ID: ${user.id}`);
      }
      
      // 生成JWT令牌
      try {
        const payload = {
          sub: user.id,
          username: user.username,
          role: user.role
        };
        
        this.logger.log(`准备生成JWT令牌，payload:`, payload);
        
        const token = this.jwtService.sign(payload);
        
        this.logger.log(`生成JWT令牌成功，长度: ${token.length}`);
        
        const userData = {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          avatarUrl: user.avatarUrl,
          role: user.role,
          status: user.status,
          isWechatUser: user.isWechatUser
        };
        
        this.logger.log(`返回用户数据:`, userData);
        
        return {
          success: true,
          token: `Bearer ${token}`,
          user: userData
        };
      } catch (jwtError) {
        this.logger.error(`生成JWT令牌失败:`, jwtError);
        return { success: false, message: '生成授权令牌失败，请重试' };
      }
    } catch (error) {
      this.logger.error('验证码验证失败:', error);
      return { success: false, message: '验证失败，请重试' };
    }
  }

  // 处理微信消息
  async handleMessage(wechatMessage: any) {
    try {
      this.logger.log('收到微信消息:', wechatMessage);
      
      const { ToUserName, FromUserName, MsgType, Content } = wechatMessage;
      const toUserName = ToUserName;
      const fromUserName = FromUserName;
      const msgType = MsgType;
      const msgContent = Content;

      // 生成回复消息的基本XML结构
      const createReplyXml = (content: string) => {
        const timestamp = Math.floor(Date.now() / 1000);
        return `<xml><ToUserName><![CDATA[${fromUserName}]]></ToUserName><FromUserName><![CDATA[${toUserName}]]></FromUserName><CreateTime>${timestamp}</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[${content}]]></Content></xml>`;
      };
      
      // 处理关注事件
      if (msgType === 'event' && msgContent === 'subscribe') {
        this.logger.log(`用户关注事件，openId: ${fromUserName}`);
        
        // 检查是否是已存在的用户（包括曾经取消关注的用户）
        const existingUser = await this.prisma.user.findFirst({
          where: { wechatOpenId: fromUserName }
        });
        
        // 记录查找结果
        if (existingUser) {
          this.logger.log(`找到已存在的用户记录，用户ID: ${existingUser.id}, 状态: ${existingUser.status}`);
          
          // 如果用户之前取消关注，更新用户状态为ACTIVE
          if (existingUser.status === 'MUTED') {
            await this.prisma.user.update({
              where: { id: existingUser.id },
              data: { status: 'ACTIVE' }
            });
            this.logger.log(`已更新用户状态为ACTIVE，用户ID: ${existingUser.id}`);
          }
        } else {
          this.logger.log(`未找到现有用户记录，这是新用户`);
        }
        
        // 生成验证码
        const code = this.generateVerificationCode();
        await this.saveVerificationCode(fromUserName, code);
        
        const reply = createReplyXml(`感谢关注！您的登录验证码是：${code}，验证码5分钟内有效。`);
        this.logger.log('生成的回复XML:', reply);
        return reply;
      }

      // 处理取消关注事件
      if (msgType === 'event' && msgContent === 'unsubscribe') {
        this.logger.log(`用户取消关注事件，openId: ${fromUserName}`);
        
        // 查找用户
        const user = await this.prisma.user.findFirst({
          where: { wechatOpenId: fromUserName }
        });
        
        if (user) {
          // 将用户状态设置为MUTED而非删除
          await this.prisma.user.update({
            where: { id: user.id },
            data: { status: 'MUTED' }
          });
          this.logger.log(`已将用户状态设置为MUTED，用户ID: ${user.id}`);
        }
        
        return '';  // 微信服务器不期望取消关注事件有回复
      }

      // 处理"登录"文本消息
      if (msgType === 'text' && (msgContent === '登录' || msgContent === '登陆')) {
        this.logger.log(`收到登录请求，openId: ${fromUserName}`);
        // 生成验证码
        const code = this.generateVerificationCode();
        await this.saveVerificationCode(fromUserName, code);
        const reply = createReplyXml(`您的登录验证码是：${code}，验证码5分钟内有效。`);
        this.logger.log('生成的回复XML:', reply);
        return reply;
      }

      // 其他消息类型返回默认提示
      return createReplyXml('发送"登录"可获取验证码。');
    } catch (error) {
      this.logger.error('处理微信消息失败:', error);
      // 返回标准XML错误提示，防止微信服务器丢弃回复
      const toUserName = wechatMessage.ToUserName || '';
      const fromUserName = wechatMessage.FromUserName || '';
      return `\
<xml>\n  <ToUserName><![CDATA[${toUserName}]]></ToUserName>\n  <FromUserName><![CDATA[${fromUserName}]]></FromUserName>\n  <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>\n  <MsgType><![CDATA[text]]></MsgType>\n  <Content><![CDATA[系统繁忙，请稍后重试]]></Content>\n</xml>\n`;
    }
  }

  // 获取微信用户信息
  private async getWechatUserInfo(openId: string) {
    try {
      console.log('开始获取微信用户信息, openId:', openId);
      
    // 获取访问令牌
    const accessToken = await this.getAccessToken();
      
      console.log('成功获取访问令牌，准备获取用户信息');
    
    // 调用微信API获取用户信息
      const url = `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${accessToken}&openid=${openId}&lang=zh_CN`;
      console.log('请求微信用户信息URL:', url);
      
      const response = await fetch(url);
      console.log('微信用户信息API响应状态:', response.status);
      
    const userInfo = await response.json();
      console.log('获取的微信用户信息:', JSON.stringify(userInfo));
    
    if (!userInfo || userInfo.errcode) {
        console.error('获取微信用户信息失败, 错误信息:', userInfo);
        throw new Error(`获取微信用户信息失败: ${JSON.stringify(userInfo)}`);
    }
    
    return userInfo;
    } catch (error) {
      console.error('获取微信用户信息过程中发生异常:', error);
      throw error;
    }
  }

  // 获取微信访问令牌
  private async getAccessToken(): Promise<string> {
    try {
      console.log('正在请求微信访问令牌...');
      console.log('使用的配置:', {
        appId: this.appId,
        appSecret: '***' // 不输出敏感信息
      });
      
      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`;
      console.log('请求微信令牌URL (隐藏secret):', url.replace(this.appSecret, '***'));

      const response = await fetch(url);
      console.log('微信令牌API响应状态:', response.status);
      
      if (!response.ok) {
        console.error('微信令牌请求失败, HTTP状态:', response.status);
        throw new Error(`获取微信访问令牌失败: HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('微信访问令牌接口返回:', {
        ...data,
        access_token: data.access_token ? '***' : undefined // 不输出敏感信息
      });
      
      if (!data.access_token) {
        console.error('获取访问令牌失败，微信返回:', {
          errcode: data.errcode,
          errmsg: data.errmsg,
          appId: this.appId
        });
        
        // 如果是IP白名单问题，给出明确提示
        if (data.errcode === 40164) {
          throw new Error(`获取微信访问令牌失败: IP地址不在白名单中，请在微信公众平台添加服务器IP到白名单`);
        }
        
        throw new Error(`获取微信访问令牌失败: ${JSON.stringify(data)}`);
      }
      
      console.log('成功获取微信访问令牌');
      return data.access_token;
    } catch (error) {
      console.error('获取微信访问令牌失败，详细错误:', error);
      if (error instanceof Error) {
        throw new Error(`获取微信访问令牌失败: ${error.message}`);
      } else {
        throw new Error('获取微信访问令牌失败: 未知错误');
      }
    }
  }

  // 查找或创建用户
  private async findOrCreateUser(wechatUser: any) {
    // 查找现有用户
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { wechatOpenId: wechatUser.openid },
          { wechatUnionId: wechatUser.unionid }
        ]
      }
    });

    if (!user) {
      // 创建新用户
      const randomStr = crypto.randomBytes(4).toString('hex');
      user = await this.prisma.user.create({
        data: {
          username: `wx_${randomStr}`,
          nickname: wechatUser.nickname || `微信用户_${randomStr}`,
          avatarUrl: wechatUser.headimgurl,
          wechatOpenId: wechatUser.openid,
          wechatUnionId: wechatUser.unionid,
          wechatNickname: wechatUser.nickname,
          wechatAvatar: wechatUser.headimgurl,
          isWechatUser: true,
          role: 'NORMAL' as const
        }
      });
    }

    // 生成JWT令牌
    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username
    });

    return { user, token };
  }

  /**
   * 根据微信openId查找用户
   */
  async findUserByOpenId(openId: string) {
    this.logger.log(`查找用户，openId: ${openId}`);
    return this.prisma.user.findFirst({
      where: { wechatOpenId: openId },
    });
  }

  /**
   * 处理微信登录
   */
  async handleLogin(openId: string) {
    this.logger.log(`处理微信登录，openId: ${openId}`);
    
    try {
      // 查找用户是否存在
      let user = await this.findUserByOpenId(openId);
      
      // 生成JWT令牌
      let token = '';
      
      // 如果用户不存在，则创建新用户
      if (!user) {
        this.logger.log(`用户不存在，创建新用户，openId: ${openId}`);
        user = await this.prisma.user.create({
          data: {
            email: `wechat_${openId}@example.com`,
            username: `wx_${openId.substring(0, 6)}`,
            nickname: `微信用户_${openId.substring(0, 6)}`,
            wechatOpenId: openId,
            isWechatUser: true,
            role: 'NORMAL',
            status: 'ACTIVE'
          },
        });
        this.logger.log(`创建新用户成功: ${user.id}`);
      } else {
        this.logger.log(`找到已存在的用户: ${user.id}, 状态: ${user.status}`);
        
        // 如果用户状态不是ACTIVE，重新激活
        if (user.status !== 'ACTIVE') {
          this.logger.log(`用户状态非活跃(${user.status})，重新激活用户: ${user.id}`);
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { status: 'ACTIVE' }
          });
          this.logger.log(`用户状态已更新为ACTIVE`);
        }
      }
      
      // 生成新的JWT令牌
      token = this.jwtService.sign({
        sub: user.id,
        username: user.username
      });
      
      // 返回用户信息和token
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          wechatOpenId: user.wechatOpenId,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
        },
        token: token,
      };
    } catch (error) {
      this.logger.error(`处理微信登录失败: ${error.message}`);
      return {
        success: false,
        message: '处理登录请求失败',
      };
    }
  }

  /**
   * 生成会话密钥 (已不使用，改为JWT)
   */
  private generateSessionKey(openId: string): string {
    const timestamp = Date.now().toString();
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `${openId}_${timestamp}_${randomStr}`;
  }

  /**
   * 根据临时openId查找用户
   */
  async findUserByTempOpenId(tempOpenId: string) {
    this.logger.log(`查找临时用户，tempOpenId: ${tempOpenId}`);
    return this.prisma.user.findFirst({
      where: { tempOpenId },
    });
  }

  /**
   * 更新用户的微信openId
   */
  async updateUserWechatOpenId(userId: number, wechatOpenId: string) {
    this.logger.log(`更新用户微信openId，userId: ${userId}, wechatOpenId: ${wechatOpenId}`);
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        wechatOpenId,
        tempOpenId: null // 清除临时openId
      },
    });
  }

  /**
   * 处理用户取消关注
   */
  async handleUserUnsubscribe(openId: string) {
    try {
      this.logger.log(`处理用户取消关注，openId: ${openId}`);
      
      // 查找用户
      const user = await this.prisma.user.findFirst({
        where: { wechatOpenId: openId }
      });
      
      if (!user) {
        this.logger.warn(`未找到取消关注的用户，openId: ${openId}`);
        return { success: false, message: '未找到用户' };
      }
      
      // 将用户状态更改为MUTED或BANNED，但保留账户
      this.logger.log(`找到取消关注的用户，ID: ${user.id}，标记为非活跃`);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { status: 'MUTED' }
      });
      
      this.logger.log(`用户 ${user.id} 已标记为MUTED状态`);
      return { success: true, message: '用户已标记为非活跃' };
    } catch (error) {
      this.logger.error(`处理用户取消关注失败:`, error);
      return { success: false, message: '处理取消关注失败' };
    }
  }

  private buildTextMessage(toUserName: string, fromUserName: string, content: string): string {
    return `
<xml>
  <ToUserName><![CDATA[${toUserName}]]></ToUserName>
  <FromUserName><![CDATA[${fromUserName}]]></FromUserName>
  <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[${content}]]></Content>
</xml>`.trim();
  }
} 