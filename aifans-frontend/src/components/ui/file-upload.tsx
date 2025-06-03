'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Upload, X, File, Image as ImageIcon, Video, FileText } from 'lucide-react';
import Image from 'next/image';

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<Array<{ url: string; key: string }>>;
  onUrlsChange?: (urls: string[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  className?: string;
  placeholder?: string;
}

interface UploadedFile {
  file: File;
  url: string;
  key: string;
  progress: number;
  error?: string;
}

export function FileUpload({
  onUpload,
  onUrlsChange,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'video/*': ['.mp4', '.webm', '.mov'],
    'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.aac'],
    'application/pdf': ['.pdf'],
    'application/zip': ['.zip'],
    'application/x-7z-compressed': ['.7z'],
    'application/x-tar': ['.tar', '.gz'],
    'application/x-apple-diskimage': ['.dmg'],
    'application/x-rar-compressed': ['.rar'],
    'text/*': ['.txt', '.md']
  },
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
  placeholder = "拖拽文件到此处或点击上传"
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    
    // 初始化上传状态
    const newFiles = acceptedFiles.map(file => ({
      file,
      url: '',
      key: '',
      progress: 0
    }));
    
    // 不再清空之前的文件，始终追加新文件
    setUploadedFiles(prev => [...prev, ...newFiles]);

    try {
      // 批量上传文件
      const results = await onUpload(acceptedFiles);
      
      // 更新上传结果
      setUploadedFiles(prev => {
        // 更新最后添加的文件
        return prev.map((item, index) => {
          if (index >= prev.length - newFiles.length) {
            const resultIndex = index - (prev.length - newFiles.length);
            const result = results[resultIndex];
            if (result) {
              return {
                ...item,
                url: result.url,
                key: result.key,
                progress: 100
              };
            }
          }
          return item;
        });
      });

      // 通知父组件URL列表更新，不替换之前的URL
      if (onUrlsChange) {
        // 如果是单文件模式，只返回最新上传的URL
        if (maxFiles === 1) {
          const successResults = results.filter(r => r.url);
          if (successResults.length > 0) {
            onUrlsChange(successResults.map(r => r.url));
          }
        } else {
          // 对于多文件模式，返回所有文件URL
          const allUrls = [...uploadedFiles.map(f => f.url), ...results.map(r => r.url)].filter(Boolean);
          onUrlsChange(allUrls);
        }
      }
    } catch (error) {
      // 标记错误
      setUploadedFiles(prev => 
        prev.map((item, index) => {
          if (index >= prev.length - newFiles.length) {
            const errorMessage = error instanceof Error ? error.message : 
                               (typeof error === 'object' ? JSON.stringify(error) : '上传失败');
            return {
              ...item,
              error: errorMessage
            };
          }
          return item;
        })
      );
    } finally {
      setIsUploading(false);
    }
  }, [onUpload, uploadedFiles, maxFiles, onUrlsChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    disabled: isUploading
  });

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    
    if (onUrlsChange) {
      onUrlsChange(newFiles.map(f => f.url).filter(Boolean));
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-6 w-6" />;
    if (file.type.startsWith('video/')) return <Video className="h-6 w-6" />;
    if (file.type === 'application/pdf') return <FileText className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

  const getFilePreview = (file: File, url: string) => {
    if (file.type.startsWith('image/') && url) {
      return (
        <div className="relative w-16 h-16 rounded-lg overflow-hidden">
          <Image
            src={url}
            alt={file.name}
            fill
            className="object-cover"
          />
        </div>
      );
    }
    
    return (
      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
        {getFileIcon(file)}
      </div>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* 拖拽上传区域 */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
          "hover:border-primary/50 hover:bg-muted/50",
          isDragActive && "border-primary bg-primary/5",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">
            {isDragActive ? "释放文件以上传" : placeholder}
          </p>
          <p className="text-xs text-muted-foreground">
            支持图片、视频、PDF等格式，单个文件最大 {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      </div>

      {/* 已上传文件列表 */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">已上传文件</h4>
          <div className="space-y-2">
            {uploadedFiles.map((item, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 border rounded-lg"
              >
                {getFilePreview(item.file, item.url)}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {item.error && (
                    <p className="text-xs text-destructive">{item.error}</p>
                  )}
                  
                  {item.progress > 0 && item.progress < 100 && !item.error && (
                    <Progress value={item.progress} className="mt-1 h-1" />
                  )}
                  
                  {item.progress === 100 && !item.error && (
                    <p className="text-xs text-green-600">上传完成</p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 