'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Search, Heart, BookmarkIcon, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { notesApi } from '@/lib/api';
import { noteCategoriesApi } from '@/lib/api';
import { Note, NoteCategory } from '@/types';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { CreateNoteButton } from '@/components/notes/create-note-button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/store/auth-store';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MembershipExclusiveDialog } from '@/components/ui/membership-exclusive-dialog';

// 游客访问限制组件
function GuestAccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
      <div className="text-center max-w-md">
        <BookmarkIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">需要登录才能访问</h1>
        <p className="text-gray-600 mb-6">
          笔记页面需要登录后才能浏览。请先登录或注册账号。
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/login">登录</Link>
          </Button>
          <Button asChild>
            <Link href="/register">注册</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// SearchParamsWrapper组件，用于处理searchParams逻辑
function NotesContent() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFavorited, setShowFavorited] = useState(false);
  const [showMyNotes, setShowMyNotes] = useState(false);
  const [showMemberDialog, setShowMemberDialog] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  
  const pageParam = searchParams.get('page');
  const queryParam = searchParams.get('query');
  const categoryParam = searchParams.get('category');
  const favoritedParam = searchParams.get('favorited');
  const myNotesParam = searchParams.get('myNotes');

  useEffect(() => {
    setCurrentPage(pageParam ? parseInt(pageParam) : 1);
    setSearchQuery(queryParam || '');
    setSelectedCategory(categoryParam || '');
    setShowFavorited(favoritedParam === 'true');
    setShowMyNotes(myNotesParam === 'true');
  }, [pageParam, queryParam, categoryParam, favoritedParam, myNotesParam]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await noteCategoriesApi.getAllCategories();
        setCategories(categoriesData);
      } catch (error: any) {
        // 如果是401错误，可能是用户被封禁，不显示错误
        if (error.response?.status === 401) {
          console.log('用户认证失败，可能被封禁');
          return;
        }
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      try {
        let data;
        
        if (showFavorited && user) {
          // 获取收藏的笔记
          data = await notesApi.getFavoritedNotes(currentPage, 12);
        } else if (showMyNotes && user) {
          // 获取我的笔记
          const filters = {
            page: currentPage,
            limit: 12,
            userId: user.id,
            query: searchQuery,
            categoryId: selectedCategory && selectedCategory !== 'all' ? parseInt(selectedCategory) : undefined,
          };
          data = await notesApi.getNotes(filters);
        } else {
          // 获取所有笔记
          const filters = {
            page: currentPage,
            limit: 12,
            query: searchQuery,
            categoryId: selectedCategory && selectedCategory !== 'all' ? parseInt(selectedCategory) : undefined,
          };
          data = await notesApi.getNotes(filters);
        }
        
        setNotes(data.notes);
        setTotalPages(data.meta.totalPages);
      } catch (error: any) {
        // 如果是401错误，可能是用户被封禁，不显示错误
        if (error.response?.status === 401) {
          console.log('用户认证失败，可能被封禁');
          setNotes([]);
          setTotalPages(0);
          return;
        }
        console.error('Error fetching notes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [currentPage, searchQuery, selectedCategory, showFavorited, showMyNotes, user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    params.set('page', '1');
    if (searchQuery) params.set('query', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (showFavorited) params.set('favorited', 'true');
    if (showMyNotes) params.set('myNotes', 'true');
    
    router.push(`/notes?${params.toString()}`);
  };

  const handleToggleFavorited = (checked: boolean) => {
    setShowFavorited(checked);
    if (checked) setShowMyNotes(false); // 互斥
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (checked) {
      params.set('favorited', 'true');
      params.delete('myNotes');
    } else {
      params.delete('favorited');
    }
    router.push(`/notes?${params.toString()}`);
  };

  const handleToggleMyNotes = (checked: boolean) => {
    setShowMyNotes(checked);
    if (checked) setShowFavorited(false); // 互斥
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (checked) {
      params.set('myNotes', 'true');
      params.delete('favorited');
    } else {
      params.delete('myNotes');
    }
    router.push(`/notes?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/notes?${params.toString()}`);
  };

  const handleNoteClick = (e: React.MouseEvent, noteId: number) => {
    e.preventDefault();
    
    if (user?.role === 'NORMAL') {
      setShowMemberDialog(true);
      return;
    }
    
    router.push(`/notes/${noteId}`);
  };

  // 检查访问权限
  if (!isAuthenticated) {
    return <GuestAccessDenied />;
  }

  return (
    <>
      <style jsx global>{`
        .note-card {
          position: relative;
          border: 1px solid hsl(var(--border));
          background: #e6e7e7;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          color: #1a1a1a;
          border-radius: 0.375rem; /* 6px rounded corners */
          transition: all 0.3s ease;
        }
        
        .note-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: inherit;
          padding: 2px;
          background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: xor;
          -webkit-mask-composite: xor;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        
        .note-card:hover::before {
          opacity: 0.6;
        }
        
        .note-card:hover {
          transform: translateY(-8px) scale(1.01);
          box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.15), 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          border-color: hsl(var(--primary) / 0.5);
        }
        
        .note-card h3 {
          color: #1a1a1a;
          transition: color 0.3s ease;
        }
        
        .note-card .text-muted-foreground {
          color: #4a4a4a !important;
        }
        
        .note-card svg {
          color: #4a4a4a;
          transition: color 0.3s ease;
        }
        
        .note-card .badge {
          color: #1a1a1a !important;
          border-color: #4a4a4a !important;
        }
        
        .note-card:hover h3 {
          color: hsl(var(--primary));
        }
        
        .note-card:hover svg {
          color: hsl(var(--primary));
        }
        
        .note-card-image {
          border-radius: 0.375rem 0.375rem 0 0; /* 只有顶部圆角 */
        }
        
        @media (prefers-color-scheme: dark) {
          .note-card {
            background: #e6e7e7;
            border-color: #d1d1d1;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.15), 0 1px 2px 0 rgba(0, 0, 0, 0.1);
            color: #1a1a1a;
          }
          
          .note-card h3 {
            color: #1a1a1a;
          }
          
          .note-card .text-muted-foreground {
            color: #4a4a4a !important;
          }
          
          .note-card svg {
            color: #4a4a4a;
          }
          
          .note-card .badge {
            color: #1a1a1a !important;
            border-color: #4a4a4a !important;
          }
          
          .note-card:hover h3 {
            color: hsl(var(--primary));
          }
          
          .note-card:hover svg {
            color: hsl(var(--primary));
          }
        }
      `}</style>
      
      <div className="flex flex-col h-[calc(100vh-172px)] max-h-[calc(100vh-172px)] overflow-hidden">
        {/* 头部区域 */}
        <div className="p-4 flex-shrink-0">
          <div className="max-w-7xl mx-auto">
            {/* 筛选和搜索 */}
            <div className="mb-2">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="全部分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex flex-1 gap-2">
                  <Input
                    placeholder="搜索笔记..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                  
                  {/* 筛选开关 */}
                  <div className="flex items-center space-x-2 whitespace-nowrap">
                    <Switch
                      id="favorited"
                      checked={showFavorited}
                      onCheckedChange={handleToggleFavorited}
                      disabled={!user}
                    />
                    <Label htmlFor="favorited" className={`text-sm ${!user ? 'text-gray-400' : ''}`}>
                      我的收藏
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 whitespace-nowrap">
                    <Switch
                      id="myNotes"
                      checked={showMyNotes}
                      onCheckedChange={handleToggleMyNotes}
                      disabled={!user}
                    />
                    <Label htmlFor="myNotes" className={`text-sm ${!user ? 'text-gray-400' : ''}`}>
                      我的笔记
                    </Label>
                  </div>
                  
                  {/* 创建按钮 */}
                  <CreateNoteButton />
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 content-scrollbar">
          <div className="max-w-7xl mx-auto pb-6">
            {/* 笔记列表 */}
            {loading ? (
              // 加载中状态
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div>
                      <Skeleton className="h-40 w-full" />
                    </div>
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : notes.length === 0 ? (
              // 无数据状态
              <div className="text-center py-16">
                <p className="text-xl mb-4">暂无笔记</p>
                <p className="text-gray-500 mb-8">创建新笔记或调整筛选条件</p>
                <Button asChild>
                  <Link href="/notes/create">创建笔记</Link>
                </Button>
              </div>
            ) : (
              // 笔记列表
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notes.map((note) => (
                  <div 
                    key={note.id}
                    onClick={(e) => handleNoteClick(e, note.id)}
                    className="cursor-pointer"
                  >
                    <div className="note-card h-full overflow-hidden transition-all duration-300 group relative">
                      {/* 封面图片 - 完全无边框，超出卡片边界 */}
                      {note.coverImageUrl && (
                        <div className="absolute top-0 left-0 right-0 h-48 w-full z-10">
                          <Image
                            src={note.coverImageUrl}
                            alt={note.title}
                            fill
                            className="object-cover note-card-image"
                          />
                          {/* 图片上的渐变遮罩 */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      )}
                      
                      {/* 内容区域 - 为封面图片留出空间 */}
                      <div className={`relative z-20 ${note.coverImageUrl ? 'mt-48' : ''}`}>
                        <CardContent className="p-4">
                          {/* 第1行：左侧类别，右侧作者昵称和头像 */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-shrink-0">
                              {note.category && (
                                <Badge variant="outline" className="text-xs badge">
                                  {note.category.name}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                              <span className="truncate">{note.user.nickname || note.user.username}</span>
                              <div className="w-6 h-6 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                                {note.user.avatarUrl ? (
                                  <Image
                                    src={note.user.avatarUrl}
                                    alt={note.user.nickname || note.user.username}
                                    width={24}
                                    height={24}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xs font-medium">
                                    {(note.user.nickname || note.user.username)[0].toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* 第2行：左侧统计数据，右侧创建日期 */}
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3.5 w-3.5" /> 
                                {note.viewsCount || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="h-3.5 w-3.5" /> 
                                {note.likesCount || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <BookmarkIcon className="h-3.5 w-3.5" /> 
                                {note.favoritesCount || 0}
                              </span>
                            </div>
                            
                            <div className="text-xs">
                              {new Date(note.createdAt).toLocaleDateString('zh-CN')}
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <MembershipExclusiveDialog open={showMemberDialog} onOpenChange={setShowMemberDialog} />
    </>
  );
}

// 主页组件
export default function NotesPage() {
  return (
    <Suspense fallback={<div className="flex flex-col h-[calc(100vh-172px)] max-h-[calc(100vh-172px)] overflow-hidden">
      <div className="p-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-16 w-full mb-2" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 content-scrollbar">
        <div className="max-w-7xl mx-auto pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>}>
      <NotesContent />
    </Suspense>
  );
} 