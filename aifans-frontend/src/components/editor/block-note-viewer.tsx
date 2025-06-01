"use client";

import { useEffect, useState, useMemo } from "react";
import { PartialBlock } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/react/style.css";
import "@blocknote/mantine/style.css";

interface BlockNoteViewerProps {
  content: string;
  className?: string;
}

export default function BlockNoteViewer({ content, className = "" }: BlockNoteViewerProps) {
  const [blocks, setBlocks] = useState<PartialBlock[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 检查是否在客户端
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 使用useMemo优化内容解析
  const parsedBlocks = useMemo(() => {
    if (!content || !isMounted) return [];
    
    try {
      // 尝试解析为 JSON（BlockNote 格式）
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      // 如果不是 JSON，创建一个包含内容的段落块
      return [
        {
          type: "paragraph",
          content: content,
        },
      ];
    }
  }, [content, isMounted]);

  // 解析内容
  useEffect(() => {
    if (parsedBlocks.length > 0) {
      setBlocks(parsedBlocks);
      // 使用requestAnimationFrame优化渲染时机
      requestAnimationFrame(() => {
        setIsReady(true);
      });
    }
  }, [parsedBlocks]);

  // 创建只读编辑器 - 使用useMemo优化
  const editor = useCreateBlockNote({
    initialContent: blocks.length > 0 && isReady ? blocks : undefined,
  });

  // 当blocks更新时，更新编辑器内容
  useEffect(() => {
    if (editor && blocks.length > 0 && isReady) {
      console.log('更新编辑器内容:', blocks);
      editor.replaceBlocks(editor.document, blocks);
    }
  }, [blocks, editor, isReady]);

  // 禁用视频下载功能
  useEffect(() => {
    if (isReady && isMounted) {
      // 使用 MutationObserver 监听 DOM 变化
      const observer = new MutationObserver(() => {
        const videos = document.querySelectorAll('.blocknote-viewer video');
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
        const images = document.querySelectorAll('.blocknote-viewer img');
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
      const videos = document.querySelectorAll('.blocknote-viewer video');
      videos.forEach((video) => {
        video.setAttribute('controlsList', 'nodownload');
        video.setAttribute('disablePictureInPicture', 'true');
        (video as HTMLVideoElement).oncontextmenu = (e) => {
          e.preventDefault();
          return false;
        };
      });

      // 立即处理图片
      const images = document.querySelectorAll('.blocknote-viewer img');
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
    return <div className={`blocknote-viewer ${className}`}>加载中...</div>;
  }

  return (
    <div className={`blocknote-viewer ${className}`}>
      <style jsx global>{`
        /* 只读查看器样式 */
        .blocknote-viewer .bn-container .bn-editor {
          min-height: auto;
          padding: 0;
          background: transparent;
          border: none;
          color: inherit;
        }
        
        /* 编辑器内容区域文本颜色 */
        .blocknote-viewer .bn-container .bn-editor .ProseMirror {
          background: transparent;
          color: inherit;
        }
        
        /* 确保所有文本元素继承颜色 */
        .blocknote-viewer .bn-container .bn-editor p,
        .blocknote-viewer .bn-container .bn-editor h1,
        .blocknote-viewer .bn-container .bn-editor h2,
        .blocknote-viewer .bn-container .bn-editor h3,
        .blocknote-viewer .bn-container .bn-editor li,
        .blocknote-viewer .bn-container .bn-editor td,
        .blocknote-viewer .bn-container .bn-editor th {
          color: inherit;
        }
        
        /* 暗色模式下的文本颜色 */
        .dark .blocknote-viewer .bn-container .bn-editor p,
        .dark .blocknote-viewer .bn-container .bn-editor h1,
        .dark .blocknote-viewer .bn-container .bn-editor h2,
        .dark .blocknote-viewer .bn-container .bn-editor h3,
        .dark .blocknote-viewer .bn-container .bn-editor li,
        .dark .blocknote-viewer .bn-container .bn-editor td,
        .dark .blocknote-viewer .bn-container .bn-editor th {
          color: #e5e5e5;
        }
        
        /* 隐藏编辑相关的UI元素 */
        .blocknote-viewer .bn-side-menu,
        .blocknote-viewer .bn-formatting-toolbar,
        .blocknote-viewer .bn-hyperlink-toolbar,
        .blocknote-viewer .bn-drag-handle,
        .blocknote-viewer .bn-add-block-button {
          display: none !important;
        }
        
        /* 禁用选择和编辑 */
        .blocknote-viewer .bn-block-content {
          user-select: text;
          cursor: default;
        }
        
        /* 图片和视频样式 - 更具体的选择器 */
        .blocknote-viewer .bn-block[data-content-type="image"],
        .blocknote-viewer .bn-block[data-content-type="video"],
        .blocknote-viewer .bn-block[data-content-type="audio"] {
          margin: 1.5rem 0;
          width: 100%;
        }
        
        .blocknote-viewer .bn-block[data-content-type="image"] img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 0 auto;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .blocknote-viewer .bn-block[data-content-type="video"] video {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 0 auto;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .blocknote-viewer .bn-block[data-content-type="audio"] audio {
          width: 100%;
          display: block;
          margin: 0 auto;
        }
        
        /* 媒体容器样式 */
        .blocknote-viewer .bn-visual-media {
          margin: 1.5rem 0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .blocknote-viewer img,
        .blocknote-viewer video {
          max-width: 100%;
          height: auto;
          display: block;
        }
        
        /* 图片块容器 */
        .blocknote-viewer .bn-image-block,
        .blocknote-viewer .bn-video-block,
        .blocknote-viewer .bn-audio-block {
          width: 100%;
          margin: 1rem 0;
        }
        
        .blocknote-viewer .bn-image-block img,
        .blocknote-viewer .bn-video-block video,
        .blocknote-viewer .bn-audio-block audio {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 0 auto;
        }
        
        /* 确保媒体内容可见 */
        .blocknote-viewer [data-content-type="image"],
        .blocknote-viewer [data-content-type="video"],
        .blocknote-viewer [data-content-type="audio"] {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        /* 隐藏视频下载按钮 */
        .blocknote-viewer video::-webkit-media-controls-download-button {
          display: none !important;
        }
        
        .blocknote-viewer video::-webkit-media-controls-enclosure {
          overflow: hidden !important;
        }
        
        .blocknote-viewer video::-webkit-media-controls-panel {
          width: calc(100% + 30px) !important;
        }
        
        /* Firefox 隐藏下载按钮 */
        .blocknote-viewer video::-moz-media-controls-download-button {
          display: none !important;
        }
        
        /* 全屏状态下也隐藏下载按钮 */
        video:fullscreen::-webkit-media-controls-download-button,
        video:-webkit-full-screen::-webkit-media-controls-download-button {
          display: none !important;
        }
        
        /* 为视频添加 controlsList 属性的样式支持 */
        .blocknote-viewer video[controlsList="nodownload"] {
          /* 确保样式正确应用 */
        }
        
        /* 代码块样式 */
        .blocknote-viewer .bn-code-block {
          background: #f6f8fa;
          border-radius: 6px;
          padding: 1rem;
          margin: 1rem 0;
          overflow-x: auto;
        }
        
        .dark .blocknote-viewer .bn-code-block {
          background: #2d2d2d;
          color: #e5e5e5;
        }
        
        /* 引用样式 */
        .blocknote-viewer blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #6b7280;
        }
        
        .dark .blocknote-viewer blockquote {
          color: #9ca3af;
        }
        
        /* 标题样式 */
        .blocknote-viewer h1 {
          font-size: 2rem;
          font-weight: 700;
          margin: 1.5rem 0 1rem;
          line-height: 1.2;
        }
        
        .blocknote-viewer h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.25rem 0 0.75rem;
          line-height: 1.3;
        }
        
        .blocknote-viewer h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem;
          line-height: 1.4;
        }
        
        /* 段落样式 */
        .blocknote-viewer p {
          margin: 0.75rem 0;
          line-height: 1.6;
        }
        
        /* 列表样式 */
        .blocknote-viewer ul,
        .blocknote-viewer ol {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
        }
        
        .blocknote-viewer li {
          margin: 0.25rem 0;
          line-height: 1.6;
        }
        
        /* 链接样式 */
        .blocknote-viewer a {
          color: #3b82f6;
          text-decoration: underline;
          transition: color 0.2s;
        }
        
        .blocknote-viewer a:hover {
          color: #2563eb;
        }
        
        /* 表格样式 */
        .blocknote-viewer table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
          overflow-x: auto;
          display: block;
        }
        
        .blocknote-viewer th,
        .blocknote-viewer td {
          border: 1px solid #e5e7eb;
          padding: 0.5rem;
          text-align: left;
        }
        
        .blocknote-viewer th {
          background: #f9fafb;
          font-weight: 600;
        }
        
        .dark .blocknote-viewer th,
        .dark .blocknote-viewer td {
          border-color: #374151;
          color: #e5e5e5;
        }
        
        .dark .blocknote-viewer th {
          background: #1f2937;
        }
        
        /* 响应式调整 */
        @media (max-width: 640px) {
          .blocknote-viewer h1 {
            font-size: 1.5rem;
          }
          
          .blocknote-viewer h2 {
            font-size: 1.25rem;
          }
          
          .blocknote-viewer h3 {
            font-size: 1.125rem;
          }
        }
      `}</style>
      
      {isReady && (
        <BlockNoteView
          editor={editor}
          editable={false}
          theme="light"
        />
      )}
    </div>
  );
} 