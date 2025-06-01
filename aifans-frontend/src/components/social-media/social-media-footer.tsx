'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { socialMediaApi } from '@/lib/api/social-media';
import { toast } from 'sonner';

interface SocialMedia {
  id: number;
  name: string;
  logoUrl: string;
  qrCodeUrl: string;
  sortOrder: number;
  isActive: boolean;
}

interface SocialMediaFooterProps {
  className?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function SocialMediaFooter({ className = '' }: SocialMediaFooterProps) {
  const [socialMediaList, setSocialMediaList] = useState<SocialMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQrCode, setActiveQrCode] = useState<string | null>(null);

  const fetchSocialMedia = async () => {
    try {
      console.log('开始获取社交媒体列表');
      setLoading(true);
      const data = await socialMediaApi.getAll();
      console.log('获取到社交媒体数据:', data);
      setSocialMediaList(data);
    } catch (error) {
      console.error('获取社交媒体失败:', error);
      toast.error('获取社交媒体失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialMedia();
  }, []);

  const handleMouseEnter = (qrCodeUrl: string) => {
    setActiveQrCode(qrCodeUrl);
  };

  const handleMouseLeave = () => {
    setActiveQrCode(null);
  };

  if (loading) {
    return null; // 加载时不显示
  }

  if (socialMediaList.length === 0) {
    return null; // 没有数据时不显示
  }

  return (
    <div className={`relative flex items-center justify-center space-x-4 py-4 ${className}`}>
      {socialMediaList.map((item) => (
        <div
          key={item.id}
          className="relative"
          onMouseEnter={() => handleMouseEnter(item.qrCodeUrl)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity">
            <img
              src={item.logoUrl.startsWith('http') ? item.logoUrl : `${BACKEND_URL}${item.logoUrl}`}
              alt={item.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                console.error(`加载Logo失败: ${item.logoUrl}`);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          
          {/* 二维码弹出层 */}
          {activeQrCode === item.qrCodeUrl && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white p-2 rounded-lg shadow-lg z-10">
              <div className="relative w-32 h-32">
                <img
                  src={item.qrCodeUrl.startsWith('http') ? item.qrCodeUrl : `${BACKEND_URL}${item.qrCodeUrl}`}
                  alt={`${item.name} 二维码`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error(`加载二维码失败: ${item.qrCodeUrl}`);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="text-center mt-1 text-sm">{item.name}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 