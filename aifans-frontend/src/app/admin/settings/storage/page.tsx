'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Save, CloudUpload, HardDrive, Cloud, ArrowRightLeft } from 'lucide-react';

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
}

// 存储统计接口
interface StorageStats {
  totalSize: number;
  totalFiles: number;
  storageType: 'local' | 'oss';
}

export default function StorageSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [stats, setStats] = useState<StorageStats>({
    totalSize: 0,
    totalFiles: 0,
    storageType: 'local',
  });
  const [ossConfig, setOssConfig] = useState<OSSConfig>({
    accessKeyId: '',
    accessKeySecret: '',
    bucket: '',
    region: 'cn-hangzhou',
    endpoint: '',
    domain: ''
  });
  const [storageConfig, setStorageConfig] = useState<StorageConfig>({
    defaultStorage: 'local'
  });
  
  // 获取认证token
  const getAuthToken = (): string => {
    let token = '';
    
    try {
      // 从localStorage获取auth-storage
      const authStorage = localStorage.getItem('auth-storage');
      
      if (authStorage) {
        try {
          const parsedStorage = JSON.parse(authStorage);
          
          if (parsedStorage.state?.token) {
            token = parsedStorage.state.token;
          }
        } catch (error) {
          console.log('获取token - 解析auth-storage失败:', error);
        }
      } else {
        // 尝试从cookie中获取
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1].trim();
        }
      }
    } catch (error) {
      console.log('获取token - 发生错误:', error);
    }
    
    // 确保token格式正确
    if (token && !token.startsWith('Bearer ')) {
      token = `Bearer ${token}`;
    }
    
    return token;
  };
  
  // 获取OSS配置
  const fetchOSSConfig = async () => {
    try {
      setLoading(true);
      
      // 获取token
      const token = getAuthToken();
      if (!token) {
        toast.error('未找到认证信息，请重新登录');
        return;
      }
      
      // 使用API路由获取数据
      const apiUrl = '/api/admin/settings/storage/config';
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': token
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`API响应状态 ${response.status}:`, errorText);
        throw new Error(`获取配置失败 ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      console.log('OSS配置 - 接收到的原始数据:', JSON.stringify(data));
      
      // 处理不同的响应格式
      let ossData: Partial<OSSConfig> = {};
      let storageData: Partial<StorageConfig> = {};
      
      if (data.oss) {
        // 直接包含oss字段
        ossData = data.oss;
      } else if (data.config && data.config.oss) {
        // 配置在config字段中
        ossData = data.config.oss;
      }
      
      if (data.storage) {
        // 直接包含storage字段
        storageData = data.storage;
      } else if (data.config && data.config.storage) {
        // 配置在config字段中
        storageData = data.config.storage;
      }
      
      // 更新OSS配置
      if (Object.keys(ossData).length > 0) {
        setOssConfig({
          accessKeyId: ossData.accessKeyId || '',
          accessKeySecret: ossData.accessKeySecret || '',
          bucket: ossData.bucket || '',
          region: ossData.region || 'cn-hangzhou',
          endpoint: ossData.endpoint || '',
          domain: ossData.domain || ''
        });
      }
      
      // 更新存储配置
      if (Object.keys(storageData).length > 0) {
        // 确保defaultStorage是正确的类型
        let defaultStorage: 'local' | 'oss' = 'local';
        if (storageData.defaultStorage === 'oss') {
          defaultStorage = 'oss';
        }
        
        setStorageConfig({
          defaultStorage: defaultStorage
        });
      }
    } catch (error) {
      console.log('获取OSS配置失败:', error);
      toast.error('获取配置失败: ' + (error instanceof Error ? error.message : '未知错误'));
      
      // 发生错误时设置默认值
      setOssConfig({
        accessKeyId: '',
        accessKeySecret: '',
        bucket: '',
        region: 'cn-hangzhou',
        endpoint: '',
        domain: ''
      });
      
      setStorageConfig({
        defaultStorage: 'local'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 获取存储统计
  const fetchStorageStats = async () => {
    try {
      // 获取token
      const token = getAuthToken();
      if (!token) {
        toast.error('未找到认证信息，请重新登录');
        return;
      }
      
      // 构建API URL
      const apiUrl = `/api/admin/settings/storage/stats`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': token
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`获取配置失败 ${response.status}: ${errorText}`);
      }
      
      const responseData = await response.json();
      
      if (responseData.success && responseData.data) {
        setStats(responseData.data);
      } else {
        throw new Error('API返回数据格式错误');
      }
    } catch (error: any) {
      console.log('获取存储统计失败:', error);
      toast.error('获取统计失败: ' + error.message);
    }
  };
  
  // 保存OSS配置
  const saveOSSConfig = async () => {
    try {
      setSaving(true);
      
      // 获取token
      const token = getAuthToken();
      if (!token) {
        toast.error('未找到认证信息，请重新登录');
        return;
      }
      
      // 构建API URL - 使用专门的保存OSS配置的API端点
      const apiUrl = `/api/admin/settings/storage/save-oss-config`;
      
      // 添加后端要求的字段
      const requestBody = {
        oss: ossConfig,
        storage: storageConfig,
        notes: {
          imageSize: 10, // 默认值，单位MB
          videoSize: 100 // 默认值，单位MB
        },
        inspiration: {
          imageSize: 10, // 默认值，单位MB
          videoSize: 100 // 默认值，单位MB
        },
        screenings: {
          videoSize: 500 // 默认值，单位MB
        }
      };
      
      // 确保所有字段值为整数且不小于1
      requestBody.notes.imageSize = Math.max(1, Math.floor(requestBody.notes.imageSize));
      requestBody.notes.videoSize = Math.max(1, Math.floor(requestBody.notes.videoSize));
      requestBody.inspiration.imageSize = Math.max(1, Math.floor(requestBody.inspiration.imageSize));
      requestBody.inspiration.videoSize = Math.max(1, Math.floor(requestBody.inspiration.videoSize));
      requestBody.screenings.videoSize = Math.max(1, Math.floor(requestBody.screenings.videoSize));
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`API响应状态 ${response.status}:`, errorText);
        throw new Error(`保存配置失败 ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      toast.success('配置保存成功');
      
      // 重新加载配置
      await fetchOSSConfig();
    } catch (error) {
      console.log('保存OSS配置失败:', error);
      toast.error(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setSaving(false);
    }
  };
  
  // 测试OSS连接
  const handleTestOSSConnection = async () => {
    try {
      // 获取token
      const token = getAuthToken();
      if (!token) {
        toast.error('未找到认证信息，请重新登录');
        return;
      }
      
      // 构建API URL
      const apiUrl = `/api/admin/settings/storage/test`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(ossConfig)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`测试失败 ${response.status}: ${errorText}`);
      }
      
      const responseData = await response.json();
      
      if (responseData.success) {
        toast.success('OSS连接测试成功!');
      } else {
        toast.error(`OSS连接测试失败: ${responseData.message || '未知错误'}`);
      }
    } catch (error) {
      console.log('测试OSS连接失败:', error);
      toast.error(`测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };
  
  // 迁移存储
  const migrateStorage = async () => {
    try {
      setMigrating(true);
      
      // 获取token
      const token = getAuthToken();
      if (!token) {
        toast.error('未找到认证信息，请重新登录');
        return;
      }
      
      // 构建API URL - 使用用户选择的存储类型作为目标
      const targetStorage = storageConfig.defaultStorage;
      const apiUrl = `/api/admin/settings/storage/migrate`;
      
      toast.info(`开始将文件迁移到${targetStorage === 'local' ? '本地存储' : 'OSS存储'}，这可能需要一些时间...`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          targetStorage: targetStorage
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`API响应状态 ${response.status}:`, errorText);
        throw new Error(`迁移失败 ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`迁移成功! 已迁移 ${data.migratedFiles || 0} 个文件${data.skippedFiles ? `, 跳过 ${data.skippedFiles} 个已迁移文件` : ''}`);
        
        // 更新存储配置已经在UI中完成，不需要再次设置
        
        // 重新加载统计信息
        await fetchStorageStats();
      } else {
        toast.error(`迁移失败: ${data.message || '未知错误'}`);
      }
    } catch (error) {
      console.log('迁移存储失败:', error);
      toast.error(`迁移失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setMigrating(false);
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
  
  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveOSSConfig();
  };
  
  useEffect(() => {
    fetchOSSConfig();
    fetchStorageStats();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">存储设置</h1>
          <p className="text-muted-foreground">管理文件存储配置和云存储服务</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* 存储统计卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>存储概览</CardTitle>
            <CardDescription>当前存储状态和统计信息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
                <h3 className="font-medium text-lg">当前存储方式</h3>
                <div className="flex items-center mt-2">
                  {stats.storageType === 'local' ? (
                    <>
                      <HardDrive className="h-5 w-5 mr-2 text-blue-600" />
                      <p className="text-xl font-bold text-blue-600">本地存储</p>
                    </>
                  ) : (
                    <>
                      <Cloud className="h-5 w-5 mr-2 text-green-600" />
                      <p className="text-xl font-bold text-green-600">阿里云OSS</p>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
                <h3 className="font-medium text-lg">文件总数</h3>
                <p className="text-2xl font-bold mt-2">{stats.totalFiles} 个文件</p>
              </div>
              
              <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
                <h3 className="font-medium text-lg">总存储大小</h3>
                <p className="text-2xl font-bold mt-2">{formatFileSize(stats.totalSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 存储设置表单 */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>存储设置</CardTitle>
              <CardDescription>配置文件存储位置和阿里云OSS参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 存储位置选择 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">存储位置</h3>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="local" 
                      name="storageType" 
                      value="local" 
                      checked={storageConfig.defaultStorage === 'local'}
                      onChange={() => setStorageConfig({...storageConfig, defaultStorage: 'local'})}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="local" className="flex items-center">
                      <HardDrive className="h-4 w-4 mr-2" />
                      本地存储
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="oss" 
                      name="storageType" 
                      value="oss" 
                      checked={storageConfig.defaultStorage === 'oss'}
                      onChange={() => setStorageConfig({...storageConfig, defaultStorage: 'oss'})}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="oss" className="flex items-center">
                      <Cloud className="h-4 w-4 mr-2" />
                      阿里云OSS存储
                    </Label>
                  </div>
                </div>
                
                {/* 迁移按钮 */}
                <div className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={migrateStorage}
                    disabled={migrating || loading}
                    className="w-full"
                  >
                    {migrating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    执行迁移到{storageConfig.defaultStorage === 'local' 
                      ? '本地存储' 
                      : '阿里云OSS'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    迁移将把所有文件迁移到选定的存储位置，并更新数据库中的链接。请先选择存储类型，然后点击执行迁移。
                  </p>
                </div>
              </div>
              
              {/* 阿里云OSS配置 */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">阿里云OSS配置</h3>
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
                      type="text"
                      value={ossConfig.accessKeySecret}
                      onChange={(e) => setOssConfig({ ...ossConfig, accessKeySecret: e.target.value })}
                      placeholder="输入Access Key Secret"
                      autoComplete="off"
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
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={handleTestOSSConnection}
                    disabled={loading}
                  >
                    <CloudUpload className="mr-2 h-4 w-4" />
                    测试OSS连接
                  </Button>
                  
                  <Button 
                    type="submit"
                    disabled={saving || loading}
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    保存配置
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
} 