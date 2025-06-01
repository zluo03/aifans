'use client';

import React from 'react';

interface SimpleNoteViewerProps {
  content: string;
  className?: string;
}

export default function SimpleNoteViewer({ content, className = "" }: SimpleNoteViewerProps) {
  // 解析内容
  const parseContent = (content: string) => {
    if (!content) return '';
    
    try {
      // 尝试解析为 JSON（BlockNote 格式）
      const parsed = JSON.parse(content);
      
      if (Array.isArray(parsed)) {
        // BlockNote 格式：转换为 HTML
        return convertBlockNoteToHtml(parsed);
      } else {
        // 其他 JSON 格式，直接返回字符串
        return content;
      }
    } catch (e) {
      // 如果不是 JSON，可能是 HTML 或纯文本
      return content;
    }
  };

  // 将 BlockNote 格式转换为 HTML
  const convertBlockNoteToHtml = (blocks: any[]): string => {
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
          return src ? `<img src="${src}" alt="${alt}" style="max-width: 100%; height: auto; margin: 1rem 0;" />` : '';
        case 'video':
          const videoSrc = block.props?.url || '';
          return videoSrc ? `<video controls style="max-width: 100%; height: auto; margin: 1rem 0;" controlsList="nodownload" disablePictureInPicture><source src="${videoSrc}" /></video>` : '';
        case 'audio':
          const audioSrc = block.props?.url || '';
          return audioSrc ? `<audio controls style="width: 100%; margin: 1rem 0;" controlsList="nodownload"><source src="${audioSrc}" /></audio>` : '';
        case 'table':
          // 简单的表格处理
          if (block.content && Array.isArray(block.content.rows)) {
            const rows = block.content.rows.map((row: any[]) => {
              const cells = row.map(cell => `<td>${cell}</td>`).join('');
              return `<tr>${cells}</tr>`;
            }).join('');
            return `<table style="border-collapse: collapse; width: 100%; margin: 1rem 0;"><tbody>${rows}</tbody></table>`;
          }
          return '';
        default:
          return `<p>${content}</p>`;
      }
    }).join('');
  };

  const htmlContent = parseContent(content);

  // 禁用右键菜单和拖拽
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  return (
    <div 
      className={`simple-note-viewer prose prose-gray max-w-none ${className}`}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
    >
      <style jsx>{`
        .simple-note-viewer {
          line-height: 1.6;
          color: inherit;
        }
        
        .simple-note-viewer h1,
        .simple-note-viewer h2,
        .simple-note-viewer h3,
        .simple-note-viewer h4,
        .simple-note-viewer h5,
        .simple-note-viewer h6 {
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: inherit;
        }
        
        .simple-note-viewer h1 { font-size: 2rem; }
        .simple-note-viewer h2 { font-size: 1.5rem; }
        .simple-note-viewer h3 { font-size: 1.25rem; }
        
        .simple-note-viewer p {
          margin-bottom: 1rem;
          color: inherit;
        }
        
        .simple-note-viewer ul,
        .simple-note-viewer ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }
        
        .simple-note-viewer li {
          margin-bottom: 0.5rem;
          color: inherit;
        }
        
        .simple-note-viewer img,
        .simple-note-viewer video,
        .simple-note-viewer audio {
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .simple-note-viewer table {
          border: 1px solid #e5e7eb;
        }
        
        .simple-note-viewer td {
          padding: 0.5rem;
          border: 1px solid #e5e7eb;
          color: inherit;
        }
        
        /* 暗色模式 */
        .dark .simple-note-viewer table,
        .dark .simple-note-viewer td {
          border-color: #374151;
        }
        
        /* 禁用选择和拖拽 */
        .simple-note-viewer img,
        .simple-note-viewer video {
          user-select: none;
          -webkit-user-drag: none;
          -khtml-user-drag: none;
          -moz-user-drag: none;
          -o-user-drag: none;
        }
      `}</style>
      
      <div 
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
      />
    </div>
  );
} 