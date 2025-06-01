/**
 * 处理图片URL，确保可以正确显示
 * @param url 原始URL
 * @returns 处理后的URL
 */
export function processImageUrl(url: string | null | undefined): string {
  if (!url) return '/images/default-avatar.png';
  try {
    // 如果是http/https开头，直接返回原始URL
    if (/^https?:\/\//.test(url)) {
      return url;
    }
    // 如果是正确的avatar路径，直接返回
    if (url.startsWith('/uploads/avatar/')) {
      return url;
    }
    // 只提取文件名和已有扩展名，不做任何扩展名补全
    const match = url.match(/([^\/]+\.[a-zA-Z0-9]+)$/);
    if (match && match[1]) {
      return `/uploads/avatar/${match[1]}`;
    }
    // 如果是完整URL，尝试提取文件名和扩展名
    try {
      const urlObj = new URL(url, 'http://dummy.com');
      const pathname = urlObj.pathname;
      const fileMatch = pathname.match(/([^\/]+\.[a-zA-Z0-9]+)$/);
      if (fileMatch && fileMatch[1]) {
        return `/uploads/avatar/${fileMatch[1]}`;
      }
    } catch {}
    // 其他情况返回默认头像
    return '/images/default-avatar.png';
  } catch (error) {
    console.error('处理图片URL出错:', error);
    return '/images/default-avatar.png';
  }
}

/**
 * 处理帖子图片URL，确保可以正确显示
 * @param url 原始URL
 * @returns 处理后的URL
 */
export function processPostImageUrl(url: string | undefined): string {
  if (!url) return '';
  try {
    // 如果是http/https开头，直接返回原始URL
    if (/^https?:\/\//.test(url)) {
      return url;
    }
    
    // 如果是相对路径，加上后端基础URL
    if (url.startsWith('/')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      return `${baseUrl}${url}`;
    }
    
    // 其他情况，假设是相对于/uploads/的路径
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${baseUrl}/uploads/${url}`;
  } catch (error) {
    console.error('处理帖子图片URL出错:', error);
    return url; // 出错时返回原始URL
  }
}

/**
 * 向URL添加时间戳
 * @param url 原始URL
 * @returns 添加时间戳后的URL
 */
export function addTimestampToUrl(url: string): string {
  try {
    // 微信头像特殊处理，确保正确添加时间戳
    if (url.includes('wx.qlogo.cn')) {
      console.log('微信头像URL添加时间戳:', url);
      
      // 检查URL是否完整
      if (!url.startsWith('http')) {
        url = `https:${url}`;
        console.log('补全微信头像URL:', url);
      }
      
      // 添加时间戳
      const separator = url.includes('?') ? '&' : '?';
      const timestampedUrl = `${url}${separator}_t=${Date.now()}`;
      console.log('添加时间戳后的微信头像URL:', timestampedUrl);
      return timestampedUrl;
    }

    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.set('_t', Date.now().toString());
    return urlObj.toString();
  } catch (error) {
    // 无法解析为URL，可能是相对路径
    console.log('URL解析失败，使用简单方式添加时间戳', url);
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${Date.now()}`;
  }
}

/**
 * 更新URL中的时间戳
 * @param url 带有时间戳的URL
 * @returns 更新时间戳后的URL
 */
export function updateUrlTimestamp(url: string): string {
  try {
    // 替换已有的时间戳
    return url.replace(/(_t=)\d+/, `$1${Date.now()}`);
  } catch (error) {
    // 出错时添加新的时间戳
    console.log('更新时间戳失败，添加新时间戳');
    return addTimestampToUrl(url);
  }
}

/**
 * 确保头像URL格式的一致性
 * 这个函数专门用于处理头像URL，确保它们在前端的所有地方都有一致的格式
 * @param url 原始头像URL
 * @returns 处理后的一致格式的URL
 */
export function ensureAvatarUrlConsistency(url: string | null | undefined): string {
  if (!url) return '/images/default-avatar.png';
  try {
    // 如果是http/https开头，直接返回原始URL
    if (/^https?:\/\//.test(url)) {
      return url;
    }
    if (url.startsWith('/uploads/avatar/')) {
      return url;
    }
    const match = url.match(/([^\/]+\.[a-zA-Z0-9]+)$/);
    if (match && match[1]) {
      return `/uploads/avatar/${match[1]}`;
    }
    try {
      const urlObj = new URL(url, 'http://dummy.com');
      const pathname = urlObj.pathname;
      const fileMatch = pathname.match(/([^\/]+\.[a-zA-Z0-9]+)$/);
      if (fileMatch && fileMatch[1]) {
        return `/uploads/avatar/${fileMatch[1]}`;
      }
    } catch {}
    return '/images/default-avatar.png';
  } catch (error) {
    console.error('头像URL格式化出错:', error);
    return '/images/default-avatar.png';
  }
}

/**
 * 使用代理获取头像URL，避免跨域和图片加载问题
 * @param avatarUrl 原始头像URL
 * @returns 处理后的代理URL
 */
export function getProxyAvatarUrl(avatarUrl: string | null | undefined): string {
  if (!avatarUrl) return '/images/default-avatar.png';
  try {
    // 如果是http/https开头，直接返回原始URL
    if (/^https?:\/\//.test(avatarUrl)) {
      return avatarUrl;
    }
    if (avatarUrl.startsWith('/uploads/avatar/')) {
      return avatarUrl;
    }
    const match = avatarUrl.match(/([^\/]+\.[a-zA-Z0-9]+)$/);
    if (match && match[1]) {
      return `/uploads/avatar/${match[1]}`;
    }
    try {
      const urlObj = new URL(avatarUrl, 'http://dummy.com');
      const pathname = urlObj.pathname;
      const fileMatch = pathname.match(/([^\/]+\.[a-zA-Z0-9]+)$/);
      if (fileMatch && fileMatch[1]) {
        return `/uploads/avatar/${fileMatch[1]}`;
      }
    } catch {}
    return '/images/default-avatar.png';
  } catch (error) {
    console.error('代理头像URL处理出错:', error);
    return '/images/default-avatar.png';
  }
} 