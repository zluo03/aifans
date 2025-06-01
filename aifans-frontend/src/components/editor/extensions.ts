import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { Video } from './video-extension';

// 导出扩展集合以供查看和编辑页面使用
export const extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
  }),
  Placeholder.configure({
    placeholder: '开始写笔记...',
  }),
  Image,
  Video.configure({
    inline: false,
    HTMLAttributes: {
      class: 'rounded-lg',
    },
  }),
  Link.configure({
    openOnClick: false,
  }),
  Underline,
]; 