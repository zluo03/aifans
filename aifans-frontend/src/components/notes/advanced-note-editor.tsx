'use client';

import { useState, useEffect, useCallback } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { Video } from '@/components/editor/video-extension';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth-store';

// 高级扩展集合（仅使用可用的扩展）
const extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
    bulletList: {
      keepMarks: true,
      keepAttributes: false,
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false,
    },
    listItem: {},
    blockquote: {},
    codeBlock: {
      HTMLAttributes: {
        class: 'bg-muted p-4 rounded-md font-mono text-sm',
      },
    },
  }),
  Placeholder.configure({
    placeholder: '开始创作你的笔记...',
  }),
  Image.configure({
    inline: false,
    allowBase64: true,
  }),
  Video.configure({
    inline: false,
    HTMLAttributes: {
      class: 'rounded-lg',
    },
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-primary underline',
    },
  }),
  Underline,
];

interface AdvancedNoteEditorProps {
  initialContent?: any;
  onChange?: (content: any) => void;
  className?: string;
}

export default function AdvancedNoteEditor({ 
  initialContent, 
  onChange, 
  className 
}: AdvancedNoteEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const editor = useEditor({
    extensions,
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg dark:prose-invert focus:outline-none min-h-[400px] p-6 max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-base prose-blockquote:border-l-4 prose-blockquote:border-muted-foreground prose-blockquote:pl-4 prose-blockquote:italic prose-ul:list-disc prose-ol:list-decimal prose-li:my-1',
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getJSON());
      }
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (editor && initialContent && editor.isEmpty) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  // 文件上传处理
  const handleFileUpload = useCallback(async (files: File[]): Promise<Array<{ url: string; key: string }>> => {
    const results = [];
    
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'notes');

        // 从认证store获取token
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
        if (file.type.startsWith('image/')) {
          editor?.chain().focus().setImage({ src: result.url }).run();
        } else if (file.type.startsWith('video/')) {
          // 使用视频扩展插入视频
          editor?.chain().focus().setVideo({ 
            src: result.url, 
            controls: true, 
            width: '100%' 
          }).run();
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
  }, [editor]);

  if (!isMounted) {
    return null;
  }

  if (!editor) {
    return null;
  }

  // 工具栏按钮组件
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

  const insertImage = () => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageDialog(false);
    }
  };

  const insertVideo = () => {
    if (videoUrl && editor) {
      editor.chain().focus().setVideo({ 
        src: videoUrl, 
        controls: true, 
        width: '100%' 
      }).run();
      setVideoUrl('');
      setShowVideoDialog(false);
    }
  };

  const insertLink = () => {
    if (linkUrl && editor) {
      if (linkText) {
        editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run();
      } else {
        editor.chain().focus().setLink({ href: linkUrl }).run();
      }
      setLinkUrl('');
      setLinkText('');
      setShowLinkDialog(false);
    }
  };

  return (
    <div className={`border rounded-lg bg-background ${className}`}>
      {/* 工具栏 */}
      <div className="border-b p-3 bg-muted/20">
        <div className="flex flex-wrap items-center gap-1">
          {/* 撤销/重做 */}
          <div className="flex items-center">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="撤销"
            >
              <Undo className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="重做"
            >
              <Redo className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* 标题级别 */}
          <Select
            value={
              editor.isActive('heading', { level: 1 }) ? '1' :
              editor.isActive('heading', { level: 2 }) ? '2' :
              editor.isActive('heading', { level: 3 }) ? '3' :
              'p'
            }
            onValueChange={(value) => {
              if (value === 'p') {
                editor.chain().focus().setParagraph().run();
              } else {
                const level = parseInt(value) as 1 | 2 | 3;
                editor.chain().focus().setHeading({ level }).run();
              }
            }}
          >
            <SelectTrigger className="w-24 h-8">
              <SelectValue placeholder="样式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p">正文</SelectItem>
              <SelectItem value="1">标题 1</SelectItem>
              <SelectItem value="2">标题 2</SelectItem>
              <SelectItem value="3">标题 3</SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* 文本格式 */}
          <div className="flex items-center">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="加粗"
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="斜体"
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              title="下划线"
            >
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title="删除线"
            >
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* 列表 */}
          <div className="flex items-center">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="无序列表"
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="有序列表"
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="引用"
            >
              <Quote className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* 代码 */}
          <div className="flex items-center">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive('codeBlock')}
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
        <EditorContent editor={editor} className="focus-within:outline-none" />
        
        {/* 文件拖拽上传区域 */}
        <div className="absolute bottom-4 right-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="shadow-lg">
                <Upload className="h-4 w-4 mr-2" />
                上传文件
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>上传文件</DialogTitle>
              </DialogHeader>
              <FileUpload
                onUpload={handleFileUpload}
                maxFiles={10}
                placeholder="拖拽文件到此处或点击上传"
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
} 