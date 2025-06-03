"use client";

import { useEffect, useState, useRef } from "react";
import { PartialBlock } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/react/style.css";
import "@blocknote/mantine/style.css";
import { toast } from "sonner";
import axios from "axios";
import { useAuthStore } from "@/lib/store/auth-store";
import { processImageUrl } from "@/lib/utils/image-url";
import { api } from "@/lib/api";
import { getUploadLimit } from "@/lib/utils/upload-limits";

interface BlockNoteEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  uploadUrl?: string;
}

// 自定义上传函数
const uploadFile = async (file: File): Promise<string> => {
  try {
    // 获取文件类型
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    const isArchive = file.name.match(/\.(zip|7z|tar|gz|rar|dmg)$/i) !== null;
    
    console.log('准备上传文件:', {
      name: file.name,
      size: file.size,
      type: file.type,
      isImage,
      isVideo,
      isAudio,
      isArchive
    });
    
    // 从认证store获取token
    const { token } = useAuthStore.getState();
    console.log('Token存在:', !!token);

    if (!token) {
      toast.error('请先登录');
      throw new Error('请先登录');
    }

    // 获取资源模块的上传限制
    let maxSizeMB = 5; // 默认图片大小限制5MB
    try {
      // 使用新的getUploadLimit函数获取上传限制
      const limit = await getUploadLimit('resources');
      
      if (isImage && limit.imageMaxSizeMB) {
        maxSizeMB = limit.imageMaxSizeMB;
      } else if (isVideo && limit.videoMaxSizeMB) {
        maxSizeMB = limit.videoMaxSizeMB;
      } else if (isAudio) {
        // 音频文件使用配置的限制或默认20MB
        maxSizeMB = limit.audioMaxSizeMB || 20;
      } else if (isArchive) {
        // 压缩文件限制
        maxSizeMB = 500;
      }
    } catch (limitError) {
      console.warn('获取上传限制失败，使用默认值', limitError);
      // 使用默认值
      if (isImage) maxSizeMB = 5; // 图片默认5MB
      if (isVideo) maxSizeMB = 50; // 视频默认50MB
      if (isAudio) maxSizeMB = 20; // 音频默认20MB
      if (isArchive) maxSizeMB = 500; // 压缩文件默认500MB
    }
    
    // 验证文件大小
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      const fileTypeText = isImage ? '图片' : 
                           isVideo ? '视频' : 
                           isAudio ? '音频' : 
                           isArchive ? '压缩文件' : '文件';
      const errorMsg = `${fileTypeText}大小不能超过${maxSizeMB}MB，当前大小: ${fileSizeMB.toFixed(2)}MB`;
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    // 设置正确的文件夹
    let folder = 'resources';
    if (isVideo) folder = 'resources/videos';
    else if (isImage) folder = 'resources/images';
    else if (isAudio) folder = 'resources/audios';
    else if (isArchive) folder = 'resources/archives';
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    // 直接使用后端API上传
    const response = await api.post('/storage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('上传响应:', response);

    if (!response || !response.data || !response.data.url) {
      throw new Error('上传失败：未返回文件URL');
    }

    // 直接返回原始URL，不添加时间戳
    const url = response.data.url;
    console.log('上传成功，文件URL:', url);
    
    const fileTypeText = isImage ? '图片' : 
                         isVideo ? '视频' : 
                         isAudio ? '音频' : 
                         isArchive ? '压缩文件' : '文件';
    toast.success(`${fileTypeText}上传成功`);
    return url;
  } catch (error) {
    console.error('文件上传失败:', error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || error.message;
      toast.error(`文件上传失败: ${message}`);
    } else if (error instanceof Error) {
      toast.error(`文件上传失败: ${error.message}`);
    } else {
      toast.error("文件上传失败: 未知错误");
    }
    throw error;
  }
};

export default function BlockNoteEditorComponent({
  initialContent,
  onChange,
  onSave,
  placeholder = "输入 '/' 查看命令菜单...",
  editable = true,
  uploadUrl = "/api/storage/upload",
}: BlockNoteEditorProps) {
  const [blocks, setBlocks] = useState<PartialBlock[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 检查是否在客户端
  useEffect(() => {
    setIsMounted(true);
    
    // 清理函数
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 解析初始内容
  useEffect(() => {
    if (initialContent && isMounted) {
      try {
        const parsed = JSON.parse(initialContent);
        console.log("解析的初始内容:", parsed);
        setBlocks(parsed);
        // 延迟设置ready状态，确保DOM已经准备好
        setTimeout(() => setIsReady(true), 100);
      } catch (e) {
        console.log("内容不是JSON格式，作为纯文本处理");
        // 如果不是 JSON，尝试转换为块格式
        setBlocks([
          {
            type: "paragraph",
            content: initialContent,
          },
        ]);
        setTimeout(() => setIsReady(true), 100);
      }
    } else if (!initialContent && isMounted) {
      // 如果没有初始内容，直接设置为ready
      setIsReady(true);
    }
  }, [initialContent, isMounted]);

  // 创建编辑器实例 - 只在blocks准备好后创建，使用useMemo避免重复创建
  const editor = useCreateBlockNote({
    initialContent: blocks.length > 0 && isReady ? blocks : undefined,
    uploadFile: uploadFile,
  });

  // 当blocks更新时，更新编辑器内容 - 只在初始化时执行一次
  useEffect(() => {
    if (editor && blocks.length > 0 && isReady && initialContent) {
      console.log('初始化编辑器内容:', blocks);
      editor.replaceBlocks(editor.document, blocks);
    }
  }, [editor, isReady]); // 移除blocks依赖，避免循环更新

  // 处理内容变化 - 使用防抖避免频繁更新
  const handleChange = () => {
    const blocks = editor.document;
    const jsonContent = JSON.stringify(blocks);
    console.log("内容变化:", jsonContent);
    
    // 使用setTimeout进行防抖，避免频繁触发onChange
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onChange?.(jsonContent);
    }, 300); // 300ms防抖
  };

  // 处理保存快捷键
  useEffect(() => {
    if (!isMounted) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        const blocks = editor.document;
        const jsonContent = JSON.stringify(blocks);
        onSave?.(jsonContent);
        toast.success("已保存");
      }
    };

    if (editable && onSave) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [editor, onSave, editable, isMounted]);

  // 禁用视频下载功能
  useEffect(() => {
    if (isReady && isMounted) {
      // 使用 MutationObserver 监听 DOM 变化
      const observer = new MutationObserver(() => {
        const videos = document.querySelectorAll('.blocknote-wrapper video');
        videos.forEach((video) => {
          video.setAttribute('controlsList', 'nodownload');
          video.setAttribute('disablePictureInPicture', 'true');
          // 禁用右键菜单
          (video as HTMLVideoElement).oncontextmenu = (e) => {
            e.preventDefault();
            return false;
          };
        });

        // 禁用图片右键菜单
        const images = document.querySelectorAll('.blocknote-wrapper img');
        images.forEach((img) => {
          (img as HTMLImageElement).oncontextmenu = (e) => {
            e.preventDefault();
            return false;
          };
          // 禁用拖拽
          (img as HTMLImageElement).ondragstart = (e) => {
            e.preventDefault();
            return false;
          };
        });
      });

      // 开始观察
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // 立即执行一次
      const videos = document.querySelectorAll('.blocknote-wrapper video');
      videos.forEach((video) => {
        video.setAttribute('controlsList', 'nodownload');
        video.setAttribute('disablePictureInPicture', 'true');
        (video as HTMLVideoElement).oncontextmenu = (e) => {
          e.preventDefault();
          return false;
        };
      });

      // 立即处理图片
      const images = document.querySelectorAll('.blocknote-wrapper img');
      images.forEach((img) => {
        (img as HTMLImageElement).oncontextmenu = (e) => {
          e.preventDefault();
          return false;
        };
        (img as HTMLImageElement).ondragstart = (e) => {
          e.preventDefault();
          return false;
        };
      });

      return () => observer.disconnect();
    }
  }, [isReady, isMounted]);

  // 如果还没有挂载到客户端，返回加载状态
  if (!isMounted) {
    return <div className="blocknote-wrapper">加载中...</div>;
  }

  return (
    <div className="blocknote-wrapper">
      <style jsx global>{`
        .blocknote-wrapper {
          height: 100%;
          overflow: auto;
        }
        
        /* 自定义编辑器样式 - 透明背景 */
        .bn-container .bn-editor {
          min-height: 500px;
          padding: 2rem;
          background: transparent;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          color: inherit; /* 继承父元素的文本颜色 */
        }
        
        .dark .bn-container .bn-editor {
          background: transparent;
          color: #e5e5e5;
          border-color: #374151;
        }
        
        /* 编辑器内容区域背景和文本颜色 */
        .bn-container .bn-editor .ProseMirror {
          background: transparent;
          color: inherit;
        }
        
        /* 确保所有文本元素继承颜色 */
        .bn-container .bn-editor p,
        .bn-container .bn-editor h1,
        .bn-container .bn-editor h2,
        .bn-container .bn-editor h3,
        .bn-container .bn-editor li,
        .bn-container .bn-editor td,
        .bn-container .bn-editor th {
          color: inherit;
        }
        
        /* 暗色模式下的文本颜色 */
        .dark .bn-container .bn-editor p,
        .dark .bn-container .bn-editor h1,
        .dark .bn-container .bn-editor h2,
        .dark .bn-container .bn-editor h3,
        .dark .bn-container .bn-editor li,
        .dark .bn-container .bn-editor td,
        .dark .bn-container .bn-editor th {
          color: #e5e5e5;
        }
        
        /* 占位符文本颜色 */
        .bn-container .bn-editor .ProseMirror .is-empty::before {
          color: #9ca3af;
        }
        
        .dark .bn-container .bn-editor .ProseMirror .is-empty::before {
          color: #6b7280;
        }
        
        /* 图片和视频块样式 */
        .bn-block-content[data-content-type="image"],
        .bn-block-content[data-content-type="video"] {
          margin: 1rem 0;
        }
        
        /* 可调整大小的媒体 */
        .bn-block-content[data-content-type="image"] img,
        .bn-block-content[data-content-type="video"] video {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: block;
        }
        
        /* 图片块容器 */
        .bn-image-block,
        .bn-video-block,
        .bn-audio-block {
          width: 100%;
          margin: 1rem 0;
        }
        
        .bn-image-block img,
        .bn-video-block video,
        .bn-audio-block audio {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 0 auto;
        }
        
        /* 确保图片正确显示 - 更具体的选择器 */
        .bn-block[data-content-type="image"],
        .bn-block[data-content-type="image"] .bn-block-content,
        .bn-block[data-content-type="image"] img {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        .bn-block[data-content-type="image"] img {
          max-width: 100%;
          height: auto;
          object-fit: contain;
        }
        
        /* 确保视频正确显示 - 更具体的选择器 */
        .bn-block[data-content-type="video"],
        .bn-block[data-content-type="video"] .bn-block-content,
        .bn-block[data-content-type="video"] video {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        .bn-block[data-content-type="video"] video {
          max-width: 100%;
          height: auto;
          object-fit: contain;
        }
        
        /* 确保音频正确显示 */
        .bn-block[data-content-type="audio"] audio {
          width: 100%;
        }
        
        /* 媒体包装器样式 */
        .bn-visual-media,
        .bn-visual-media-wrapper {
          display: block !important;
          width: 100% !important;
          margin: 1rem 0;
        }
        
        .bn-visual-media img,
        .bn-visual-media video {
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
        }
        
        /* 代码块样式 */
        .bn-block-content[data-content-type="codeBlock"] {
          background: #f6f8fa;
          border-radius: 6px;
          padding: 1rem;
          margin: 1rem 0;
        }
        
        .dark .bn-block-content[data-content-type="codeBlock"] {
          background: #2d2d2d;
          color: #e5e5e5;
        }
        
        /* 引用块样式 */
        .bn-block-content[data-content-type="blockquote"] {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #6b7280;
        }
        
        .dark .bn-block-content[data-content-type="blockquote"] {
          color: #9ca3af;
        }
        
        /* 标题样式 */
        .bn-block-content[data-level="1"] {
          font-size: 2rem;
          font-weight: 700;
          margin: 1.5rem 0 1rem;
        }
        
        .bn-block-content[data-level="2"] {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.25rem 0 0.75rem;
        }
        
        .bn-block-content[data-level="3"] {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem;
        }
        
        /* 列表样式 */
        .bn-block-content[data-content-type="bulletListItem"],
        .bn-block-content[data-content-type="numberedListItem"] {
          margin: 0.25rem 0;
        }
        
        /* 表格样式 */
        .bn-block-content[data-content-type="table"] {
          margin: 1rem 0;
          overflow-x: auto;
        }
        
        .bn-block-content[data-content-type="table"] table {
          border-collapse: collapse;
          width: 100%;
        }
        
        .bn-block-content[data-content-type="table"] th,
        .bn-block-content[data-content-type="table"] td {
          border: 1px solid #e5e7eb;
          padding: 0.5rem;
        }
        
        .dark .bn-block-content[data-content-type="table"] th,
        .dark .bn-block-content[data-content-type="table"] td {
          border-color: #374151;
          color: #e5e5e5;
        }
        
        /* 工具栏样式 */
        .bn-formatting-toolbar {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .dark .bn-formatting-toolbar {
          background: #2d2d2d;
          border-color: #374151;
        }
        
        /* 斜杠菜单样式 */
        .bn-suggestion-menu {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          max-height: 400px;
          overflow-y: auto;
        }
        
        .dark .bn-suggestion-menu {
          background: #2d2d2d;
          border-color: #374151;
        }
        
        /* 隐藏文件上传选项 */
        .bn-suggestion-menu [data-item-type="file"] {
          display: none !important;
        }
        
        /* 隐藏视频下载按钮 */
        .bn-block[data-content-type="video"] video::-webkit-media-controls-download-button {
          display: none !important;
        }
        
        .bn-block[data-content-type="video"] video::-webkit-media-controls-enclosure {
          overflow: hidden !important;
        }
        
        .bn-block[data-content-type="video"] video::-webkit-media-controls-panel {
          width: calc(100% + 30px) !important;
        }
        
        /* Firefox 隐藏下载按钮 */
        .bn-block[data-content-type="video"] video::-moz-media-controls-download-button {
          display: none !important;
        }
        
        /* 通用方法：禁用右键菜单 */
        .bn-block[data-content-type="video"] video {
          /* 禁用右键菜单以防止下载 */
          pointer-events: auto;
        }
        
        /* 全屏状态下也隐藏下载按钮 */
        video:fullscreen::-webkit-media-controls-download-button,
        video:-webkit-full-screen::-webkit-media-controls-download-button {
          display: none !important;
        }
        
        /* 侧边菜单样式 */
        .bn-side-menu {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .dark .bn-side-menu {
          background: #2d2d2d;
          border-color: #374151;
        }
        
        /* 拖拽指示器 */
        .bn-drag-handle {
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .bn-block:hover .bn-drag-handle {
          opacity: 1;
        }
        
        /* 媒体调整手柄 */
        .bn-visual-media-wrapper {
          position: relative;
        }
        
        .bn-visual-media-wrapper:hover .bn-resize-handle {
          opacity: 1;
        }
        
        .bn-resize-handle {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #3b82f6;
          border: 2px solid white;
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.2s;
          cursor: nwse-resize;
        }
        
        .bn-resize-handle.bottom-right {
          bottom: -5px;
          right: -5px;
        }
        
        /* 选中块的样式 */
        .bn-block.bn-is-selected .bn-block-content {
          background-color: rgba(59, 130, 246, 0.05);
        }
        
        .dark .bn-block.bn-is-selected .bn-block-content {
          background-color: rgba(59, 130, 246, 0.1);
        }
      `}</style>
      
      {isReady && (
        <BlockNoteView
          editor={editor}
          editable={editable}
          theme="light"
          onChange={handleChange}
        />
      )}
    </div>
  );
} 