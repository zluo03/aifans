'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/ui/file-upload';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Quote, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Video as VideoIcon,
  Undo,
  Redo,
  Code2,
  Type,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth-store';

interface DocumentEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export default function DocumentEditor({
  value,
  onChange,
  className
}: DocumentEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  
  const editorRef = useRef<HTMLDivElement>(null);
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (editorRef.current && value !== undefined) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // 保存状态到撤销栈
  const saveState = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      undoStackRef.current.push(content);
      if (undoStackRef.current.length > 50) {
        undoStackRef.current.shift();
      }
      redoStackRef.current = [];
    }
  }, []);

  // 处理内容变化
  const handleContentChange = useCallback(() => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // 执行命令
  const execCommand = useCallback((command: string, value?: string) => {
    saveState();
    document.execCommand(command, false, value);
    handleContentChange();
  }, [saveState, handleContentChange]);

  // 撤销
  const undo = useCallback(() => {
    if (undoStackRef.current.length > 0 && editorRef.current) {
      const currentContent = editorRef.current.innerHTML;
      redoStackRef.current.push(currentContent);
      const previousContent = undoStackRef.current.pop()!;
      editorRef.current.innerHTML = previousContent;
      handleContentChange();
    }
  }, [handleContentChange]);

  // 重做
  const redo = useCallback(() => {
    if (redoStackRef.current.length > 0 && editorRef.current) {
      const currentContent = editorRef.current.innerHTML;
      undoStackRef.current.push(currentContent);
      const nextContent = redoStackRef.current.pop()!;
      editorRef.current.innerHTML = nextContent;
      handleContentChange();
    }
  }, [handleContentChange]);

  // 文件上传处理
  const handleFileUpload = useCallback(async (files: File[]): Promise<Array<{ url: string; key: string }>> => {
    const results = [];
    
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'notes');

        const { token } = useAuthStore.getState();
        
        if (!token) {
          toast.error('请先登录');
          results.push({ url: '', key: '' });
          continue;
        }

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
        results.push(result);

        // 自动插入到编辑器
        if (editorRef.current) {
          const selection = window.getSelection();
          let html = '';
          
          if (file.type.startsWith('image/')) {
            html = `<img src="${result.url}" alt="上传的图片" class="max-w-full h-auto rounded-lg my-4" />`;
          } else if (file.type.startsWith('video/')) {
            html = `<video controls class="max-w-full h-auto rounded-lg my-4">
              <source src="${result.url}" type="${file.type}">
              您的浏览器不支持视频播放。
            </video>`;
          }
          
          if (html && selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const div = document.createElement('div');
            div.innerHTML = html;
            range.insertNode(div.firstChild!);
            selection.collapseToEnd();
          }
        }

        toast.success(`${file.name} 上传成功`);
      } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : '上传失败';
        toast.error(`${file.name} ${errorMessage}`);
        results.push({ url: '', key: '' });
      }
    }
    
    return results;
  }, []);

  // 插入图片
  const insertImage = useCallback(() => {
    if (imageUrl) {
      execCommand('insertHTML', `<img src="${imageUrl}" alt="插入的图片" class="max-w-full h-auto rounded-lg my-4" />`);
      setImageUrl('');
      setShowImageDialog(false);
    }
  }, [imageUrl, execCommand]);

  // 插入视频
  const insertVideo = useCallback(() => {
    if (videoUrl) {
      const html = `<video controls class="max-w-full h-auto rounded-lg my-4">
        <source src="${videoUrl}">
        您的浏览器不支持视频播放。
      </video>`;
      execCommand('insertHTML', html);
      setVideoUrl('');
      setShowVideoDialog(false);
    }
  }, [videoUrl, execCommand]);

  // 插入链接
  const insertLink = useCallback(() => {
    if (linkUrl) {
      if (linkText) {
        execCommand('insertHTML', `<a href="${linkUrl}" class="text-blue-600 underline hover:text-blue-800">${linkText}</a>`);
      } else {
        execCommand('createLink', linkUrl);
      }
      setLinkUrl('');
      setLinkText('');
      setShowLinkDialog(false);
    }
  }, [linkUrl, linkText, execCommand]);

  // 设置标题
  const setHeading = useCallback((level: number) => {
    execCommand('formatBlock', `h${level}`);
  }, [execCommand]);

  if (!isMounted) {
    return (
      <div className={`w-full ${className}`}>
        <div className="relative min-h-[600px] w-full border rounded-lg bg-background flex items-center justify-center">
          <div className="text-muted-foreground">加载编辑器中...</div>
        </div>
      </div>
    );
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false, 
    children, 
    title 
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={`h-8 w-8 p-0 ${isActive ? 'bg-primary/10 text-primary' : ''}`}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className={`border rounded-lg bg-background ${className}`}>
      {/* 工具栏 */}
      <div className="border-b p-3 bg-muted/20">
        <div className="flex flex-wrap items-center gap-1">
          {/* 撤销/重做 */}
          <div className="flex items-center">
            <ToolbarButton
              onClick={undo}
              disabled={undoStackRef.current.length === 0}
              title="撤销"
            >
              <Undo className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={redo}
              disabled={redoStackRef.current.length === 0}
              title="重做"
            >
              <Redo className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* 标题 */}
          <div className="flex items-center">
            <ToolbarButton
              onClick={() => execCommand('formatBlock', 'p')}
              title="正文"
            >
              <Type className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setHeading(1)}
              title="标题 1"
            >
              <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setHeading(2)}
              title="标题 2"
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setHeading(3)}
              title="标题 3"
            >
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* 文本格式 */}
          <div className="flex items-center">
            <ToolbarButton
              onClick={() => execCommand('bold')}
              title="加粗"
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => execCommand('italic')}
              title="斜体"
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => execCommand('underline')}
              title="下划线"
            >
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => execCommand('strikeThrough')}
              title="删除线"
            >
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* 列表和引用 */}
          <div className="flex items-center">
            <ToolbarButton
              onClick={() => execCommand('insertUnorderedList')}
              title="无序列表"
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => execCommand('insertOrderedList')}
              title="有序列表"
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => execCommand('formatBlock', 'blockquote')}
              title="引用"
            >
              <Quote className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* 代码 */}
          <div className="flex items-center">
            <ToolbarButton
              onClick={() => execCommand('formatBlock', 'pre')}
              title="代码块"
            >
              <Code2 className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* 插入功能 */}
          <div className="flex items-center">
            <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
              <DialogTrigger asChild>
                <ToolbarButton
                  onClick={() => setShowLinkDialog(true)}
                  title="插入链接"
                >
                  <LinkIcon className="h-4 w-4" />
                </ToolbarButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>插入链接</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>链接地址</Label>
                    <Input
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <Label>链接文本（可选）</Label>
                    <Input
                      value={linkText}
                      onChange={(e) => setLinkText(e.target.value)}
                      placeholder="链接描述"
                    />
                  </div>
                  <Button onClick={insertLink} className="w-full">
                    插入链接
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
              <DialogTrigger asChild>
                <ToolbarButton
                  onClick={() => setShowImageDialog(true)}
                  title="插入图片"
                >
                  <ImageIcon className="h-4 w-4" />
                </ToolbarButton>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>插入图片</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>图片URL</Label>
                    <Input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                    <Button onClick={insertImage} className="mt-2 w-full">
                      插入图片
                    </Button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        或者上传本地图片
                      </span>
                    </div>
                  </div>
                  <FileUpload
                    onUpload={handleFileUpload}
                    accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] }}
                    maxFiles={5}
                    placeholder="拖拽图片到此处或点击上传"
                  />
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
              <DialogTrigger asChild>
                <ToolbarButton
                  onClick={() => setShowVideoDialog(true)}
                  title="插入视频"
                >
                  <VideoIcon className="h-4 w-4" />
                </ToolbarButton>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>插入视频</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>视频URL</Label>
                    <Input
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://example.com/video.mp4"
                    />
                    <Button onClick={insertVideo} className="mt-2 w-full">
                      插入视频
                    </Button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        或者上传本地视频
                      </span>
                    </div>
                  </div>
                  <FileUpload
                    onUpload={handleFileUpload}
                    accept={{ 'video/*': ['.mp4', '.webm', '.mov'] }}
                    maxFiles={3}
                    placeholder="拖拽视频到此处或点击上传"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* 编辑器内容区域 */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
              e.preventDefault();
              undo();
            } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
              e.preventDefault();
              redo();
            } else if (e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete') {
              setTimeout(saveState, 0);
            }
          }}
          className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert focus:outline-none min-h-[600px] p-6 max-w-none"
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        />
      </div>
    </div>
  );
} 