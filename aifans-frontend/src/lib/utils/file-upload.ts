import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// 生成唯一文件名
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${random}.${extension}`;
}

// 确保目录存在
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

// 上传封面图片
export async function uploadCoverImage(file: File): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // 生成文件名和路径
    const fileName = generateUniqueFileName(file.name);
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'screenings', 'covers');
    const filePath = join(uploadDir, fileName);
    
    // 确保目录存在
    await ensureDirectoryExists(uploadDir);
    
    // 写入文件
    await writeFile(filePath, buffer);
    
    // 返回可访问的URL
    return `/uploads/screenings/covers/${fileName}`;
  } catch (error) {
    console.error('上传封面失败:', error);
    throw new Error('上传封面失败');
  }
}

// 上传视频文件
export async function uploadVideoFile(file: File): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // 生成文件名和路径
    const fileName = generateUniqueFileName(file.name);
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'screenings', 'videos');
    const filePath = join(uploadDir, fileName);
    
    // 确保目录存在
    await ensureDirectoryExists(uploadDir);
    
    // 写入文件
    await writeFile(filePath, buffer);
    
    // 返回可访问的URL
    return `/uploads/screenings/videos/${fileName}`;
  } catch (error) {
    console.error('上传视频失败:', error);
    throw new Error('上传视频失败');
  }
}

// 验证文件类型
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => file.type.startsWith(type));
}

// 验证文件大小（MB）
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
} 