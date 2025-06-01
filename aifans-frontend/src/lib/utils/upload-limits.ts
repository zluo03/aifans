// 上传限制配置工具类

import axios from 'axios';

export interface UploadLimits {
  notes: {
    imageSize: number; // MB
    videoSize: number; // MB
  };
  inspiration: {
    imageSize: number; // MB
    videoSize: number; // MB
  };
  screenings: {
    videoSize: number; // MB
  };
}

// 默认配置
const defaultLimits: UploadLimits = {
  notes: {
    imageSize: 5,
    videoSize: 50,
  },
  inspiration: {
    imageSize: 10,
    videoSize: 100,
  },
  screenings: {
    videoSize: 500,
  },
};

// 获取上传限制配置
export async function getUploadLimits(): Promise<UploadLimits> {
  try {
    const response = await fetch('/api/admin/settings/upload-limits');
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return data.limits;
      }
    }
    console.warn('获取上传限制失败，使用默认配置');
    return defaultLimits;
  } catch (error) {
    console.error('获取上传限制失败:', error);
    return defaultLimits;
  }
}

// 根据模块获取文件大小限制
export function getFileSizeLimit(limits: UploadLimits, module: keyof UploadLimits, fileType: 'image' | 'video'): number {
  if (module === 'notes') {
    return fileType === 'image' ? limits.notes.imageSize : limits.notes.videoSize;
  } else if (module === 'inspiration') {
    return fileType === 'image' ? limits.inspiration.imageSize : limits.inspiration.videoSize;
  } else if (module === 'screenings') {
    return limits.screenings.videoSize; // 影院模块只有视频
  }
  
  // 默认限制
  return fileType === 'image' ? 10 : 50;
}

// 验证文件大小
export function validateFileSize(file: File, limits: UploadLimits, module: keyof UploadLimits): string | null {
  const fileSizeMB = file.size / (1024 * 1024);
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  
  let maxSize: number;
  let fileTypeText: string;
  
  if (isImage) {
    maxSize = getFileSizeLimit(limits, module, 'image');
    fileTypeText = '图片';
  } else if (isVideo) {
    maxSize = getFileSizeLimit(limits, module, 'video');
    fileTypeText = '视频';
  } else {
    return '不支持的文件类型';
  }
  
  if (fileSizeMB > maxSize) {
    const moduleText = module === 'notes' ? '笔记' : module === 'inspiration' ? '灵感' : '影院';
    return `${moduleText}模块${fileTypeText}大小不能超过${maxSize}MB，当前大小: ${fileSizeMB.toFixed(2)}MB`;
  }
  
  return null;
}

// 获取文件类型提示文本
export function getFileSizeHint(limits: UploadLimits, module: keyof UploadLimits): string {
  if (module === 'notes') {
    return `支持图片(最大${limits.notes.imageSize}MB)和视频(最大${limits.notes.videoSize}MB)`;
  } else if (module === 'inspiration') {
    return `支持图片(最大${limits.inspiration.imageSize}MB)和视频(最大${limits.inspiration.videoSize}MB)`;
  } else if (module === 'screenings') {
    return `支持视频(最大${limits.screenings.videoSize}MB)`;
  }
  
  return '支持图片和视频文件';
}

export interface UploadLimit {
  imageMaxSizeMB: number;
  videoMaxSizeMB: number;
  audioMaxSizeMB?: number;
}

export async function getUploadLimit(module: string): Promise<UploadLimit> {
  const res = await axios.get(`/api/admin/settings/upload-limits/${module}`);
  return res.data;
} 