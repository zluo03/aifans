'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth-store';
import 'react-quill-new/dist/quill.snow.css';
import { getUploadLimit } from '@/lib/utils/upload-limits';

// 正确的动态导入方式，支持ref转发
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill-new');
    const Component = ({ forwardedRef, ...props }: any) => (
      <RQ ref={forwardedRef} {...props} />
    );
    Component.displayName = 'ReactQuillComponent';
    return Component;
  },
  {
    ssr: false,
    loading: () => <div className="h-32 bg-gray-50 dark:bg-gray-800 animate-pulse rounded border" />
  }
);

interface QuillEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export default function QuillEditor({
  value = '',
  onChange,
  className = ''
}: QuillEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const quillRef = useRef<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 图片上传处理器
  const imageHandler = useCallback(async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // 动态获取上传限制并校验
      const limit = await getUploadLimit('notes');
      if (file.size / 1024 / 1024 > (limit.imageMaxSizeMB || 5)) {
        toast.error(`图片大小不能超过${limit.imageMaxSizeMB || 5}MB，当前大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        return;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'notes');

        const { token } = useAuthStore.getState();
        
        if (!token) {
          toast.error('请先登录');
          return;
        }

        toast.loading('上传图片中...', { id: 'image-upload' });

        const response = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: '上传失败' }));
          throw new Error(errorData.error || '上传失败');
        }

        const result = await response.json();
        
        // 获取Quill实例并插入图片
        if (quillRef.current && typeof quillRef.current.getEditor === 'function') {
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection();
          const index = range ? range.index : quill.getLength();
          quill.insertEmbed(index, 'image', result.url);
          // 将光标移动到图片后面
          quill.setSelection(index + 1);
        }

        toast.success('图片上传成功', { id: 'image-upload' });
      } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : '上传失败';
        toast.error(`图片上传失败: ${errorMessage}`, { id: 'image-upload' });
      }
    };
  }, []);

  // 视频上传处理器
  const videoHandler = useCallback(async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'video/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // 动态获取上传限制并校验
      const limit = await getUploadLimit('notes');
      if (file.size / 1024 / 1024 > (limit.videoMaxSizeMB || 50)) {
        toast.error(`视频大小不能超过${limit.videoMaxSizeMB || 50}MB，当前大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        return;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'notes');

        const { token } = useAuthStore.getState();
        
        if (!token) {
          toast.error('请先登录');
          return;
        }

        toast.loading('上传视频中...', { id: 'video-upload' });

        const response = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: '上传失败' }));
          throw new Error(errorData.error || '上传失败');
        }

        const result = await response.json();
        
        // 获取Quill实例并插入视频
        if (quillRef.current && typeof quillRef.current.getEditor === 'function') {
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection();
          const index = range ? range.index : quill.getLength();
          
          // 使用Quill内置的video格式
          quill.insertText(index, '\n');
          quill.insertEmbed(index + 1, 'video', result.url);
          quill.insertText(index + 2, '\n');
          
          // 设置光标位置到视频后
          quill.setSelection(index + 3);
        }

        toast.success('视频上传成功', { id: 'video-upload' });
      } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : '上传失败';
        toast.error(`视频上传失败: ${errorMessage}`, { id: 'video-upload' });
      }
    };
  }, []);

  // Quill模块配置
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: imageHandler,
        video: videoHandler
      }
    },
    clipboard: {
      matchVisual: false,
    }
  }), [imageHandler, videoHandler]);

  // Quill格式配置
  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'align', 'script',
    'code-block'
  ];

  // 处理内容变化
  const handleChange = useCallback((content: string) => {
    onChange?.(content);
  }, [onChange]);

  if (!isMounted) {
    return (
      <div className={`w-full ${className}`}>
        <div className="relative min-h-[600px] w-full border rounded-lg bg-background flex items-center justify-center">
          <div className="text-muted-foreground">加载编辑器中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`quill-editor ${className}`}>
      <style jsx global>{`
        .quill-editor .ql-editor {
          min-height: 400px;
          font-size: 16px;
          line-height: 1.6;
        }
        
        .quill-editor .ql-toolbar {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .quill-editor .ql-container {
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          font-family: inherit;
        }
        
        /* 图片样式 */
        .quill-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
          display: block;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
        }
        
        .quill-editor .ql-editor img:hover {
          transform: scale(1.02);
        }
        
        /* 视频样式 */
        .quill-editor .ql-editor video {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
          display: block;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          background: #000;
          pointer-events: none;
        }
        
        /* iframe 视频样式（Quill的video embed生成iframe） */
        .quill-editor .ql-editor iframe {
          max-width: 100%;
          height: auto;
          aspect-ratio: 16/9;
          border-radius: 8px;
          margin: 16px 0;
          display: block;
          border: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        /* 本地视频iframe的特殊处理 */
        .quill-editor .ql-editor iframe[src*="/uploads/"] {
          background: #000;
          height: auto;
          aspect-ratio: 16/9;
        }
        
        .quill-editor .ql-snow .ql-tooltip {
          z-index: 9999;
        }
        
        /* 确保媒体内容在编辑器中正确显示 */
        .quill-editor .ql-editor p img,
        .quill-editor .ql-editor p video,
        .quill-editor .ql-editor p iframe {
          margin: 16px auto;
          display: block;
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .quill-editor .ql-toolbar {
            background-color: #1f2937;
            border-color: #374151;
          }
          
          .quill-editor .ql-container {
            background-color: #1f2937;
            border-color: #374151;
            color: #f9fafb;
          }
          
          .quill-editor .ql-editor {
            color: #f9fafb;
          }
          
          .quill-editor .ql-stroke {
            stroke: #9ca3af;
          }
          
          .quill-editor .ql-fill {
            fill: #9ca3af;
          }
          
          .quill-editor .ql-editor img,
          .quill-editor .ql-editor video,
          .quill-editor .ql-editor iframe {
            box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
          }
        }
      `}</style>
      
      <ReactQuill
        forwardedRef={quillRef}
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder="开始编写您的笔记内容..."
      />
    </div>
  );
} 