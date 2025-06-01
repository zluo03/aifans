"use client";

import { useEffect, useState, useMemo } from "react";

interface LightweightNoteViewerProps {
  content: string;
  className?: string;
}

// 轻量级HTML渲染器
function LightweightHTMLRenderer({ content, className }: LightweightNoteViewerProps) {
  const htmlContent = useMemo(() => {
    if (!content) return '';
    
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return convertBlocksToHTML(parsed);
      }
      return content;
    } catch (e) {
      // 如果不是JSON，直接显示文本
      return `<p>${content}</p>`;
    }
  }, [content]);

  return (
    <div 
      className={`lightweight-note-viewer prose prose-gray max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      style={{
        lineHeight: '1.6',
        color: 'inherit'
      }}
    />
  );
}

function convertBlocksToHTML(blocks: any[]): string {
  return blocks.map(block => {
    if (!block || !block.type) return '';
    
    const content = Array.isArray(block.content) 
      ? block.content.map((item: any) => {
          if (typeof item === 'string') return item;
          if (item.text) return item.text;
          return '';
        }).join('')
      : (block.content || '');
    
    switch (block.type) {
      case 'paragraph':
        return content ? `<p style="margin: 0.75rem 0; line-height: 1.6;">${content}</p>` : '';
      
      case 'heading':
        const level = block.props?.level || 1;
        const headingStyles = {
          1: 'font-size: 2rem; font-weight: 700; margin: 1.5rem 0 1rem; line-height: 1.2;',
          2: 'font-size: 1.5rem; font-weight: 600; margin: 1.25rem 0 0.75rem; line-height: 1.3;',
          3: 'font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; line-height: 1.4;'
        };
        const style = headingStyles[level as keyof typeof headingStyles] || headingStyles[1];
        return `<h${level} style="${style}">${content}</h${level}>`;
      
      case 'bulletListItem':
        return `<li style="margin: 0.25rem 0; line-height: 1.6;">${content}</li>`;
      
      case 'numberedListItem':
        return `<li style="margin: 0.25rem 0; line-height: 1.6;">${content}</li>`;
      
      case 'image':
        const src = block.props?.url || '';
        const alt = block.props?.caption || '';
        if (!src) return '';
        return `
          <div style="margin: 1.5rem 0; text-align: center;">
            <img 
              src="${src}" 
              alt="${alt}" 
              style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);" 
              oncontextmenu="return false;"
              ondragstart="return false;"
            />
          </div>
        `;
      
      case 'video':
        const videoSrc = block.props?.url || '';
        if (!videoSrc) return '';
        return `
          <div style="margin: 1.5rem 0; text-align: center;">
            <video 
              controls 
              style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);" 
              controlsList="nodownload" 
              disablePictureInPicture
              oncontextmenu="return false;"
            >
              <source src="${videoSrc}" />
              您的浏览器不支持视频播放。
            </video>
          </div>
        `;
      
      case 'audio':
        const audioSrc = block.props?.url || '';
        if (!audioSrc) return '';
        return `
          <div style="margin: 1.5rem 0;">
            <audio 
              controls 
              style="width: 100%;" 
              controlsList="nodownload"
              oncontextmenu="return false;"
            >
              <source src="${audioSrc}" />
              您的浏览器不支持音频播放。
            </audio>
          </div>
        `;
      
      case 'codeBlock':
        const language = block.props?.language || '';
        return `
          <pre style="background: #f6f8fa; border-radius: 6px; padding: 1rem; margin: 1rem 0; overflow-x: auto; font-family: 'Courier New', monospace;">
            <code${language ? ` class="language-${language}"` : ''}>${content}</code>
          </pre>
        `;
      
      default:
        return content ? `<p style="margin: 0.75rem 0; line-height: 1.6;">${content}</p>` : '';
    }
  }).join('');
}

export default function LightweightNoteViewer({ content, className = "" }: LightweightNoteViewerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [showFullEditor, setShowFullEditor] = useState(false);
  const [FullEditor, setFullEditor] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 动态加载完整编辑器
  useEffect(() => {
    if (showFullEditor && !FullEditor) {
      import('@/components/editor/optimized-block-note-viewer').then((module) => {
        setFullEditor(() => module.default);
      });
    }
  }, [showFullEditor, FullEditor]);

  // 检查是否需要完整的BlockNote功能
  const needsFullEditor = useMemo(() => {
    if (!content) return false;
    
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        // 检查是否有复杂的块类型需要完整编辑器
        return parsed.some(block => 
          block.type === 'table' || 
          block.type === 'file' ||
          (block.props && Object.keys(block.props).length > 2) // 复杂属性
        );
      }
    } catch (e) {
      // 不是JSON，使用轻量级渲染器
    }
    return false;
  }, [content]);

  if (!isMounted) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    );
  }

  // 如果需要完整编辑器且用户选择显示
  if (needsFullEditor && showFullEditor && FullEditor) {
    return <FullEditor content={content} className={className} />;
  }

  return (
    <div className={`lightweight-note-viewer ${className}`}>
      <style jsx global>{`
        .lightweight-note-viewer {
          color: inherit;
        }
        
        .lightweight-note-viewer p,
        .lightweight-note-viewer h1,
        .lightweight-note-viewer h2,
        .lightweight-note-viewer h3,
        .lightweight-note-viewer li {
          color: inherit;
        }
        
        .lightweight-note-viewer ul,
        .lightweight-note-viewer ol {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
        }
        
        .lightweight-note-viewer a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        .lightweight-note-viewer a:hover {
          color: #2563eb;
        }
        
        /* 暗色模式支持 */
        .dark .lightweight-note-viewer p,
        .dark .lightweight-note-viewer h1,
        .dark .lightweight-note-viewer h2,
        .dark .lightweight-note-viewer h3,
        .dark .lightweight-note-viewer li {
          color: #e5e5e5;
        }
        
        .dark .lightweight-note-viewer pre {
          background: #2d2d2d !important;
          color: #e5e5e5;
        }
      `}</style>
      
      <LightweightHTMLRenderer content={content} className={className} />
      
      {needsFullEditor && !showFullEditor && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 mb-2">
            此笔记包含复杂内容，建议使用完整编辑器查看以获得最佳体验。
          </p>
          <button
            onClick={() => setShowFullEditor(true)}
            className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
          >
            加载完整编辑器
          </button>
        </div>
      )}
    </div>
  );
} 