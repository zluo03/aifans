"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import axios from 'axios';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Star, Trophy } from 'lucide-react';

interface Creator {
  id: number;
  userId: number;
  nickname: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCreatorsPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // 权限检查
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'ADMIN') {
      toast.error('只有管理员可以访问此页面');
      router.push('/');
      return;
    }

    fetchCreators();
  }, [user, router]);

  const fetchCreators = async () => {
    try {
      const response = await axios.get('/api/creators', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setCreators(response.data);
    } catch (error) {
      console.error('获取创作者列表失败:', error);
      toast.error('获取创作者列表失败');
    } finally {
      setLoading(false);
    }
  };

  const updateAllScores = async () => {
    setUpdating(true);
    try {
      await axios.post('/api/creators/score/update-all', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('所有创作者积分更新成功');
      // 重新获取数据
      await fetchCreators();
    } catch (error) {
      console.error('更新积分失败:', error);
      toast.error('更新积分失败');
    } finally {
      setUpdating(false);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  if (loading) {
    return (
      <div className="w-full py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 space-y-8">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回管理后台</span>
            </Link>
            <div className="h-6 w-px bg-border"></div>
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-500" />
              <h1 className="text-3xl font-bold">创作者积分管理</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={fetchCreators}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              刷新数据
            </Button>
            <Button 
              onClick={updateAllScores}
              disabled={updating}
              className="flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              {updating ? '更新中...' : '批量更新积分'}
            </Button>
          </div>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总创作者数</p>
                  <p className="text-2xl font-bold">{creators.length}</p>
                </div>
                <Star className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">最高积分</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {creators.length > 0 ? creators[0]?.score || 0 : 0}
                  </p>
                </div>
                <Trophy className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">平均积分</p>
                  <p className="text-2xl font-bold">
                    {creators.length > 0 
                      ? Math.round(creators.reduce((sum, c) => sum + c.score, 0) / creators.length)
                      : 0
                    }
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold">Avg</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总积分</p>
                  <p className="text-2xl font-bold text-green-600">
                    {creators.reduce((sum, c) => sum + c.score, 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-bold">∑</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 积分规则说明 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              积分规则说明
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-3">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  灵感板块积分
                </h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                    每上传一张图片：<span className="font-semibold text-blue-600">+10分</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                    每上传一个视频：<span className="font-semibold text-blue-600">+20分</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                    作品每获得1个赞：<span className="font-semibold text-blue-600">+1分</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                    作品每获得1个收藏：<span className="font-semibold text-blue-600">+2分</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  笔记板块积分
                </h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-green-400"></span>
                    每发布一篇笔记：<span className="font-semibold text-green-600">+100分</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-green-400"></span>
                    笔记每获得1个赞：<span className="font-semibold text-green-600">+2分</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-green-400"></span>
                    笔记每获得1个收藏：<span className="font-semibold text-green-600">+5分</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  登录积分
                </h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                    每天登录访问网站：<span className="font-semibold text-amber-600">+20分</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                    每天只计算一次
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>注意：</strong>当用户删除作品（包含灵感板块的图片与视频，笔记）时，该作品产生的所有积分都会被减去。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 创作者列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              创作者积分排行榜
            </CardTitle>
          </CardHeader>
          <CardContent>
            {creators.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">暂无创作者数据</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">排名</th>
                      <th className="text-left py-3 px-4 font-semibold">昵称</th>
                      <th className="text-left py-3 px-4 font-semibold">积分</th>
                      <th className="text-left py-3 px-4 font-semibold">用户ID</th>
                      <th className="text-left py-3 px-4 font-semibold">创建时间</th>
                      <th className="text-left py-3 px-4 font-semibold">最后更新</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creators.map((creator, index) => (
                      <tr key={creator.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {index === 0 && <span className="text-2xl">🥇</span>}
                            {index === 1 && <span className="text-2xl">🥈</span>}
                            {index === 2 && <span className="text-2xl">🥉</span>}
                            {index > 2 && (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </div>
                            )}
                            {index <= 2 && (
                              <span className="ml-2 font-bold text-lg">#{index + 1}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{creator.nickname}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500" />
                            <span className="text-amber-600 font-bold text-lg">{creator.score.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{creator.userId}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(creator.createdAt).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(creator.updatedAt).toLocaleDateString('zh-CN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
} 