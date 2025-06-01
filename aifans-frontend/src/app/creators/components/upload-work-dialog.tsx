import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'sonner';
import axios from 'axios';

interface UploadWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'image' | 'video' | 'audio';
  maxSizeMB: number;
  onSuccess?: (work: { url: string; key: string; title: string; desc: string; type: string }) => void;
}

export function UploadWorkDialog({ open, onOpenChange, type, onSuccess }: UploadWorkDialogProps) {
  const [fileUrl, setFileUrl] = useState('');
  const [fileKey, setFileKey] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const { token } = useAuthStore();
  const [uploading, setUploading] = useState(false);

  // 动态获取creator模块的上传限制
  const [limit, setLimit] = useState({ imageMaxSizeMB: 5, videoMaxSizeMB: 50, audioMaxSizeMB: 20 });

  useEffect(() => {
    if (open) {
      // 获取creator模块的上传限制
      axios.get('/api/admin/settings/upload-limits/creator')
        .then(res => {
          if (res.data) {
            setLimit(res.data);
          }
        })
        .catch(err => {
          console.error('Failed to fetch upload limits:', err);
        });
    }
  }, [open]);

  // 计算当前类型的最大限制
  const realMaxSizeMB = type === 'image' ? limit.imageMaxSizeMB : 
                        type === 'video' ? limit.videoMaxSizeMB : 
                        limit.audioMaxSizeMB;

  const folder = type === 'image' ? 'creators/images' : 
                 type === 'video' ? 'creators/videos' : 
                 'creators/audios';
                 
  const accept = type === 'image' ? { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] } :
                 type === 'video' ? { 'video/*': ['.mp4', '.webm', '.mov'] } :
                 { 'audio/*': ['.mp3', '.wav', '.aac', '.m4a'] };

  // 上传处理
  const handleUpload = async (files: File[]) => {
    if (!token) {
      toast.error('请先登录');
      return [{ url: '', key: '' }];
    }
    
    const file = files[0];
    if (!file) return [{ url: '', key: '' }];
    
    // 文件大小检查
    const maxSize = realMaxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`文件大小不能超过 ${realMaxSizeMB}MB`);
      return [{ url: '', key: '' }];
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    try {
      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: '服务器响应错误' };
        }
        toast.error(errorData.error || '上传失败');
        return [{ url: '', key: '' }];
      }
      
      const result = await response.json();
      setFileUrl(result.url);
      setFileKey(result.key);
      toast.success('上传成功');
      return [result];
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('上传失败，请重试');
      return [{ url: '', key: '' }];
    } finally {
      setUploading(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setFileUrl('');
    setFileKey('');
    setTitle('');
    setDesc('');
  };

  // 确认上传
  const handleConfirm = () => {
    if (fileUrl && onSuccess) {
      onSuccess({ 
        url: fileUrl, 
        key: fileKey, 
        title: title.trim(), 
        desc: desc.trim(), 
        type 
      });
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-primary-gradient">
            上传{type === 'image' ? '图片' : type === 'video' ? '视频' : '音频'}作品
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-[var(--custom-primary)] transition-colors">
            <FileUpload
              onUpload={handleUpload}
              onUrlsChange={urls => setFileUrl(urls[0] || '')}
              accept={accept}
              maxFiles={1}
              maxSize={realMaxSizeMB * 1024 * 1024}
              placeholder={`拖拽${type === 'image' ? '图片' : type === 'video' ? '视频' : '音频'}到此处或点击上传（单文件最大${realMaxSizeMB}MB）`}
            />
          </div>
          
          {fileUrl && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-green-700">上传成功</p>
              </div>
              {type === 'image' && (
                <div className="rounded-lg overflow-hidden">
                  <img src={fileUrl} alt="预览" className="w-full h-40 object-cover" />
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">作品标题（可选）</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[var(--custom-primary)] focus:border-transparent transition-all duration-200"
                placeholder={`给你的${type === 'image' ? '图片' : type === 'video' ? '视频' : '音频'}起个名字`}
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={50}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">作品描述（可选）</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-3 min-h-[80px] focus:ring-2 focus:ring-[var(--custom-primary)] focus:border-transparent transition-all duration-200 resize-none"
                placeholder="简单介绍一下这个作品..."
                value={desc}
                onChange={e => setDesc(e.target.value)}
                maxLength={200}
              />
              <div className="text-xs text-gray-400 mt-1 text-right">{desc.length}/200</div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="pt-6 flex-shrink-0 border-t border-gray-100 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="px-6"
          >
            取消
          </Button>
          <Button
            disabled={!fileUrl || uploading}
            onClick={handleConfirm}
            className="bg-primary-gradient text-white border-0 px-6 hover:opacity-90 transition-opacity"
          >
            {uploading ? '上传中...' : '确定'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 