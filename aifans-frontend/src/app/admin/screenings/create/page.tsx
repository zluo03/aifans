'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { adminScreeningsApi } from '@/lib/api/screenings';
import { toast } from 'sonner';
import Link from 'next/link';
import { UploadCloud, X, Play } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { Role } from '@/types';

export default function CreateScreeningPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user } = useAuthStore();

  // 检查是否是管理员
  if (user && user.role !== Role.ADMIN) {
    router.push('/');
    return null;
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      
      // 创建视频预览URL
      const videoUrl = URL.createObjectURL(file);
      setVideoPreview(videoUrl);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      
      // 创建缩略图预览URL
      const imageUrl = URL.createObjectURL(file);
      setThumbnailPreview(imageUrl);
    }
  };

  const clearVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const clearThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('请输入标题');
      return;
    }
    
    if (!videoFile) {
      toast.error('请上传视频文件');
      return;
    }
    
    setLoading(true);
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('video', videoFile);
    
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }
    
    try {
      await adminScreeningsApi.uploadScreening(formData);
      toast.success('放映视频上传成功');
      router.push('/screenings');
    } catch (error) {
      console.error('Error uploading screening:', error);
      toast.error('上传失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">上传放映视频</h1>
          <Button variant="outline" asChild>
            <Link href="/screenings">取消</Link>
          </Button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                placeholder="输入视频标题"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">描述 (可选)</Label>
              <Textarea
                id="description"
                placeholder="输入视频描述"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label>视频文件</Label>
              {videoPreview ? (
                <div className="relative">
                  <video 
                    src={videoPreview} 
                    className="w-full h-[300px] object-contain bg-black rounded-lg" 
                    controls
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={clearVideo}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-6 cursor-pointer" onClick={() => videoInputRef.current?.click()}>
                    <UploadCloud className="h-10 w-10 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">点击或拖拽上传视频文件</p>
                    <p className="text-xs text-muted-foreground">支持MP4, WebM格式</p>
                  </CardContent>
                </Card>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="hidden"
                required={!videoFile}
              />
            </div>
            
            <div className="space-y-2">
              <Label>缩略图 (可选)</Label>
              {thumbnailPreview ? (
                <div className="relative">
                  <img 
                    src={thumbnailPreview} 
                    alt="缩略图预览" 
                    className="w-full h-[200px] object-contain bg-muted rounded-lg" 
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={clearThumbnail}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-6 cursor-pointer" onClick={() => thumbnailInputRef.current?.click()}>
                    <UploadCloud className="h-10 w-10 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">点击或拖拽上传缩略图</p>
                    <p className="text-xs text-muted-foreground">支持JPEG, PNG格式</p>
                  </CardContent>
                </Card>
              )}
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
              />
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? '上传中...' : '上传视频'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 