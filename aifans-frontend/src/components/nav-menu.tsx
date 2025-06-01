'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Lightbulb,
  BookOpen,
  Film,
  FileQuestion,
  User,
  Archive
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSpiritPostsStore } from '@/lib/store/spirit-posts-store';

const mainNavLinks = [
  { href: '/', label: '首页', icon: <Home className="w-5 h-5" /> },
  { href: '/inspiration', label: '灵感', icon: <Lightbulb className="w-5 h-5" /> },
  { href: '/notes', label: '笔记', icon: <BookOpen className="w-5 h-5" /> },
  { href: '/creators', label: '创作者', icon: <User className="w-5 h-5" /> },
  { href: '/resources', label: '资源', icon: <Archive className="w-5 h-5" /> },
  { href: '/spirit-posts', label: '灵贴', icon: <FileQuestion className="w-5 h-5" /> },
  { href: '/screenings', label: '影院', icon: <Film className="w-5 h-5" /> },
];

export function NavMenu() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { unreadCount } = useSpiritPostsStore();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;

  return (
    <nav className="flex items-center space-x-12">
      {mainNavLinks.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative py-2 font-medium transition-colors group flex items-center gap-2",
              isActive ? "text-primary" : "text-white hover:text-primary"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            
            {/* 灵贴页面的未读消息红点提醒 */}
            {item.href === '/spirit-posts' && unreadCount.total > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 rounded-full w-3 h-3"></div>
            )}
            
            <div
              className={cn(
                "absolute bottom-0 left-0 w-full h-0.5 bg-secondary transform scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100",
                isActive && "scale-x-100"
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
} 