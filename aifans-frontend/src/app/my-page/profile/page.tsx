'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks';
import { api } from '@/lib/api/api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Post {
  id: number;
  title?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  likesCount: number;
  favoritesCount: number;
  viewsCount: number;
}

interface Note {
  id: number;
  title: string;
  coverImageUrl?: string;
  likesCount: number;
  favoritesCount: number;
  viewsCount: number;
}

interface FavoriteItem {
  id: number;
  entityId: number;
  entityType: 'POST' | 'NOTE' | 'SCREENING' | 'REQUEST';
  entity: {
    id: number;
    title?: string;
    thumbnailUrl?: string;
    coverImageUrl?: string;
    fileUrl?: string;
  };
}

export default function MyProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ai-works');
  const [myWorks, setMyWorks] = useState<Post[]>([]);
  const [myNotes, setMyNotes] = useState<Note[]>([]);
  const [myFavorites, setMyFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchMyContent = async () => {
      setLoading(true);
      try {
        const [worksRes, notesRes, favoritesRes] = await Promise.all([
          api.get('/users/me/posts'),
          api.get('/users/me/notes'),
          api.get('/users/me/favorites')
        ]);
        
        setMyWorks(worksRes.data.posts || []);
        setMyNotes(notesRes.data.notes || []);
        setMyFavorites(favoritesRes.data.items || []);
      } catch (error) {
        console.error('Error fetching my content:', error);
        toast.error('获取内容失败');
      } finally {
        setLoading(false);
      }
    };

    fetchMyContent();
  }, [user, router]);

  const handleDelete = async (type: 'post' | 'note', id: number) => {
    if (!confirm('确定要删除吗？此操作无法撤销。')) {
      return;
    }

    try {
      if (type === 'post') {
        await api.delete(`/posts/${id}`);
        setMyWorks(myWorks.filter(work => work.id !== id));
      } else if (type === 'note') {
        await api.delete(`/notes/${id}`);
        setMyNotes(myNotes.filter(note => note.id !== id));
      }
      toast.success('删除成功');
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      toast.error('删除失败');
    }
  };

  // 根据收藏项目类型生成对应链接
  const getItemLink = (entityType: string, entityId: number) => {
    switch(entityType) {
      case 'POST':
        return `/inspiration/${entityId}`;
      case 'NOTE':
        return `/notes/${entityId}`;
      case 'SCREENING':
        return `/screenings/${entityId}`;
      case 'REQUEST':
        return `/demands/${entityId}`;
      default:
        return '#';
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">请先登录</h2>
              <Button asChild>
                <Link href="/login">去登录</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">我的个人中心</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <Card className="md:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <div className="relative h-24 w-24 rounded-full overflow-hidden mb-4">
                <Image 
                  src={user.avatarUrl || '/images/default-avatar.png'} 
                  alt={user.nickname} 
                  fill 
                  className="object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold">{user.nickname}</h2>
              <p className="text-muted-foreground mb-4">@{user.username}</p>
              
              {user.role && (
                <Badge className="mb-4">
                  {user.role === 'NORMAL' && '普通用户'}
                  {user.role === 'PREMIUM' && '高级会员'}
                  {user.role === 'LIFETIME' && '终身会员'}
                  {user.role === 'ADMIN' && '管理员'}
                </Badge>
              )}
              
              {user.premiumExpiryDate && (
                <p className="text-sm text-muted-foreground mb-4">
                  会员到期: {format(new Date(user.premiumExpiryDate), 'yyyy-MM-dd', { locale: zhCN })}
                </p>
              )}
              
              <div className="w-full flex flex-col gap-2 mt-4">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/profile">编辑资料</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ai-works">我的作品</TabsTrigger>
              <TabsTrigger value="notes">我的笔记</TabsTrigger>
              <TabsTrigger value="favorites">我的收藏</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ai-works" className="mt-6">
              {loading ? (
                <div className="py-8 text-center">加载中...</div>
              ) : myWorks.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="mb-4">还没有上传作品</p>
                  <Button asChild>
                    <Link href="/inspiration/upload">上传作品</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myWorks.map(work => (
                    <Card key={work.id} className="overflow-hidden">
                      <div className="relative aspect-square">
                        <Image 
                          src={work.thumbnailUrl || work.fileUrl} 
                          alt={work.title || 'AI作品'} 
                          fill 
                          className="object-cover"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium line-clamp-1">{work.title || 'AI作品'}</h3>
                        <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                          <span>❤️ {work.likesCount}</span>
                          <span>👁️ {work.viewsCount}</span>
                          <span>⭐ {work.favoritesCount}</span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button asChild size="sm" variant="outline" className="flex-1">
                            <Link href={`/inspiration/${work.id}/edit`}>编辑</Link>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="flex-1"
                            onClick={() => handleDelete('post', work.id)}
                          >
                            删除
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="notes" className="mt-6">
              {loading ? (
                <div className="py-8 text-center">加载中...</div>
              ) : myNotes.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="mb-4">还没有创建笔记</p>
                  <Button asChild>
                    <Link href="/notes/create">创建笔记</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myNotes.map(note => (
                    <Card key={note.id} className="overflow-hidden">
                      {note.coverImageUrl && (
                        <div className="relative h-40">
                          <Image 
                            src={note.coverImageUrl} 
                            alt={note.title} 
                            fill 
                            className="object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-medium line-clamp-1">{note.title}</h3>
                        <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                          <span>❤️ {note.likesCount}</span>
                          <span>👁️ {note.viewsCount}</span>
                          <span>⭐ {note.favoritesCount}</span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button asChild size="sm" variant="outline" className="flex-1">
                            <Link href={`/notes/${note.id}/edit`}>编辑</Link>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="flex-1"
                            onClick={() => handleDelete('note', note.id)}
                          >
                            删除
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="favorites" className="mt-6">
              {loading ? (
                <div className="py-8 text-center">加载中...</div>
              ) : myFavorites.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>暂无收藏内容</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myFavorites.map(item => {
                    const entity = item.entity;
                    const thumbnailUrl = 
                      entity.thumbnailUrl || 
                      entity.coverImageUrl || 
                      entity.fileUrl || 
                      '/images/placeholder.png';
                    
                    return (
                      <Card key={`${item.entityType}-${item.entityId}`} className="overflow-hidden">
                        <div className="relative aspect-video">
                          <Image 
                            src={thumbnailUrl} 
                            alt={entity.title || '收藏项目'} 
                            fill 
                            className="object-cover"
                          />
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-medium line-clamp-1">{entity.title || '收藏项目'}</h3>
                          <p className="text-xs text-muted-foreground mt-1 mb-2">
                            {item.entityType === 'POST' && '灵感作品'}
                            {item.entityType === 'NOTE' && '笔记'}
                            {item.entityType === 'SCREENING' && '放映'}
                            {item.entityType === 'REQUEST' && '需求'}
                          </p>
                          <Button asChild size="sm" variant="outline" className="w-full">
                            <Link href={getItemLink(item.entityType, item.entityId)}>查看详情</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 