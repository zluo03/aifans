import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'sonner';

interface BackgroundUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (backgroundUrl: string) => void;
}

export function BackgroundUploadDialog({ open, onOpenChange, onSuccess }: BackgroundUploadDialogProps) {
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { token, user } = useAuthStore();

  const handleUpload = async (files: File[]) => {
    if (!token) {
      toast.error('请先登录');
      return [{ url: '', key: '' }];
    }
    
    const file = files[0];
    if (!file) return [{ url: '', key: '' }];
    
    // 文件大小检查 (最大10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('文件大小不能超过 10MB');
      return [{ url: '', key: '' }];
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'creators/backgrounds');
    
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

  const handleConfirm = async () => {
    if (!fileUrl || !user) {
      toast.error('请先上传背景图片');
      return;
    }

    setSaving(true);
    try {
      // 获取当前创作者信息
      const response = await fetch(`/api/creators/user/${user.id}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      let currentData = {};
      if (response.ok) {
        currentData = await response.json();
      }

      // 更新背景图片
      const updateResponse = await fetch('/api/creators', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...currentData,
          backgroundUrl: fileUrl
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || '保存失败');
      }

      toast.success('背景图片保存成功');
      if (onSuccess) {
        onSuccess(fileUrl);
      }
      setFileUrl('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('保存背景图片失败:', error);
      toast.error(error.message || '保存背景图片失败');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFileUrl('');
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-primary-gradient">
            上传背景图片
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">建议图片尺寸</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 推荐尺寸：1920x400 像素</li>
                  <li>• 最小尺寸：1200x300 像素</li>
                  <li>• 宽高比：约 4.8:1 或 16:3</li>
                  <li>• 文件大小：不超过 10MB</li>
                  <li>• 支持格式：JPG、PNG、WebP</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-[var(--custom-primary)] transition-colors">
            <FileUpload
              onUpload={handleUpload}
              onUrlsChange={urls => setFileUrl(urls[0] || '')}
              accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
              maxFiles={1}
              maxSize={10 * 1024 * 1024}
              placeholder="拖拽背景图片到此处或点击上传（最大10MB）"
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
              <div className="rounded-lg overflow-hidden">
                <img src={fileUrl} alt="背景预览" className="w-full h-24 object-cover" />
              </div>
            </div>
          )}
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
            disabled={!fileUrl || uploading || saving}
            onClick={handleConfirm}
            className="bg-primary-gradient text-white border-0 px-6 hover:opacity-90 transition-opacity"
          >
            {uploading ? '上传中...' : saving ? '保存中...' : '确定'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 