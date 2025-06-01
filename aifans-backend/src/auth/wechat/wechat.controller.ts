import { Controller, Get, Post, Query, HttpCode, HttpStatus, Headers, Res, Body, Req, Param } from '@nestjs/common';
import { Response, Request } from 'express';
import * as crypto from 'crypto';
import { WechatService } from './wechat.service';
import * as xml2js from 'xml2js';
import { JwtService } from '@nestjs/jwt';

@Controller('auth/wechat')
export class WechatController {
  constructor(
    private readonly wechatService: WechatService,
    private readonly jwtService: JwtService
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async handleVerification(
    @Query('signature') signature: string,
    @Query('timestamp') timestamp: string,
    @Query('nonce') nonce: string,
    @Query('echostr') echostr: string,
    @Res() res: Response
  ) {
    try {
      console.log('【验证】收到微信验证请求:', { signature, timestamp, nonce, echostr });

      // 验证签名
      const isValid = this.wechatService.verifySignature(signature, timestamp, nonce);
      console.log('【验证】签名验证结果:', isValid);

      // 微信接入验证，返回echostr
      if (echostr) {
        if (isValid) {
          console.log('【验证】验证成功，返回 echostr:', echostr);
          res.setHeader('Content-Type', 'text/plain');
          return res.send(echostr);
        } else {
          console.log('【验证】验证失败，返回 failed，echostr:', echostr);
          console.log('【验证】使用的TOKEN:', this.wechatService.getToken());
          res.setHeader('Content-Type', 'text/plain');
          return res.send(echostr); // 测试环境下先直接返回echostr
        }
      }

      res.setHeader('Content-Type', 'text/plain');
      return res.send('success');
    } catch (error) {
      console.error('【验证】验证过程出错:', error);
      res.setHeader('Content-Type', 'text/plain');
      return res.send('success');
    }
  }

  @Get('ping')
  @HttpCode(HttpStatus.OK)
  async ping(@Res() res: Response) {
    return res.json({ message: 'pong' });
  }

  @Get('super-simple')
  @HttpCode(HttpStatus.OK)
  async superSimple(@Query('echostr') echostr: string, @Res() res: Response) {
    console.log('收到超级简单测试请求，echostr:', echostr);
    res.setHeader('Content-Type', 'text/plain');
    return res.send(echostr || 'hello');
  }

  @Get('test-verify')
  @HttpCode(HttpStatus.OK)
  async testVerify(
    @Query('signature') signature: string,
    @Query('timestamp') timestamp: string,
    @Query('nonce') nonce: string,
    @Query('echostr') echostr: string,
    @Res() res: Response
  ) {
    console.log('收到测试验证请求:', { signature, timestamp, nonce, echostr });
    
    // 直接返回 echostr，不做任何验证
    console.log('测试路由，直接返回 echostr:', echostr);
    res.setHeader('Content-Type', 'text/plain');
    return res.send(echostr || 'hello');
  }

  @Get('qrcode')
  @HttpCode(HttpStatus.OK)
  async getLoginQrCode(@Res() res: Response) {
    try {
      const data = await this.wechatService.generateLoginQrCode();
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: '获取二维码失败' });
    }
  }

  @Get('check-login-status')
  @HttpCode(HttpStatus.OK)
  async checkLoginStatus(@Query('openId') openId: string, @Res() res: Response) {
    try {
      if (!openId) {
        return res.status(400).json({ isLoggedIn: false, error: '缺少openId参数' });
      }
      
      const result = await this.wechatService.checkLoginStatus(openId);
      return res.json(result);
    } catch (error) {
      console.error('检查登录状态出错:', error);
      return res.status(500).json({ isLoggedIn: false, error: '检查登录状态失败' });
    }
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleMessage(
    @Query('signature') signature: string,
    @Query('timestamp') timestamp: string,
    @Query('nonce') nonce: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      console.log('【微信消息处理】开始处理消息');
      console.log('【微信消息处理】请求头:', req.headers);
      console.log('【微信消息处理】URL参数:', { signature, timestamp, nonce });
      // 验证签名
      const isValid = this.wechatService.verifySignature(signature, timestamp, nonce);
      console.log('【微信消息处理】签名验证结果:', isValid);
      if (!isValid) {
        console.error('【微信消息处理】签名验证失败');
        res.setHeader('Content-Type', 'text/plain');
        return res.send('success');
      }
      // 读取完整 body（流式）
      let xmlBody = '';
      await new Promise<void>((resolve, reject) => {
        req.on('data', chunk => xmlBody += chunk);
        req.on('end', resolve);
        req.on('error', reject);
      });
      console.log('【微信消息处理】收到完整XML:', xmlBody);
      if (!xmlBody) {
        console.log('【微信消息处理】没有收到XML数据');
        res.setHeader('Content-Type', 'text/plain');
        return res.send('success');
      }
      // 解析XML消息
      const parser = new xml2js.Parser({ explicitArray: false });
      let result: any;
      try {
        result = await parser.parseStringPromise(xmlBody);
        console.log('【微信消息处理】XML解析结果:', JSON.stringify(result, null, 2));
      } catch (err) {
        console.error('【微信消息处理】XML解析失败:', err);
        res.setHeader('Content-Type', 'text/plain');
        return res.send('success');
      }
      if (result && result.xml) {
        const message = result.xml;
        console.log('【微信消息处理】解析后的消息对象:', message);
        // 特殊处理取消关注事件
        if (message.MsgType === 'event' && message.Event === 'unsubscribe') {
          console.log(`【微信消息处理】用户取消关注事件，openId: ${message.FromUserName}`);
          // 处理用户取消关注
          try {
            const result = await this.wechatService.handleUserUnsubscribe(message.FromUserName);
            console.log(`【微信消息处理】处理取消关注结果:`, result);
          } catch (error) {
            console.error(`【微信消息处理】处理取消关注事件失败:`, error);
          }
          // 对取消关注事件直接返回成功，无需回复消息
          res.setHeader('Content-Type', 'text/plain');
          res.send('success');
          return;
        }
        // 处理消息并获取回复
        const reply = await this.wechatService.handleMessage(message);
        console.log('【微信消息处理】生成的回复消息:', reply);
        res.setHeader('Content-Type', 'text/xml; charset=utf-8');
        const xmlBuffer = Buffer.from(reply, 'utf8');
        console.log('【微信消息处理】回复XML字节长度:', xmlBuffer.length);
        return res.send(xmlBuffer);
      } else {
        console.log('【微信消息处理】XML解析结果无效');
        res.setHeader('Content-Type', 'text/plain');
        return res.send('success');
      }
    } catch (error) {
      console.error('【微信消息处理】发生异常:', error);
      res.setHeader('Content-Type', 'text/plain');
      return res.send('success');
    }
  }

  @Post('raw-message-test')
  @HttpCode(HttpStatus.OK)
  async testRawMessage(@Req() req: Request, @Res() res: Response) {
    try {
      console.log('【微信消息测试】收到请求，开始处理');
      console.log('【微信消息测试】请求头:', {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent'],
        'host': req.headers['host'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
      });
      
      // 获取原始消息内容
      let rawBody = '';
      req.on('data', (chunk) => {
        rawBody += chunk.toString();
      });

      await new Promise<void>((resolve) => {
        req.on('end', async () => {
          console.log('【微信消息测试】收到原始内容:', rawBody);
          
          try {
            // 简单保存消息到文件以供检查
            const fs = require('fs');
            const path = require('path');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const logDir = path.join(process.cwd(), 'wechat-logs');
            
            // 确保日志目录存在
            if (!fs.existsSync(logDir)) {
              fs.mkdirSync(logDir, { recursive: true });
            }
            
            // 保存消息
            const logFile = path.join(logDir, `wechat-message-${timestamp}.log`);
            const logContent = JSON.stringify({
              timestamp: new Date().toISOString(),
              headers: {
                'content-type': req.headers['content-type'],
                'user-agent': req.headers['user-agent'],
                'host': req.headers['host'],
                'x-forwarded-for': req.headers['x-forwarded-for'],
              },
              body: rawBody
            }, null, 2);
            
            fs.writeFileSync(logFile, logContent);
            console.log(`【微信消息测试】已保存消息到文件: ${logFile}`);
          } catch (error) {
            console.error('【微信消息测试】保存消息失败:', error);
          }
          
          // 始终返回成功
          res.setHeader('Content-Type', 'text/plain');
          res.send('success');
          resolve();
        });
      });
    } catch (error) {
      console.error('【微信消息测试】处理出错:', error);
      res.setHeader('Content-Type', 'text/plain');
      return res.send('success');
    }
  }

  @Get('simulate-login')
  @HttpCode(HttpStatus.OK)
  async simulateLogin(@Query('openId') openId: string, @Res() res: Response) {
    try {
      console.log('【模拟登录】接收到模拟登录请求:', openId);
      
      if (!openId) {
        return res.status(400).json({ success: false, message: '缺少openId参数' });
      }
      
      // 直接调用登录处理
      const loginResult = await this.wechatService.handleLogin(openId);
      console.log('【模拟登录】处理结果:', loginResult);
      
      return res.json(loginResult);
    } catch (error) {
      console.error('【模拟登录】模拟登录出错:', error);
      return res.status(500).json({ 
        success: false, 
        message: '模拟登录出错',
        error: error.message 
      });
    }
  }

  @Get('test-create-user/:openId')
  @HttpCode(HttpStatus.OK)
  async testCreateUser(@Param('openId') openId: string, @Res() res: Response) {
    try {
      console.log('【测试】尝试创建用户，openId:', openId);
      
      // 直接调用登录处理，这会自动创建用户如果不存在
      const result = await this.wechatService.handleLogin(openId);
        console.log('【测试】处理结果:', result);
        
        return res.json({
          success: true,
          message: '处理完成',
          result
        });
    } catch (error) {
      console.error('【测试】创建用户失败:', error);
      return res.status(500).json({
        success: false,
        message: '创建用户失败',
        error: error.message
      });
    }
  }

  @Get('check-status')
  @HttpCode(HttpStatus.OK)
  async checkStatus(@Query('openId') openId: string) {
    try {
      console.log('【检查状态】检查用户状态，openId:', openId);
      
      if (!openId) {
        return { exists: false };
      }

      // 查找用户
      const user = await this.wechatService.findUserByOpenId(openId);
      
      if (!user) {
        return { exists: false };
      }

      // 生成JWT令牌
      const token = this.jwtService.sign({
        sub: user.id,
        username: user.username
      });

      return {
        exists: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          role: user.role
        }
      };
    } catch (error) {
      console.error('【检查状态】检查用户状态失败:', error);
      throw error;
    }
  }

  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  async verifyCode(@Body('code') code: string, @Res() res: Response) {
    try {
      if (!code) {
        return res.status(400).json({ success: false, message: '请提供验证码' });
      }

      const result = await this.wechatService.verifyCode(code);
      return res.json(result);
    } catch (error) {
      console.error('验证码验证失败:', error);
      return res.status(500).json({ success: false, message: '验证失败，请重试' });
    }
  }
} 