"use client";

import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { PartialBlock } from "@blocknote/core";

// 懒加载BlockNote组件
const LazyBlockNoteView = lazy(async () => {
  const module = await import("@blocknote/mantine");
  return { default: module.BlockNoteView };
});

interface OptimizedBlockNoteViewerProps {
  content: string;
  className?: string;
}

// 简单的HTML渲染器作为fallback
function SimpleHTMLRenderer({ content }: { content: string }) {
  const htmlContent = useMemo(() => {
    if (!content) return '';
    
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return convertBlocksToHTML(parsed);
      }
      return content;
    } catch (e) {
      return content;
    }
  }, [content]);

  return (
    <div 
      className="prose prose-gray max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

function convertBlocksToHTML(blocks: any[]): string {
  return blocks.map(block => {
    if (!block || !block.type) return '';
    
    const content = block.content || '';
    
    switch (block.type) {
      case 'paragraph':
        return `<p>${content}</p>`;
      case 'heading':
        const level = block.props?.level || 1;
        return `<h${level}>${content}</h${level}>`;
      case 'bulletListItem':
        return `<li>${content}</li>`;
      case 'numberedListItem':
        return `<li>${content}</li>`;
      case 'image':
        const src = block.props?.url || '';
        const alt = block.props?.caption || '';
        return src ? `<img src="${src}" alt="${alt}" style="max-width: 100%; height: auto; margin: 1rem 0; border-radius: 8px;" />` : '';
      case 'video':
        const videoSrc = block.props?.url || '';
        return videoSrc ? `<video controls style="max-width: 100%; height: auto; margin: 1rem 0; border-radius: 8px;" controlsList="nodownload" disablePictureInPicture><source src="${videoSrc}" /></video>` : '';
      case 'audio':
        const audioSrc = block.props?.url || '';
        return audioSrc ? `<audio controls style="width: 100%; margin: 1rem 0;" controlsList="nodownload"><source src="${audioSrc}" /></audio>` : '';
      default:
        return `<p>${content}</p>`;
    }
  }).join('');
}

// 实际的BlockNote查看器组件
function ActualBlockNoteViewer({ content, className }: OptimizedBlockNoteViewerProps) {
  const [blocks, setBlocks] = useState<PartialBlock[]>([]);
  const [isReady, setIsReady] = useState(false);

  // 解析内容
  const parsedBlocks = useMemo(() => {
    if (!content) return [];
    
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [{ type: "paragraph", content: content }];
    }
  }, [content]);

  useEffect(() => {
    if (parsedBlocks.length > 0) {
      setBlocks(parsedBlocks);
      requestAnimationFrame(() => setIsReady(true));
    }
  }, [parsedBlocks]);

  // 动态导入useCreateBlockNote
  const [editor, setEditor] = useState<any>(null);

  useEffect(() => {
    if (isReady && blocks.length > 0) {
      // 动态加载编辑器
      import("@blocknote/react").then(({ useCreateBlockNote }) => {
        const editorInstance = useCreateBlockNote({
          initialContent: blocks,
        });
        setEditor(editorInstance);
      });
    }
  }, [isReady, blocks]);

  if (!editor) {
    return <SimpleHTMLRenderer content={content} />;
  }

  return (
    <div className={`blocknote-viewer ${className}`}>
      <style jsx global>{`
        /* 只读查看器样式 - 内联加载 */
        .blocknote-viewer .bn-container .bn-editor {
          min-height: auto;
          padding: 0;
          background: transparent;
          border: none;
          color: inherit;
        }
        
        .blocknote-viewer .bn-container .bn-editor .ProseMirror {
          background: transparent;
          color: inherit;
        }
        
        .blocknote-viewer .bn-side-menu,
        .blocknote-viewer .bn-formatting-toolbar,
        .blocknote-viewer .bn-hyperlink-toolbar,
        .blocknote-viewer .bn-drag-handle,
        .blocknote-viewer .bn-add-block-button {
          display: none !important;
        }
        
        .blocknote-viewer img,
        .blocknote-viewer video {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 1rem 0;
          border-radius: 8px;
        }
      `}</style>
      <Suspense fallback={<SimpleHTMLRenderer content={content} />}>
        <LazyBlockNoteView
          editor={editor}
          editable={false}
          theme="light"
        />
      </Suspense>
    </div>
  );
}

export default function OptimizedBlockNoteViewer({ content, className = "" }: OptimizedBlockNoteViewerProps) {
  const [shouldLoadFullEditor, setShouldLoadFullEditor] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // 延迟加载完整编辑器，先显示简单版本
    const timer = setTimeout(() => {
      setShouldLoadFullEditor(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    );
  }

  // 首先显示简单的HTML渲染器，然后升级到完整的BlockNote
  if (!shouldLoadFullEditor) {
    return <SimpleHTMLRenderer content={content} />;
  }

  return (
    <Suspense fallback={<SimpleHTMLRenderer content={content} />}>
      <ActualBlockNoteViewer content={content} className={className} />
    </Suspense>
  );
} 