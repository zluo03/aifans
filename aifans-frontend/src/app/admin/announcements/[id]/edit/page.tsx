'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuth } from '@/hooks';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { FileUpload } from '@/components/ui/file-upload';
import { useQuery } from '@tanstack/react-query';

// 动态导入BlockNote编辑器，禁用SSR
const BlockNoteEditor = dynamic(
  () => import('@/components/editor/block-note-editor'),
  { 
    ssr: false,
    loading: () => <div className="border rounded-lg p-4 min-h-[400px] flex items-center justify-center">加载编辑器...</div>
  }
);

interface AnnouncementFormData {
  title: string;
  content: any;
  imageUrl?: string;
  summary?: string;
  linkUrl?: string;
  showImage: boolean;
  showSummary: boolean;
  showLink: boolean;
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority: number;
}

interface Announcement {
  id: number;
  title: string;
  content: any;
  imageUrl?: string;
  summary?: string;
  linkUrl?: string;
  showImage: boolean;
  showSummary: boolean;
  showLink: boolean;
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    viewRecords: number;
  };
}

export default function EditAnnouncementPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const announcementId = params.id as string;
  
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    content: null,
    imageUrl: '',
    summary: '',
    linkUrl: '',
    showImage: true,
    showSummary: true,
    showLink: false,
    startDate: '',
    endDate: '',
    isActive: true,
    priority: 0,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // 获取公告详情
  const { data: announcement, isLoading, error } = useQuery<Announcement>({
    queryKey: ['admin-announcement', announcementId],
    queryFn: async () => {
      const response = await api.get<Announcement>(`admin/announcements/${announcementId}`);
      return response.data;
    },
    enabled: !!announcementId,
  });

  // 权限检查
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/');
      toast.error('没有访问权限');
    }
  }, [user, router]);

  // 初始化表单数据
  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        content: announcement.content,
        imageUrl: announcement.imageUrl || '',
        summary: announcement.summary || '',
        linkUrl: announcement.linkUrl || '',
        showImage: announcement.showImage,
        showSummary: announcement.showSummary,
        showLink: announcement.showLink,
        startDate: new Date(announcement.startDate).toISOString().slice(0, 16),
        endDate: new Date(announcement.endDate).toISOString().slice(0, 16),
        isActive: announcement.isActive,
        priority: announcement.priority,
      });
    }
  }, [announcement]);

  // 处理表单字段变更
  const handleFieldChange = (field: keyof AnnouncementFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理编辑器内容变更
  const handleContentChange = (content: string) => {
    try {
      const parsedContent = JSON.parse(content);
      setFormData(prev => ({
        ...prev,
        content: parsedContent
      }));
    } catch (error) {
      console.error('解析编辑器内容失败:', error);
    }
  };

  // 处理图片上传
  const handleImageUpload = async (files: File[]): Promise<Array<{ url: string; key: string }>> => {
    const results = [];
    
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'announcements');

        // 获取认证token
        let token = null;
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          try {
            const { state } = JSON.parse(authStorage);
            token = state?.token;
          } catch (error) {
            console.error('解析认证存储失败:', error);
          }
        }

        if (!token) {
          throw new Error('未找到认证token，请重新登录');
        }

        const response = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: '上传失败' }));
          throw new Error(errorData.error || '上传失败');
        }

        const result = await response.json();
        results.push(result);

        // 更新表单数据（只取第一个文件的URL）
        if (results.length === 1) {
          setFormData(prev => ({
            ...prev,
            imageUrl: result.url
          }));
        }

        toast.success(`${file.name} 上传成功`);
      } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : '上传失败';
        toast.error(`${file.name} ${errorMessage}`);
        results.push({ url: '', key: '' });
      }
    }
    
    return results;
  };

  // 验证表单
  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error('请输入公告标题');
      return false;
    }

    if (!formData.content || (Array.isArray(formData.content) && formData.content.length === 0)) {
      toast.error('请输入公告内容');
      return false;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error('结束时间必须晚于开始时间');
      return false;
    }



    return true;
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // 构建提交数据，只包含有值的字段
      const submitData: any = {
        title: formData.title,
        content: formData.content,
        showImage: formData.showImage,
        showSummary: formData.showSummary,
        showLink: false, // 不再使用链接功能
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        isActive: formData.isActive,
        priority: formData.priority,
      };

      // 只有当字段有值时才添加到提交数据中
      if (formData.imageUrl && formData.imageUrl.trim()) {
        submitData.imageUrl = formData.imageUrl;
      }
      
      if (formData.summary && formData.summary.trim()) {
        submitData.summary = formData.summary;
      }

      console.log('更新公告数据:', submitData);
      await api.patch(`admin/announcements/${announcementId}`, submitData);
      
      toast.success('公告更新成功');
      router.push('/admin/announcements');
    } catch (error: any) {
      console.error('更新公告失败:', error);
      
      // 提取详细错误信息
      let errorMessage = '更新失败';
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(', ');
        } else {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 预览模式切换
  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">公告不存在</h1>
          <Link href="/admin/announcements">
            <Button>返回公告列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/admin/announcements">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">编辑公告</h1>
            <p className="text-muted-foreground">修改公告信息</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={isPreviewMode ? "outline" : "default"}
            onClick={togglePreviewMode}
          >
            <Eye className="w-4 h-4 mr-2" />
            {isPreviewMode ? '编辑模式' : '预览模式'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="ml-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? '保存中...' : '保存更改'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主要内容区域 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">公告标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="输入公告标题"
                  maxLength={200}
                />
              </div>

              <div>
                <Label htmlFor="summary">内容简介</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => handleFieldChange('summary', e.target.value)}
                  placeholder="输入公告简介（可选）"
                  rows={3}
                />
              </div>


            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>公告内容</CardTitle>
            </CardHeader>
            <CardContent>
              {isPreviewMode ? (
                <div className="border rounded-lg p-4 min-h-[400px]">
                  <h3 className="text-lg font-semibold mb-4">预览效果</h3>
                  {formData.showImage && formData.imageUrl && (
                    <div className="mb-4">
                      <img 
                        src={formData.imageUrl} 
                        alt={formData.title}
                        className="w-full max-w-md h-48 object-cover rounded-lg mx-auto"
                      />
                    </div>
                  )}
                  {formData.showSummary && formData.summary && (
                    <div className="mb-4">
                      <p className="text-muted-foreground">{formData.summary}</p>
                    </div>
                  )}
                  {formData.content && (
                    <div className="prose max-w-none">
                      <BlockNoteEditor
                        initialContent={JSON.stringify(formData.content)}
                        editable={false}
                      />
                    </div>
                  )}

                </div>
              ) : (
                <BlockNoteEditor
                  initialContent={formData.content ? JSON.stringify(formData.content) : undefined}
                  onChange={handleContentChange}
                  placeholder="输入公告内容..."
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* 侧边栏设置 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>公告图片</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] }}
                onUpload={handleImageUpload}
                maxFiles={1}
                maxSize={5 * 1024 * 1024} // 5MB
              />
              {formData.imageUrl && (
                <div className="mt-4">
                  <img 
                    src={formData.imageUrl} 
                    alt="公告图片"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => handleFieldChange('imageUrl', '')}
                  >
                    移除图片
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>显示设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="showImage">显示图片</Label>
                <Switch
                  id="showImage"
                  checked={formData.showImage}
                  onCheckedChange={(checked) => handleFieldChange('showImage', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showSummary">显示简介</Label>
                <Switch
                  id="showSummary"
                  checked={formData.showSummary}
                  onCheckedChange={(checked) => handleFieldChange('showSummary', checked)}
                />
              </div>


            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>时间设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="startDate">生效时间 *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => handleFieldChange('startDate', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="endDate">结束时间 *</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => handleFieldChange('endDate', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>其他设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="priority">优先级</Label>
                <Input
                  id="priority"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.priority}
                  onChange={(e) => handleFieldChange('priority', parseInt(e.target.value) || 0)}
                  placeholder="0-100，数字越大优先级越高"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">启用公告</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleFieldChange('isActive', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 统计信息 */}
          <Card>
            <CardHeader>
              <CardTitle>统计信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>查看次数:</span>
                <span className="font-medium">{announcement._count.viewRecords}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>创建时间:</span>
                <span className="font-medium">
                  {new Date(announcement.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>更新时间:</span>
                <span className="font-medium">
                  {new Date(announcement.updatedAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 