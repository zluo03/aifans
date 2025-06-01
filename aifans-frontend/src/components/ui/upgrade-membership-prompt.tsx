"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Download, Copy } from "lucide-react";
import Link from "next/link";
import { getUserPermissions } from "@/lib/utils/permission";

interface UpgradeMembershipPromptProps {
  userRole?: string;
  feature: 'download' | 'copyPrompt' | 'upload';
  className?: string;
}

export function UpgradeMembershipPrompt({ 
  userRole, 
  feature, 
  className = "" 
}: UpgradeMembershipPromptProps) {
  const permissions = getUserPermissions(userRole);
  
  // 如果用户已经有权限，不显示提示
  if (feature === 'download' && permissions.isPremiumOrAbove) return null;
  if (feature === 'copyPrompt' && permissions.isPremiumOrAbove) return null;
  if (feature === 'upload' && permissions.isPremiumOrAbove) return null;

  const getFeatureInfo = () => {
    switch (feature) {
      case 'download':
        return {
          icon: <Download className="w-4 h-4" />,
          title: '下载作品',
          description: '升级会员可以下载高质量作品素材'
        };
      case 'copyPrompt':
        return {
          icon: <Copy className="w-4 h-4" />,
          title: '复制提示词',
          description: '升级会员可以复制作品的AI提示词'
        };
      case 'upload':
        return {
          icon: <Star className="w-4 h-4" />,
          title: '上传作品',
          description: '升级会员可以分享自己的AI创作作品'
        };
    }
  };

  const featureInfo = getFeatureInfo();

  return (
    <div className={`flex flex-col items-center justify-center p-6 border-2 border-dashed border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-6 h-6 text-yellow-600" />
        <h3 className="font-semibold text-lg text-gray-800">会员专享功能</h3>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        {featureInfo.icon}
        <span className="font-medium text-gray-700">{featureInfo.title}</span>
      </div>
      
      <p className="text-sm text-gray-600 mb-4 text-center">
        {featureInfo.description}
      </p>
      
      <div className="flex items-center gap-2 mb-4">
        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
          <Crown className="w-3 h-3 mr-1" />
          黄金会员
        </Badge>
        <Badge className="bg-gray-100 text-gray-700 border-gray-300">
          <Star className="w-3 h-3 mr-1" />
          白金会员
        </Badge>
      </div>
      
      <Button asChild className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium">
        <Link href="/membership">
          <Crown className="w-4 h-4 mr-2" />
          立即升级会员
        </Link>
      </Button>
    </div>
  );
}

// 简化版本的内联提示
export function InlineUpgradePrompt({ 
  userRole, 
  feature, 
  className = "" 
}: UpgradeMembershipPromptProps) {
  const permissions = getUserPermissions(userRole);
  
  // 如果用户已经有权限，不显示提示
  if (permissions.isPremiumOrAbove) return null;

  const getFeatureText = () => {
    switch (feature) {
      case 'download':
        return '下载素材';
      case 'copyPrompt':
        return '复制提示词';
      case 'upload':
        return '上传作品';
      default:
        return '使用此功能';
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-md ${className}`}>
      <div className="flex items-center gap-2">
        <Crown className="w-4 h-4 text-yellow-600" />
        <span className="text-sm font-medium text-gray-700">
          升级会员可以{getFeatureText()}
        </span>
      </div>
      <Button asChild size="sm" variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
        <Link href="/membership">
          升级会员
        </Link>
      </Button>
    </div>
  );
} 