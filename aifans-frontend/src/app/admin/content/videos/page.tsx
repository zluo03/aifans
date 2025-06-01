'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Loader2, 
  Save, 
  RefreshCw,
  ArrowLeft,
  Image as ImageIcon,
  FileVideo,
  HardDrive
} from 'lucide-react';
import { api } from '@/lib/api/api';
import Link from 'next/link';

// 上传限制配置接口（移除总数量限制）
interface UploadLimits {
  notes: {
    imageSize: number; // MB
    videoSize: number; // MB
  };
  inspiration: {
    imageSize: number; // MB
    videoSize: number; // MB
  };
  screenings: {
    videoSize: number; // MB
  };
  creator: {
    imageSize: number;
    videoSize: number;
    audioSize: number;
  };
}

// 上传统计接口
interface UploadStats {
  notes: {
    imageCount: number;
    videoCount: number;
    totalSize: number;
  };
  inspiration: {
    imageCount: number;
    videoCount: number;
    totalSize: number;
  };
  screenings: {
    videoCount: number;
    totalSize: number;
  };
}

export default function UploadManagementPage() {
  const [uploadLimits, setUploadLimits] = useState<UploadLimits>({
    notes: {
      imageSize: 5,
      videoSize: 50,
    },
    inspiration: {
      imageSize: 10,
      videoSize: 100,
    },
    screenings: {
      videoSize: 500,
    },
    creator: {
      imageSize: 5,
      videoSize: 50,
      audioSize: 20,
    },
  });

  const [uploadStats, setUploadStats] = useState<UploadStats>({
    notes: { imageCount: 0, videoCount: 0, totalSize: 0 },
    inspiration: { imageCount: 0, videoCount: 0, totalSize: 0 },
    screenings: { videoCount: 0, totalSize: 0 },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // 个人主页上传限制
  const [creatorLimit, setCreatorLimit] = useState({
    imageMaxSizeMB: 5,
    videoMaxSizeMB: 50,
    audioMaxSizeMB: 50,
  });
  const [creatorLoading, setCreatorLoading] = useState(true);
  const [creatorSaving, setCreatorSaving] = useState(false);

  // 获取上传限制配置
  const fetchUploadLimits = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings/upload-limits');
      if (response.data.success) {
        setUploadLimits(response.data.limits);
      }
    } catch (error) {
      console.error('获取上传配置失败:', error);
      // 使用默认配置
    } finally {
      setLoading(false);
    }
  };

  // 获取上传统计
  const fetchUploadStats = async () => {
    try {
      const response = await api.get('/admin/settings/upload-stats');
      if (response.data.success) {
        setUploadStats(response.data.stats);
      }
    } catch (error) {
      console.error('获取上传统计失败:', error);
    }
  };

  // 获取个人主页上传限制
  const fetchCreatorLimit = async () => {
    setCreatorLoading(true);
    try {
      const res = await api.get('/admin/settings/upload-limits/creator');
      setCreatorLimit(res.data);
    } catch (e) {
      // ignore
    } finally {
      setCreatorLoading(false);
    }
  };

  useEffect(() => {
    fetchUploadLimits();
    fetchUploadStats();
    fetchCreatorLimit();
  }, []);

  // 保存上传限制配置
  const handleSaveUploadLimits = async () => {
    try {
      setSaving(true);
      console.log('保存上传配置:', uploadLimits); // 调试日志
      
      const response = await api.post('/admin/settings/upload-limits', {
        limits: uploadLimits
      });
      
      console.log('API响应:', response.data); // 调试日志
      
      if (response.data.success) {
        toast.success('上传限制配置已更新');
        // 保存成功后重新获取配置，确认保存生效
        await fetchUploadLimits();
      } else {
        toast.error(response.data.message || '保存失败');
      }
    } catch (error: any) {
      console.error('保存上传配置失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '保存上传配置失败';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // 保存个人主页上传限制
  const handleSaveCreatorLimit = async () => {
    setCreatorSaving(true);
    try {
      await api.post('/admin/settings/upload-limits/creator', creatorLimit);
      toast.success('个人主页上传限制已保存');
      fetchCreatorLimit();
    } catch (e) {
      toast.error('保存失败');
    } finally {
      setCreatorSaving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin/content">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回内容管理
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">上传管理</h1>
            <p className="text-muted-foreground">设置各模块的文件大小限制（无数量限制）</p>
          </div>
        </div>
        <Button onClick={() => { fetchUploadLimits(); fetchUploadStats(); }}>
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新数据
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="notes">笔记模块</TabsTrigger>
          <TabsTrigger value="inspiration">灵感模块</TabsTrigger>
          <TabsTrigger value="screenings">影院模块</TabsTrigger>
          <TabsTrigger value="creator">个人主页</TabsTrigger>
        </TabsList>

        {/* 概览标签页 */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* 总体统计 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">总图片数</CardTitle>
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {uploadStats.notes.imageCount + uploadStats.inspiration.imageCount}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    笔记: {uploadStats.notes.imageCount} | 灵感: {uploadStats.inspiration.imageCount}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">总视频数</CardTitle>
                  <FileVideo className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {uploadStats.notes.videoCount + uploadStats.inspiration.videoCount + uploadStats.screenings.videoCount}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    笔记: {uploadStats.notes.videoCount} | 灵感: {uploadStats.inspiration.videoCount} | 影院: {uploadStats.screenings.videoCount}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">总存储空间</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatFileSize(uploadStats.notes.totalSize + uploadStats.inspiration.totalSize + uploadStats.screenings.totalSize)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    跨所有模块的总存储使用量
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 各模块限制概览 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>笔记模块</CardTitle>
                  <CardDescription>笔记编辑器中的媒体文件</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>图片大小限制</span>
                      <span>{uploadLimits.notes.imageSize}MB</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>视频大小限制</span>
                      <span>{uploadLimits.notes.videoSize}MB</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>当前文件数</span>
                      <span>{uploadStats.notes.imageCount + uploadStats.notes.videoCount}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>存储使用</span>
                      <span>{formatFileSize(uploadStats.notes.totalSize)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>灵感模块</CardTitle>
                  <CardDescription>AI生成的创意内容</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>图片大小限制</span>
                      <span>{uploadLimits.inspiration.imageSize}MB</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>视频大小限制</span>
                      <span>{uploadLimits.inspiration.videoSize}MB</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>当前文件数</span>
                      <span>{uploadStats.inspiration.imageCount + uploadStats.inspiration.videoCount}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>存储使用</span>
                      <span>{formatFileSize(uploadStats.inspiration.totalSize)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>影院模块</CardTitle>
                  <CardDescription>完整的放映视频</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>视频大小限制</span>
                      <span>{uploadLimits.screenings.videoSize}MB</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>当前视频数</span>
                      <span>{uploadStats.screenings.videoCount}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>存储使用</span>
                      <span>{formatFileSize(uploadStats.screenings.totalSize)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 笔记模块设置 */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>笔记模块上传限制</CardTitle>
              <CardDescription>
                设置笔记编辑器中图片和视频的单个文件大小限制
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="notesImageSize">单个图片大小限制 (MB)</Label>
                    <Input 
                      id="notesImageSize"
                      type="number"
                      min="1"
                      max="20"
                      value={uploadLimits.notes.imageSize}
                      onChange={(e) => setUploadLimits({
                        ...uploadLimits,
                        notes: {
                          ...uploadLimits.notes,
                          imageSize: parseInt(e.target.value) || 5
                        }
                      })}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      推荐设置为5MB以下，保证编辑器加载速度
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="notesVideoSize">单个视频大小限制 (MB)</Label>
                    <Input 
                      id="notesVideoSize"
                      type="number"
                      min="10"
                      max="200"
                      value={uploadLimits.notes.videoSize}
                      onChange={(e) => setUploadLimits({
                        ...uploadLimits,
                        notes: {
                          ...uploadLimits.notes,
                          videoSize: parseInt(e.target.value) || 50
                        }
                      })}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      推荐设置为50MB以下，适合教学演示视频
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="text-lg font-medium mb-4">当前使用情况</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{uploadStats.notes.imageCount}</div>
                        <div className="text-sm text-gray-500">图片总数</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{uploadStats.notes.videoCount}</div>
                        <div className="text-sm text-gray-500">视频总数</div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">{formatFileSize(uploadStats.notes.totalSize)}</div>
                      <div className="text-sm text-gray-500">总存储使用</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 灵感模块设置 */}
        <TabsContent value="inspiration">
          <Card>
            <CardHeader>
              <CardTitle>灵感模块上传限制</CardTitle>
              <CardDescription>
                设置AI生成灵感内容的上传限制
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="inspirationImageSize">单个图片大小限制 (MB)</Label>
                    <Input 
                      id="inspirationImageSize"
                      type="number"
                      min="1"
                      max="50"
                      value={uploadLimits.inspiration.imageSize}
                      onChange={(e) => setUploadLimits({
                        ...uploadLimits,
                        inspiration: {
                          ...uploadLimits.inspiration,
                          imageSize: parseInt(e.target.value) || 10
                        }
                      })}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      推荐设置为10MB以下，支持高质量创意图片
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="inspirationVideoSize">单个视频大小限制 (MB)</Label>
                    <Input 
                      id="inspirationVideoSize"
                      type="number"
                      min="10"
                      max="200"
                      value={uploadLimits.inspiration.videoSize}
                      onChange={(e) => setUploadLimits({
                        ...uploadLimits,
                        inspiration: {
                          ...uploadLimits.inspiration,
                          videoSize: parseInt(e.target.value) || 100
                        }
                      })}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      推荐设置为100MB以下，支持创意短视频
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="text-lg font-medium mb-4">当前使用情况</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{uploadStats.inspiration.imageCount}</div>
                        <div className="text-sm text-gray-500">图片总数</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{uploadStats.inspiration.videoCount}</div>
                        <div className="text-sm text-gray-500">视频总数</div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">{formatFileSize(uploadStats.inspiration.totalSize)}</div>
                      <div className="text-sm text-gray-500">总存储使用</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 影院模块设置 */}
        <TabsContent value="screenings">
          <Card>
            <CardHeader>
              <CardTitle>影院模块上传限制</CardTitle>
              <CardDescription>
                设置影院完整视频的上传限制
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="screeningsVideoSize">单个视频大小限制 (MB)</Label>
                    <Input 
                      id="screeningsVideoSize"
                      type="number"
                      min="50"
                      max="2000"
                      value={uploadLimits.screenings.videoSize}
                      onChange={(e) => setUploadLimits({
                        ...uploadLimits,
                        screenings: {
                          ...uploadLimits.screenings,
                          videoSize: parseInt(e.target.value) || 500
                        }
                      })}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      推荐设置为500MB以下，支持完整的放映视频
                    </p>
                  </div>
                  <div className="flex items-center justify-center p-4 border rounded-lg bg-green-50">
                    <div className="text-center">
                      <div className="text-sm font-medium text-green-700">✅ 无数量限制</div>
                      <div className="text-xs text-green-600 mt-1">用户可以上传任意数量的视频</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="text-lg font-medium mb-4">当前使用情况</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{uploadStats.screenings.videoCount}</div>
                        <div className="text-sm text-gray-500">视频总数</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{formatFileSize(uploadStats.screenings.totalSize)}</div>
                        <div className="text-sm text-gray-500">存储使用</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 个人主页模块设置 */}
        <TabsContent value="creator">
          <Card>
            <CardHeader>
              <CardTitle>个人主页上传限制</CardTitle>
              <CardDescription>
                设置创作者个人主页的图片、视频、音频单文件大小限制
              </CardDescription>
            </CardHeader>
            <CardContent>
              {creatorLoading ? (
                <div className="text-muted-foreground">加载中...</div>
              ) : (
                <div className="space-y-6 max-w-xl">
                  <div>
                    <Label htmlFor="creatorImageSize">单个图片大小限制 (MB)</Label>
                    <Input
                      id="creatorImageSize"
                      type="number"
                      min="1"
                      max="20"
                      value={creatorLimit.imageMaxSizeMB}
                      onChange={e => setCreatorLimit(l => ({ ...l, imageMaxSizeMB: parseInt(e.target.value) || 5 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="creatorVideoSize">单个视频大小限制 (MB)</Label>
                    <Input
                      id="creatorVideoSize"
                      type="number"
                      min="10"
                      max="200"
                      value={creatorLimit.videoMaxSizeMB}
                      onChange={e => setCreatorLimit(l => ({ ...l, videoMaxSizeMB: parseInt(e.target.value) || 50 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="creatorAudioSize">单个音频大小限制 (MB)</Label>
                    <Input
                      id="creatorAudioSize"
                      type="number"
                      min="1"
                      max="50"
                      value={creatorLimit.audioMaxSizeMB}
                      onChange={e => setCreatorLimit(l => ({ ...l, audioMaxSizeMB: parseInt(e.target.value) || 50 }))}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button variant="outline" onClick={fetchCreatorLimit}>重置</Button>
                    <Button onClick={handleSaveCreatorLimit} disabled={creatorSaving}>
                      {creatorSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Save className="mr-2 h-4 w-4" />保存配置
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 保存按钮 */}
      <div className="flex justify-end space-x-2 mt-6">
        <Button 
          variant="outline"
          onClick={() => { fetchUploadLimits(); fetchUploadStats(); }}
        >
          重置配置
        </Button>
        <Button 
          onClick={handleSaveUploadLimits}
          disabled={saving}
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          保存配置
        </Button>
      </div>
    </div>
  );
} 