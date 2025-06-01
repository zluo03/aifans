'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { processImageUrl, ensureAvatarUrlConsistency } from '@/lib/utils/image-url';
import { usersApi } from '@/lib/api/users';
import { toast } from 'sonner';

export default function DebugAvatar() {
  const { user, forceRefreshUserProfile } = useAuthStore();
  const [baseUrl, setBaseUrl] = useState('');
  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  useEffect(() => {
    // 获取后端API基础URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    setBaseUrl(apiUrl);
  }, []);

  const testImage = (url: string) => {
    setErrorMsg(null);
    setTestResult(null);
    
    if (!url) {
      setErrorMsg('请输入URL');
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      setTestResult('加载成功');
    };
    img.onerror = (e) => {
      setTestResult('加载失败');
      setErrorMsg(`错误: ${e}`);
    };
    img.src = url;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 文件大小限制(5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('文件大小不能超过5MB');
      return;
    }
    
    // 文件类型限制
    if (!file.type.startsWith('image/')) {
      toast.error('只能上传图片文件');
      return;
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'avatar');
      
      const result = await usersApi.uploadAvatar(formData);
      console.log('上传头像响应:', result);
      
      // 保存头像URL
      const newAvatarUrl = result.url;
      setUploadedUrl(newAvatarUrl);
      
      // 检查URL格式是否正确
      const consistentUrl = ensureAvatarUrlConsistency(newAvatarUrl);
      console.log('头像URL检查:', {
        原始URL: newAvatarUrl,
        一致性处理后: consistentUrl,
        处理后URL: processImageUrl(consistentUrl),
        是否包含uploads: newAvatarUrl.includes('/uploads/'),
        是否包含http: newAvatarUrl.startsWith('http')
      });
      
      toast.success('头像上传成功');
    } catch (error) {
      console.error('上传头像失败:', error);
      toast.error('头像上传失败');
    } finally {
      setUploading(false);
    }
  };

  const updateProfile = async () => {
    if (!user || !uploadedUrl) {
      toast.error('请先上传头像');
      return;
    }
    
    try {
      // 更新个人资料
      const result = await usersApi.updateProfile({
        nickname: user.nickname,
        avatarUrl: uploadedUrl
      });
      
      console.log('更新个人资料成功:', result);
      
      // 强制刷新用户信息
      await forceRefreshUserProfile();
      
      toast.success('头像已更新');
    } catch (error) {
      console.error('更新个人资料失败:', error);
      toast.error('更新个人资料失败');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">头像URL调试工具</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">用户信息</h2>
        {user ? (
          <div>
            <p>用户ID: {user.id}</p>
            <p>用户名: {user.username}</p>
            <p>昵称: {user.nickname}</p>
            <p>原始头像URL: {user.avatarUrl || '未设置'}</p>
            <p>处理后头像URL: {user.avatarUrl ? processImageUrl(user.avatarUrl) : '未设置'}</p>
            <p>一致性处理后URL: {user.avatarUrl ? ensureAvatarUrlConsistency(user.avatarUrl) : '未设置'}</p>
            <p>是否微信用户: {user.isWechatUser ? '是' : '否'}</p>
            {user.isWechatUser && (
              <>
                <p>微信头像: {user.wechatAvatar || '未设置'}</p>
                <p>处理后微信头像: {user.wechatAvatar ? processImageUrl(user.wechatAvatar) : '未设置'}</p>
              </>
            )}
          </div>
        ) : (
          <p>未登录</p>
        )}
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">头像显示测试</h2>
        <p className="mb-2">后端API基础URL: {baseUrl}</p>
        
        <div className="flex flex-col gap-4">
          {user?.avatarUrl && (
            <div>
              <h3 className="font-medium">原始头像:</h3>
              <div className="flex items-center gap-4">
                <img 
                  src={user.avatarUrl} 
                  alt="原始头像" 
                  className="w-20 h-20 object-cover rounded-full border-2 border-gray-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const next = e.currentTarget.nextElementSibling;
                    if (next) next.textContent = '加载失败';
                  }}
                />
                <span></span>
              </div>
              <p className="text-xs break-all mt-1">{user.avatarUrl}</p>
            </div>
          )}
          
          {user?.avatarUrl && (
            <div>
              <h3 className="font-medium">处理后头像:</h3>
              <div className="flex items-center gap-4">
                <img 
                  src={processImageUrl(user.avatarUrl)} 
                  alt="处理后头像" 
                  className="w-20 h-20 object-cover rounded-full border-2 border-gray-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const next = e.currentTarget.nextElementSibling;
                    if (next) next.textContent = '加载失败';
                  }}
                />
                <span></span>
              </div>
              <p className="text-xs break-all mt-1">{processImageUrl(user.avatarUrl)}</p>
            </div>
          )}
          
          {user?.avatarUrl && (
            <div>
              <h3 className="font-medium">一致性处理后头像:</h3>
              <div className="flex items-center gap-4">
                <img 
                  src={ensureAvatarUrlConsistency(user.avatarUrl)} 
                  alt="一致性处理后头像" 
                  className="w-20 h-20 object-cover rounded-full border-2 border-gray-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const next = e.currentTarget.nextElementSibling;
                    if (next) next.textContent = '加载失败';
                  }}
                />
                <span></span>
              </div>
              <p className="text-xs break-all mt-1">{ensureAvatarUrlConsistency(user.avatarUrl)}</p>
            </div>
          )}
          
          {user?.avatarUrl && (
            <div>
              <h3 className="font-medium">带域名的头像:</h3>
              <div className="flex items-center gap-4">
                <img 
                  src={`${baseUrl}${user.avatarUrl.startsWith('/') ? '' : '/'}${user.avatarUrl}`} 
                  alt="带域名的头像" 
                  className="w-20 h-20 object-cover rounded-full border-2 border-gray-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const next = e.currentTarget.nextElementSibling;
                    if (next) next.textContent = '加载失败';
                  }}
                />
                <span></span>
              </div>
              <p className="text-xs break-all mt-1">{`${baseUrl}${user.avatarUrl.startsWith('/') ? '' : '/'}${user.avatarUrl}`}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">头像上传测试</h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              onChange={handleAvatarUpload}
              accept="image/*"
              disabled={uploading}
              className="flex-1"
            />
            <button
              onClick={() => updateProfile()}
              disabled={!uploadedUrl || uploading}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
            >
              {uploading ? '上传中...' : '更新头像'}
            </button>
          </div>
          
          {uploadedUrl && (
            <div>
              <h3 className="font-medium">上传的头像:</h3>
              <div className="flex items-center gap-4">
                <img 
                  src={uploadedUrl} 
                  alt="上传的头像" 
                  className="w-20 h-20 object-cover rounded-full border-2 border-gray-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => testImage(uploadedUrl)}
                    className="px-2 py-1 bg-green-500 text-white text-sm rounded"
                  >
                    测试此URL
                  </button>
                  <button
                    onClick={() => testImage(ensureAvatarUrlConsistency(uploadedUrl))}
                    className="px-2 py-1 bg-purple-500 text-white text-sm rounded"
                  >
                    测试一致性URL
                  </button>
                </div>
              </div>
              <p className="text-xs break-all mt-1">原始URL: {uploadedUrl}</p>
              <p className="text-xs break-all mt-1">一致性URL: {ensureAvatarUrlConsistency(uploadedUrl)}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">自定义URL测试</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="输入头像URL进行测试"
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={() => testImage(testUrl)}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            测试
          </button>
        </div>
        
        {testUrl && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <img 
                src={testUrl} 
                alt="测试头像" 
                className="w-20 h-20 object-cover rounded-full border-2 border-gray-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div>
                {testResult && <p>结果: {testResult}</p>}
                {errorMsg && <p className="text-red-500">{errorMsg}</p>}
              </div>
            </div>
            <p className="text-xs break-all mt-1">输入URL: {testUrl}</p>
            <p className="text-xs break-all mt-1">一致性URL: {ensureAvatarUrlConsistency(testUrl)}</p>
            <div className="mt-2">
              <button
                onClick={() => testImage(ensureAvatarUrlConsistency(testUrl))}
                className="px-2 py-1 bg-purple-500 text-white text-sm rounded"
              >
                测试一致性URL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 