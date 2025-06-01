'use client';

import { useEffect, useState } from 'react';
import { SocialMediaFooter } from '@/components/social-media/social-media-footer';

export default function SocialMediaTestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">社交媒体测试页面</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-100 p-8 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">白色背景测试</h2>
          <div className="bg-white p-4 rounded flex justify-center">
            <SocialMediaFooter />
          </div>
        </div>
        
        <div className="bg-gray-100 p-8 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">深色背景测试</h2>
          <div className="bg-gray-800 p-4 rounded flex justify-center">
            <SocialMediaFooter />
          </div>
        </div>
      </div>
      
      <div className="bg-gray-100 p-8 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">更新说明</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>二维码现在显示在正方形容器中</li>
          <li>移除了社交媒体名称显示，使界面更简洁</li>
          <li>二维码图片完整显示，保持原始比例</li>
          <li>悬停在图标上时，会显示二维码弹窗</li>
          <li>如果设置了链接，点击图标将跳转到对应链接</li>
        </ul>
      </div>
    </div>
  );
} 