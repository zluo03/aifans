'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CheckImageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [directUrl, setDirectUrl] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');
  const [apiCheckResult, setApiCheckResult] = useState<any>(null);
  const [isCheckingAPI, setIsCheckingAPI] = useState(false);
  const [fileCheckResult, setFileCheckResult] = useState<any>(null);
  const [isCheckingFile, setIsCheckingFile] = useState(false);
  const [filePath, setFilePath] = useState('');

  useEffect(() => {
    const urlParam = searchParams?.get('url');
    if (urlParam) {
      setImageUrl(decodeURIComponent(urlParam));
      
      // 如果URL包含/uploads/，提取相对路径用于文件系统检查
      if (urlParam.includes('/uploads/')) {
        const pathMatch = urlParam.match(/\/uploads\/(.+?)(\?|$)/);
        if (pathMatch && pathMatch[1]) {
          setFilePath(pathMatch[1]);
        }
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!imageUrl) return;
    
    // 创建图片元素
    const img = new Image();
    img.onload = () => {
      setStatus('success');
      console.log('图片加载成功:', {
        url: imageUrl,
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = (e) => {
      setStatus('error');
      console.error('图片加载失败:', {
        url: imageUrl,
        error: e
      });
    };
    img.src = imageUrl;

    // 尝试获取不带时间戳的URL
    let directUrl = imageUrl;
    if (directUrl.includes('?')) {
      directUrl = directUrl.split('?')[0];
    }
    setDirectUrl(directUrl);
    
    // 生成代理URL
    if (imageUrl.includes('/uploads/avatar/')) {
      const match = imageUrl.match(/\/uploads\/avatar\/([^/?]+)/);
      if (match && match[1]) {
        const filename = match[1];
        setProxyUrl(`/api/proxy/avatar/${filename}`);
      }
    }
  }, [imageUrl]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    router.push(`/check-image?url=${encodeURIComponent(imageUrl)}`);
  };

  // 测试图片是否存在
  const checkImageAPI = async (url: string) => {
    if (!url) return;
    
    setIsCheckingAPI(true);
    try {
      const response = await fetch(`/api/check-image?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      setApiCheckResult(data);
      console.log('API检查结果:', data);
    } catch (error) {
      console.error('API检查失败:', error);
      setApiCheckResult({ error: '检查失败', message: String(error) });
    } finally {
      setIsCheckingAPI(false);
    }
  };
  
  // 测试后端文件是否存在
  const checkBackendFile = async (path: string) => {
    if (!path) return;
    
    setIsCheckingFile(true);
    try {
      const response = await fetch(`/api/check-backend-file?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      setFileCheckResult(data);
      console.log('文件检查结果:', data);
    } catch (error) {
      console.error('文件检查失败:', error);
      setFileCheckResult({ error: '检查失败', message: String(error) });
    } finally {
      setIsCheckingFile(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">图片检查工具</h1>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={imageUrl}
            onChange={handleUrlChange}
            placeholder="输入图片URL"
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            检查
          </button>
        </div>
      </form>

      {imageUrl && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">图片测试</h2>
          
          <div className="mb-4">
            <p className="text-sm font-medium">状态: {
              status === 'loading' ? '加载中...' :
              status === 'success' ? '加载成功' :
              '加载失败'
            }</p>
          </div>
          
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-medium">原始URL:</h3>
              <p className="text-xs break-all mb-2">{imageUrl}</p>
              
              <div className="border p-4 bg-white">
                <img 
                  src={imageUrl}
                  alt="图片测试" 
                  className="max-w-full h-auto"
                  style={{ maxHeight: '300px' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
            
            {directUrl !== imageUrl && (
              <div>
                <h3 className="font-medium">不带参数的URL:</h3>
                <p className="text-xs break-all mb-2">{directUrl}</p>
                
                <div className="border p-4 bg-white">
                  <img 
                    src={directUrl}
                    alt="不带参数的图片" 
                    className="max-w-full h-auto"
                    style={{ maxHeight: '300px' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
            
            {proxyUrl && (
              <div>
                <h3 className="font-medium">代理URL:</h3>
                <p className="text-xs break-all mb-2">{proxyUrl}</p>
                
                <div className="border p-4 bg-white">
                  <img 
                    src={proxyUrl}
                    alt="代理图片" 
                    className="max-w-full h-auto"
                    style={{ maxHeight: '300px' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <h3 className="font-medium">HTTP请求测试:</h3>
            <div className="flex gap-2 mt-2">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(imageUrl, { 
                      method: 'HEAD',
                      cache: 'no-store'
                    });
                    
                    alert(`状态: ${response.status} ${response.statusText}\n内容类型: ${response.headers.get('content-type')}\n内容长度: ${response.headers.get('content-length')}`);
                  } catch (error) {
                    alert(`请求失败: ${error}`);
                  }
                }}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                浏览器测试
              </button>
              
              <button
                onClick={() => checkImageAPI(imageUrl)}
                disabled={isCheckingAPI}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
              >
                {isCheckingAPI ? '检查中...' : '服务器测试'}
              </button>
            </div>
            
            {apiCheckResult && (
              <div className="mt-4 border p-4 bg-white rounded">
                <h4 className="font-medium mb-2">服务器检查结果:</h4>
                <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded">
                  {JSON.stringify(apiCheckResult, null, 2)}
                </pre>
                
                {apiCheckResult.accessible ? (
                  <p className="text-green-600 mt-2 font-bold">图片可访问</p>
                ) : (
                  <p className="text-red-600 mt-2 font-bold">图片不可访问</p>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium mb-2">常见问题解决方案:</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>图片不可访问 (404):</strong> 检查后端文件是否存在，路径是否正确
              </li>
              <li>
                <strong>CORS 错误:</strong> 后端需要配置正确的CORS头部，允许前端访问
              </li>
              <li>
                <strong>路径错误:</strong> 确认API基础URL配置正确，例如 <code>NEXT_PUBLIC_API_URL</code>
              </li>
              <li>
                <strong>无法加载:</strong> 确认图片格式正确，不要在URL中包含中文或特殊字符
              </li>
              <li>
                <strong>后端权限:</strong> 确认后端文件服务器配置正确的权限，允许匿名访问上传目录
              </li>
            </ul>
          </div>
        </div>
      )}

      {filePath && (
        <div className="mt-6">
          <h3 className="font-medium">后端文件检查:</h3>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              className="flex-1 p-2 border rounded"
              placeholder="文件相对路径 (例如: avatar/image.jpg)"
            />
            <button
              onClick={() => checkBackendFile(filePath)}
              disabled={isCheckingFile}
              className="px-4 py-2 bg-purple-500 text-white rounded disabled:bg-gray-400"
            >
              {isCheckingFile ? '检查中...' : '检查文件'}
            </button>
          </div>
          
          {fileCheckResult && (
            <div className="mt-4 border p-4 bg-white rounded">
              <h4 className="font-medium mb-2">文件检查结果:</h4>
              <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded">
                {JSON.stringify(fileCheckResult, null, 2)}
              </pre>
              
              {fileCheckResult.exists ? (
                <p className="text-green-600 mt-2 font-bold">文件存在</p>
              ) : (
                <p className="text-red-600 mt-2 font-bold">文件不存在</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <h3 className="font-medium">常见问题解决方案:</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li>
            <strong>文件不存在:</strong> 检查文件路径是否正确，文件是否上传到服务器
          </li>
          <li>
            <strong>文件权限:</strong> 确认文件服务器配置正确的权限，允许匿名访问上传目录
          </li>
          <li>
            <strong>路径错误:</strong> 确认文件路径配置正确，不要包含中文或特殊字符
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function CheckImagePage() {
  return (
    <Suspense fallback={<div className="p-6">加载中...</div>}>
      <CheckImageContent />
    </Suspense>
  );
} 