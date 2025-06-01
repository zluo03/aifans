import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    // 生成唯一的临时openId (在实际应用中，应该在后端生成)
    const openId = `test_user_${uuidv4().substring(0, 8)}`;
    
    // 由于使用静态图片，qrCodeUrl可以是任意值，实际不会被使用
    const qrCodeUrl = '';
    
    console.log('生成微信登录数据:', { openId });
    
    // 返回包含openId的数据
    return NextResponse.json({
      qrCodeUrl,
      openId,
    });
  } catch (error) {
    console.error('生成微信登录URL失败:', error);
    return NextResponse.json(
      { error: '生成微信登录URL失败' },
      { status: 500 }
    );
  }
} 