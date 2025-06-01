'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Loader2, Save, CloudUpload, HardDrive, Cloud } from 'lucide-react';
import axios from 'axios';

// OSS配置接口
interface OSSConfig {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  region: string;
  endpoint: string;
  domain: string;
}

// 简化的存储配置接口
interface StorageConfig {
  defaultStorage: 'local' | 'oss';
  maxFileSize: number; // MB
  enableCleanup: boolean;
  cleanupDays: number;
}

// 存储统计接口
interface StorageStats {
  localStorage: {
    totalFiles: number;
    totalSize: number; // bytes
    location: string;
  };
  ossStorage: {
    totalFiles: number;
    totalSize: number; // bytes
    bucket: string;
  };
}

export default function StorageSettingsPage() {
  const [ossConfig, setOssConfig] = useState<OSSConfig>({
    accessKeyId: '',
    accessKeySecret: '',
    bucket: '',
    region: '',
    endpoint: '',
    domain: '',
  });
  
  const [storageConfig, setStorageConfig] = useState<StorageConfig>({
    defaultStorage: 'local',
    maxFileSize: 100,
    enableCleanup: false,
    cleanupDays: 30,
  });
  
  const [stats, setStats] = useState<StorageStats>({
    localStorage: {
      totalFiles: 0,
      totalSize: 0,
      location: 'aifans-backend/uploads/',
    },
    ossStorage: {
      totalFiles: 0,
      totalSize: 0,
      bucket: '',
    },
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // 获取OSS配置
  const fetchOSSConfig = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/settings/storage');
      setOssConfig(response.data.oss || ossConfig);
      setStorageConfig(response.data.storage || storageConfig);
    } catch (error) {
      toast.error('获取存储配置失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 获取存储统计
  const fetchStorageStats = async () => {
    try {
      const response = await axios.get('/api/admin/settings/storage/stats');
      setStats(response.data);
    } catch (error) {
      console.error('获取存储统计失败', error);
    }
  };
  
  useEffect(() => {
    fetchOSSConfig();
    fetchStorageStats();
  }, []);
  
  // 保存OSS配置
  const handleSaveOSSConfig = async () => {
    try {
      setSaving(true);
      await axios.post('/api/admin/settings/storage', {
        oss: ossConfig,
        storage: storageConfig
      });
      toast.success('存储配置已更新');
    } catch (error) {
      toast.error('保存失败，请检查配置信息');
    } finally {
      setSaving(false);
    }
  };
  
  // 测试OSS连接
  const handleTestOSSConnection = async () => {
    try {
      const response = await axios.post('/api/admin/settings/storage/test', ossConfig);
      toast.success('OSS连接测试成功');
    } catch (error) {
      toast.error('OSS连接测试失败：' + (error.response?.data?.message || '未知错误'));
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
        <div>
          <h1 className="text-3xl font-bold">存储设置</h1>
          <p className="text-muted-foreground">管理文件存储配置和云存储服务</p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">存储概览</TabsTrigger>
          <TabsTrigger value="oss-config">OSS配置</TabsTrigger>
          <TabsTrigger value="settings">存储设置</TabsTrigger>
        </TabsList>
        
        {/* 存储概览 */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* 存储统计 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">本地存储</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.localStorage.totalFiles} 个文件</div>
                  <p className="text-xs text-muted-foreground">
                    总大小: {formatFileSize(stats.localStorage.totalSize)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    位置: {stats.localStorage.location}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">OSS存储</CardTitle>
                  <Cloud className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.ossStorage.totalFiles} 个文件</div>
                  <p className="text-xs text-muted-foreground">
                    总大小: {formatFileSize(stats.ossStorage.totalSize)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Bucket: {stats.ossStorage.bucket || '未配置'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 当前配置状态 */}
            <Card>
              <CardHeader>
                <CardTitle>当前存储配置</CardTitle>
                <CardDescription>系统当前使用的存储配置信息</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="font-medium text-lg">默认存储</h3>
                    <p className={`text-2xl font-bold mt-2 ${
                      storageConfig.defaultStorage === 'local' ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {storageConfig.defaultStorage === 'local' ? '本地存储' : 'OSS存储'}
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="font-medium text-lg">文件大小限制</h3>
                    <p className="text-2xl font-bold mt-2 text-gray-600">
                      {storageConfig.maxFileSize}MB
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="font-medium text-lg">自动清理</h3>
                    <p className="text-2xl font-bold mt-2 text-gray-600">
                      {storageConfig.enableCleanup ? `${storageConfig.cleanupDays}天` : '关闭'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* OSS配置 */}
        <TabsContent value="oss-config">
          <Card>
            <CardHeader>
              <CardTitle>阿里云OSS配置</CardTitle>
              <CardDescription>
                配置阿里云对象存储服务，用于文件上传和管理。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="accessKeyId">Access Key ID</Label>
                      <Input
                        id="accessKeyId"
                        type="text"
                        value={ossConfig.accessKeyId}
                        onChange={(e) => setOssConfig({ ...ossConfig, accessKeyId: e.target.value })}
                        placeholder="LTAI****"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="accessKeySecret">Access Key Secret</Label>
                      <Input
                        id="accessKeySecret"
                        type="password"
                        value={ossConfig.accessKeySecret}
                        onChange={(e) => setOssConfig({ ...ossConfig, accessKeySecret: e.target.value })}
                        placeholder="****"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="bucket">Bucket名称</Label>
                      <Input
                        id="bucket"
                        type="text"
                        value={ossConfig.bucket}
                        onChange={(e) => setOssConfig({ ...ossConfig, bucket: e.target.value })}
                        placeholder="my-bucket"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="region">地域</Label>
                      <Input
                        id="region"
                        type="text"
                        value={ossConfig.region}
                        onChange={(e) => setOssConfig({ ...ossConfig, region: e.target.value })}
                        placeholder="cn-hangzhou"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="endpoint">Endpoint</Label>
                      <Input
                        id="endpoint"
                        type="text"
                        value={ossConfig.endpoint}
                        onChange={(e) => setOssConfig({ ...ossConfig, endpoint: e.target.value })}
                        placeholder="oss-cn-hangzhou.aliyuncs.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="domain">自定义域名 (可选)</Label>
                      <Input
                        id="domain"
                        type="text"
                        value={ossConfig.domain}
                        onChange={(e) => setOssConfig({ ...ossConfig, domain: e.target.value })}
                        placeholder="cdn.example.com"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button 
                      variant="outline"
                      onClick={handleTestOSSConnection}
                    >
                      测试连接
                    </Button>
                    <Button 
                      onClick={handleSaveOSSConfig}
                      disabled={saving}
                    >
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Save className="mr-2 h-4 w-4" />
                      保存配置
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 存储设置 */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>存储设置</CardTitle>
              <CardDescription>
                配置文件存储的基本参数和清理策略。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="defaultStorage">默认存储方式</Label>
                    <select 
                      id="defaultStorage"
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
                      value={storageConfig.defaultStorage}
                      onChange={(e) => setStorageConfig({
                        ...storageConfig, 
                        defaultStorage: e.target.value as 'local' | 'oss'
                      })}
                    >
                      <option value="local">本地存储</option>
                      <option value="oss">OSS存储</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      选择新上传文件的默认存储位置
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="maxFileSize">最大文件大小 (MB)</Label>
                    <Input 
                      id="maxFileSize"
                      type="number"
                      min="1"
                      max="1000"
                      value={storageConfig.maxFileSize}
                      onChange={(e) => setStorageConfig({
                        ...storageConfig, 
                        maxFileSize: parseInt(e.target.value) || 100
                      })}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      控制单个文件的最大上传大小
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox"
                      id="enableCleanup"
                      checked={storageConfig.enableCleanup}
                      onChange={(e) => setStorageConfig({
                        ...storageConfig, 
                        enableCleanup: e.target.checked
                      })}
                    />
                    <Label htmlFor="enableCleanup">启用自动清理未使用的文件</Label>
                  </div>

                  {storageConfig.enableCleanup && (
                    <div>
                      <Label htmlFor="cleanupDays">清理周期 (天)</Label>
                      <Input 
                        id="cleanupDays"
                        type="number"
                        min="1"
                        max="365"
                        value={storageConfig.cleanupDays}
                        onChange={(e) => setStorageConfig({
                          ...storageConfig, 
                          cleanupDays: parseInt(e.target.value) || 30
                        })}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        超过指定天数未被引用的文件将被自动删除
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button 
                    variant="outline"
                    onClick={fetchOSSConfig}
                  >
                    重置配置
                  </Button>
                  <Button 
                    onClick={handleSaveOSSConfig}
                    disabled={saving}
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    保存配置
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 