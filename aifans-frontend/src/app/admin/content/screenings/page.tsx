'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '@/lib/api/api';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Trash2, 
  Eye, 
  ArrowLeft, 
  Video,
  PlusCircle,
  Edit,
  Upload,
  X
} from 'lucide-react';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { processImageUrl } from '@/lib/utils/image-url';
import { getUploadLimit, UploadLimit } from '@/lib/utils/upload-limits';

// 自定义防抖函数
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 定义接口
interface Screening {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  adminUploaderId: number;
  creatorId?: number;
  likesCount: number;
  viewsCount: number;
  createdAt: string;
  adminUploader: {
    id: number;
    nickname: string;
  };
  creator?: {
    id: number;
    nickname: string;
    username: string;
    avatarUrl?: string;
  };
}

interface ScreeningsResponse {
  items: Screening[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function ScreeningsAdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // 状态
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  
  // 创建对话框状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingScreening, setEditingScreening] = useState<Screening | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    creatorId: null as number | null,
    coverFile: null as File | null,
    videoFile: null as File | null
  });
  const [creatorSearch, setCreatorSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<any>(null);
  const [showCreatorDropdown, setShowCreatorDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadLimits, setUploadLimits] = useState<UploadLimit>({ 
    imageMaxSizeMB: 10, 
    videoMaxSizeMB: 500 
  });
  const coverInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  // 权限检查
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/');
      toast.error('没有访问权限');
    }
  }, [user, router]);

  // 获取上传限制
  useEffect(() => {
    const fetchUploadLimits = async () => {
      try {
        const limits = await getUploadLimit('screenings');
        setUploadLimits(limits);
      } catch (error) {
        console.error('获取上传限制失败:', error);
      }
    };
    fetchUploadLimits();
  }, []);

  // 构建查询键
  const queryKey = useMemo(() => ['admin-screenings', page, limit, search], 
    [page, limit, search]
  );

  // 使用React Query获取数据
  const { data: screeningsData, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search
        });
        
        const response = await api.get(`/admin/screenings?${params}`);
        const data = response.data;
        
        // 后端返回的是 { screenings: [...], meta: {...} }，需要转换为前端期望的格式
        return {
          items: Array.isArray(data?.screenings) ? data.screenings : [],
          meta: data?.meta || { total: 0, page: 1, limit: 10, totalPages: 0 }
        };
      } catch (error) {
        console.error('获取影院数据失败:', error);
        // 返回默认数据结构
        return {
          items: [],
          meta: { total: 0, page: 1, limit: 10, totalPages: 0 }
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5分钟
  });

  // 防抖搜索
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearch(value);
      setPage(1);
    }, 500),
    []
  );

  // 处理搜索输入
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  // 处理搜索提交
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearch((e.target as HTMLFormElement).querySelector('input')?.value || '');
    setPage(1);
  };

  // 打开创建对话框
  const handleOpenCreateDialog = () => {
    setFormData({
      title: '',
      description: '',
      creatorId: null,
      coverFile: null,
      videoFile: null
    });
    setSelectedCreator(null);
    setCreatorSearch('');
    setSearchResults([]);
    setShowCreatorDropdown(false);
    setIsCreateDialogOpen(true);
  };

  // 打开编辑对话框
  const handleOpenEditDialog = (screening: Screening) => {
    setEditingScreening(screening);
    setFormData({
      title: screening.title,
      description: screening.description,
      creatorId: (screening as any).creatorId || null,
      coverFile: null,
      videoFile: null
    });
    setSelectedCreator((screening as any).creator || null);
    setCreatorSearch('');
    setSearchResults([]);
    setShowCreatorDropdown(false);
    setIsEditDialogOpen(true);
  };

  // 搜索创作者
  const searchCreators = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowCreatorDropdown(false);
      return;
    }

    try {
      // 修改API路径，使用相对路径避免被代理到后端
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=10`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      // 适配返回数据结构
      const users = data?.items || [];
      setSearchResults(users);
      setShowCreatorDropdown(true);
    } catch (error) {
      console.error('搜索创作者失败:', error);
      setSearchResults([]);
      setShowCreatorDropdown(false);
    }
  };

  // 选择创作者
  const handleSelectCreator = (creator: any) => {
    setSelectedCreator(creator);
    setFormData({ ...formData, creatorId: creator.id });
    setCreatorSearch(creator.nickname);
    setShowCreatorDropdown(false);
  };

  // 清除创作者选择
  const handleClearCreator = () => {
    setSelectedCreator(null);
    setFormData({ ...formData, creatorId: null });
    setCreatorSearch('');
    setSearchResults([]);
    setShowCreatorDropdown(false);
  };

  // 处理文件上传
  const handleFileUpload = (file: File, type: 'cover' | 'video') => {
    if (type === 'cover') {
      // 检查封面图片大小
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > uploadLimits.imageMaxSizeMB) {
        toast.error(`封面图片大小不能超过${uploadLimits.imageMaxSizeMB}MB`);
        return;
      }
      setFormData({ ...formData, coverFile: file });
    } else {
      // 检查视频文件大小
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > uploadLimits.videoMaxSizeMB) {
        toast.error(`视频文件大小不能超过${uploadLimits.videoMaxSizeMB}MB`);
        return;
      }
      setFormData({ ...formData, videoFile: file });
    }
  };

  // 处理创建影片
  const handleCreateScreening = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // 表单验证
    if (!formData.title || !formData.videoFile) {
      toast.error('请填写必要字段并上传视频');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      if (formData.creatorId) formDataToSend.append('creatorId', formData.creatorId.toString());
      if (formData.coverFile) formDataToSend.append('thumbnail', formData.coverFile);
      if (formData.videoFile) formDataToSend.append('video', formData.videoFile);
      
      const response = await api.post('/admin/screenings', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success('成功创建影片');
      setIsCreateDialogOpen(false);
      
      // 刷新数据
      queryClient.invalidateQueries({ queryKey: ['admin-screenings'] });
    } catch (error: any) {
      toast.error(error.message || '创建失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理编辑影片提交
  const handleUpdateScreening = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !editingScreening) return;

    // 表单验证
    if (!formData.title) {
      toast.error('请填写标题');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      if (formData.creatorId) formDataToSend.append('creatorId', formData.creatorId.toString());
      if (formData.coverFile) formDataToSend.append('thumbnail', formData.coverFile);
      if (formData.videoFile) formDataToSend.append('video', formData.videoFile);
      
      const response = await api.patch(`/admin/screenings/${editingScreening.id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success('成功更新影片');
      setIsEditDialogOpen(false);
      setEditingScreening(null);
      
      // 刷新数据
      queryClient.invalidateQueries({ queryKey: ['admin-screenings'] });
    } catch (error: any) {
      toast.error(error.message || '更新失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理删除影片
  const handleDeleteScreening = async (id: number) => {
    if (!confirm('确定要删除这个影片吗？此操作不可恢复。')) {
      return;
    }
    
    try {
      const response = await api.delete(`/admin/screenings/${id}`);
      
      toast.success('影片已删除');
      
      // 刷新数据
      queryClient.invalidateQueries({ queryKey: ['admin-screenings'] });
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return null; // 权限检查中，不渲染内容
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          获取数据失败，请刷新页面重试
        </div>
      </div>
    );
  }

  const displayData = screeningsData || { items: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
  
  // 确保 items 是数组
  const safeDisplayData = {
    ...displayData,
    items: Array.isArray(displayData.items) ? displayData.items : [],
    meta: displayData.meta || { total: 0, page: 1, limit: 10, totalPages: 0 }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle>影院管理</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              管理影院模块中的所有视频内容
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleOpenCreateDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              发行新片
            </Button>
            <Link 
              href="/admin/content"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回内容管理</span>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
              <Input
                placeholder="搜索影片标题或描述"
                defaultValue={search}
                onChange={handleSearchInput}
                className="flex-1"
              />
              <Button type="submit">搜索</Button>
            </form>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-3 px-4 text-left font-medium">影片信息</th>
                  <th className="py-3 px-4 text-left font-medium">创作者</th>
                  <th className="py-3 px-4 text-left font-medium">上传者</th>
                  <th className="py-3 px-4 text-left font-medium">观看/点赞</th>
                  <th className="py-3 px-4 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {safeDisplayData.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-muted-foreground">
                      {search ? '未找到匹配的影片' : '暂无影片数据'}
                    </td>
                  </tr>
                ) : (
                  safeDisplayData.items.map((screening) => (
                    <tr key={screening.id} className="border-b">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-16 w-28 rounded overflow-hidden">
                            <Image
                              src={processImageUrl(screening.thumbnailUrl || '/images/default-video.svg')}
                              alt={screening.title}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/default-video.svg';
                              }}
                            />
                          </div>
                          <div>
                            <div className="font-medium">{screening.title}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {screening.description}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              发布: {format(new Date(screening.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {(screening as any).creator ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{(screening as any).creator.nickname}</span>
                            <Badge variant="outline" className="text-xs">
                              创作者
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">未指定</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{screening.adminUploader?.nickname || '未知'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div>观看: {(screening.viewsCount || 0).toLocaleString()}</div>
                          <div>点赞: {(screening.likesCount || 0).toLocaleString()}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => router.push(`/screenings/${screening.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(screening)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteScreening(screening.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              总计 {safeDisplayData.meta.total || 0} 个影片
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!safeDisplayData.meta.totalPages || page >= safeDisplayData.meta.totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 创建影片对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>发行新片</DialogTitle>
            <DialogDescription>
              添加一部新的影片到影院模块
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateScreening} className="space-y-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title">标题 *</label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="输入影片标题"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="description">简介</label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="输入影片简介"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <label>创作者</label>
              <div className="relative">
                <Input
                  value={creatorSearch}
                  onChange={(e) => {
                    setCreatorSearch(e.target.value);
                    searchCreators(e.target.value);
                  }}
                  placeholder="搜索创作者昵称或用户名（可选）"
                  className="pr-8"
                />
                {selectedCreator && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={handleClearCreator}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                
                {showCreatorDropdown && searchResults?.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {searchResults?.map((creator) => (
                      <div
                        key={creator.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                        onClick={() => handleSelectCreator(creator)}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{creator.nickname}</div>
                          <div className="text-xs text-gray-500">@{creator.username}</div>
                        </div>
                        <Badge variant={creator.role === 'ADMIN' ? 'default' : creator.role === 'PREMIUM' || creator.role === 'LIFETIME' ? 'secondary' : 'outline'}>
                          {creator.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedCreator && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border">
                  <span className="text-sm">已选择创作者：</span>
                  <span className="font-medium text-sm">{selectedCreator.nickname}</span>
                  <Badge variant={selectedCreator.role === 'ADMIN' ? 'default' : selectedCreator.role === 'PREMIUM' || selectedCreator.role === 'LIFETIME' ? 'secondary' : 'outline'}>
                    {selectedCreator.role}
                  </Badge>
                </div>
              )}
              <p className="text-xs text-gray-500">
                如果不选择创作者，影片将显示管理员为作者
              </p>
            </div>
            
            <div className="grid gap-2">
              <label>封面图片</label>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => coverInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {formData.coverFile ? '更换封面' : '上传封面'}
                </Button>
                {formData.coverFile && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                    <span className="text-sm text-gray-600 w-80 truncate">
                      {formData.coverFile.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, coverFile: null })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'cover');
                }}
              />
            </div>
            
            <div className="grid gap-2">
              <label>影片 *</label>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => videoInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Video className="h-4 w-4" />
                  {formData.videoFile ? '更换视频' : '上传视频'}
                </Button>
                {formData.videoFile && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                    <span className="text-sm text-gray-600 w-80 truncate">
                      {formData.videoFile.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, videoFile: null })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                支持视频文件，最大{uploadLimits.videoMaxSizeMB}MB
              </p>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'video');
                }}
              />
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    处理中...
                  </>
                ) : '发行影片'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 编辑影片对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>编辑影片</DialogTitle>
            <DialogDescription>
              修改影片的基本信息
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateScreening} className="space-y-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="edit-title">标题 *</label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="输入影片标题"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="edit-description">简介</label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="输入影片简介"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <label>创作者</label>
              <div className="relative">
                <Input
                  value={creatorSearch}
                  onChange={(e) => {
                    setCreatorSearch(e.target.value);
                    searchCreators(e.target.value);
                  }}
                  placeholder="搜索创作者昵称或用户名（可选）"
                  className="pr-8"
                />
                {selectedCreator && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={handleClearCreator}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                
                {showCreatorDropdown && searchResults?.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {searchResults?.map((creator) => (
                      <div
                        key={creator.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                        onClick={() => handleSelectCreator(creator)}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{creator.nickname}</div>
                          <div className="text-xs text-gray-500">@{creator.username}</div>
                        </div>
                        <Badge variant={creator.role === 'ADMIN' ? 'default' : creator.role === 'PREMIUM' || creator.role === 'LIFETIME' ? 'secondary' : 'outline'}>
                          {creator.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedCreator && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border">
                  <span className="text-sm">已选择创作者：</span>
                  <span className="font-medium text-sm">{selectedCreator.nickname}</span>
                  <Badge variant={selectedCreator.role === 'ADMIN' ? 'default' : selectedCreator.role === 'PREMIUM' || selectedCreator.role === 'LIFETIME' ? 'secondary' : 'outline'}>
                    {selectedCreator.role}
                  </Badge>
                </div>
              )}
              <p className="text-xs text-gray-500">
                如果不选择创作者，影片将显示管理员为作者
              </p>
            </div>
            
            <div className="grid gap-2">
              <label>更换封面图片</label>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => coverInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {formData.coverFile ? '更换封面' : '上传新封面'}
                </Button>
                {formData.coverFile && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                    <span className="text-sm text-gray-600 w-80 truncate">
                      {formData.coverFile.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, coverFile: null })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                如果不上传新封面，将保持原有封面
              </p>
            </div>
            
            <div className="grid gap-2">
              <label>更换视频文件</label>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => videoInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Video className="h-4 w-4" />
                  {formData.videoFile ? '更换视频' : '上传新视频'}
                </Button>
                {formData.videoFile && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                    <span className="text-sm text-gray-600 w-80 truncate">
                      {formData.videoFile.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, videoFile: null })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                如果不上传新视频，将保持原有视频。最大{uploadLimits.videoMaxSizeMB}MB
              </p>
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    更新中...
                  </>
                ) : '更新影片'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 