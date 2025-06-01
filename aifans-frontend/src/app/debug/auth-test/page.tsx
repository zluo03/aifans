'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthTestPage() {
  const { user, token, login, logout } = useAuthStore();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [localStorageToken, setLocalStorageToken] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    // 在客户端加载localStorage数据
    if (typeof window !== 'undefined') {
      setLocalStorageToken(localStorage.getItem('token'));
    }
  }, []);

  const addTestResult = (test: string, result: any) => {
    setTestResults(prev => [...prev, { test, result, time: new Date().toLocaleTimeString() }]);
  };

  const testTokenStorage = () => {
    if (typeof window === 'undefined') return;
    
    const localToken = localStorage.getItem('token');
    const authStoreToken = token;
    
    addTestResult('Token存储检查', {
      localStorage: localToken ? `存在 (${localToken.slice(0, 20)}...)` : '不存在',
      authStore: authStoreToken ? `存在 (${authStoreToken.slice(0, 20)}...)` : '不存在',
      match: localToken === authStoreToken
    });
    
    // 更新状态
    setLocalStorageToken(localToken);
  };

  const testApiCall = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      addTestResult('API调用测试', {
        status: response.status,
        statusText: response.statusText,
        response: await response.text()
      });
    } catch (error) {
      addTestResult('API调用测试', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  const testUploadEndpoint = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      const formData = new FormData();
      const blob = new Blob(['test'], { type: 'text/plain' });
      formData.append('file', blob, 'test.txt');
      formData.append('folder', 'test');

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      const responseText = await response.text();
      addTestResult('上传端点测试', {
        status: response.status,
        statusText: response.statusText,
        response: responseText
      });
    } catch (error) {
      addTestResult('上传端点测试', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  const clearTests = () => {
    setTestResults([]);
  };

  // 在客户端挂载之前不渲染localStorage相关内容
  if (!isMounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">认证状态调试页面</h1>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">认证状态调试页面</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>当前用户状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>用户信息:</strong> {user ? JSON.stringify(user, null, 2) : '未登录'}</p>
              <p><strong>Token存在:</strong> {token ? '是' : '否'}</p>
              <p><strong>LocalStorage Token:</strong> {localStorageToken ? '存在' : '不存在'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>测试工具</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-x-4">
              <Button onClick={testTokenStorage}>检查Token存储</Button>
              <Button onClick={testApiCall}>测试API调用</Button>
              <Button onClick={testUploadEndpoint}>测试上传端点</Button>
              <Button onClick={clearTests} variant="outline">清除结果</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>测试结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-auto">
              {testResults.length === 0 ? (
                <p className="text-muted-foreground">暂无测试结果</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="font-medium">{result.test} - {result.time}</div>
                    <pre className="mt-2 text-sm bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 