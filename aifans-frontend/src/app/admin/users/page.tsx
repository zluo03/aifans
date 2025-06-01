'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api/api';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Image from 'next/image';
import debounce from 'lodash/debounce';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { PASSWORD_RULES, validatePassword } from '@/lib/utils/validation';
import { PasswordInput } from '@/components/ui/password-input';
import { processImageUrl } from '@/lib/utils/image-url';
import { useAuthStore } from '@/lib/store/auth-store';
import { broadcastUserRoleUpdate, broadcastUserStatusUpdate } from '@/lib/utils/broadcast-channel';

interface User {
  id: number;
  username: string;
  nickname: string;
  email: string;
  role: 'NORMAL' | 'PREMIUM' | 'LIFETIME' | 'ADMIN';
  status: 'ACTIVE' | 'MUTED' | 'BANNED';
  createdAt: string;
  avatarUrl?: string;
  premiumExpiryDate?: string;
}

interface UsersResponse {
  items: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function UsersAdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { forceRefreshUserProfile } = useAuthStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    nickname: '',
    email: '',
    password: '',
    role: 'NORMAL',
    status: 'ACTIVE',
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // 权限检查
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/');
      toast.error('没有访问权限');
    }
  }, [user, router]);

  // 构建查询键
  const queryKey = useMemo(() => ['users', page, limit, search, roleFilter, statusFilter], 
    [page, limit, search, roleFilter, statusFilter]
  );

  // 使用 React Query 获取用户数据
  const { data, isLoading, error } = useQuery<UsersResponse>({
    queryKey,
    queryFn: async () => {
      try {
        let url = `admin/users?page=${page}&limit=${limit}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (roleFilter && roleFilter !== 'all') url += `&role=${roleFilter}`;
        if (statusFilter && statusFilter !== 'all') url += `&status=${statusFilter}`;
        
        console.log('请求用户列表:', url);
        
        // 同步token状态
        const syncToken = () => {
          // 检查token是否存在
          let token = localStorage.getItem('token');
          
          // 如果token不存在，尝试从auth-storage恢复
          if (!token) {
            try {
              const authStorage = localStorage.getItem('auth-storage');
              if (authStorage) {
                const authData = JSON.parse(authStorage);
                if (authData.state && authData.state.token) {
                  const stateToken = authData.state.token;
                  if (typeof stateToken === 'string') {
                    token = stateToken;
                    // 同步回token存储
                    localStorage.setItem('token', stateToken);
                    console.log('已从auth-storage恢复token');
                  }
                }
              }
            } catch (e) {
              console.error('解析auth-storage失败:', e);
            }
          }
          
          return token;
        };
        
        // 获取并同步token
        const token = syncToken();
        console.log('当前token状态:', token ? '已存在' : '不存在', token ? `(${token.substring(0, 10)}...)` : '');
        
        // 验证token是否有效
        if (!token) {
          console.error('Token不存在，无法获取用户列表');
          toast.error('登录信息已过期，请重新登录');
          router.push('/login');
          throw new Error('登录凭证不存在');
        }
        
        // 检查auth-storage是否存在
        const authStorage = localStorage.getItem('auth-storage');
        console.log('auth-storage状态:', authStorage ? '已存在' : '不存在');
        
        // 已确认token存在，安全地使用token
        const response = await api.get<UsersResponse>(url, {
          headers: {
            Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`
          }
        });
        
        console.log('用户列表请求成功, 返回条目数:', response.data.items?.length);
        return response.data;
      } catch (error: any) {
        console.error('获取用户列表失败:', {
          message: error.message,
          status: error.status || error.response?.status,
          statusText: error.statusText,
          errorData: error.data || error.response?.data,
          isNetworkError: error.isNetworkError,
          details: error.details,
          stack: error.stack
        });
        
        // 如果是401或403错误，提示用户重新登录
        if (error.status === 401 || error.status === 403 || 
            error.response?.status === 401 || error.response?.status === 403) {
          toast.error('登录已过期或没有权限，请重新登录');
          router.push('/login');
        } else {
          // 其他错误给出友好提示
          toast.error(error.message || '获取用户列表失败，请重试');
        }
        
        throw error;
      }
    },
    staleTime: 30000, // 数据30秒内认为是新鲜的
    gcTime: 300000, // 缓存5分钟
    retry: 3, // 失败时重试3次
    retryDelay: (attemptIndex) => Math.min(1000 * (2 ** attemptIndex), 10000), // 指数退避策略
    refetchOnWindowFocus: false, // 窗口聚焦时不重新获取
  });

  // 预加载下一页数据
  useEffect(() => {
    const users = data as UsersResponse;
    if (users?.meta?.totalPages > page) {
      const nextPage = page + 1;
      queryClient.prefetchQuery({
        queryKey: ['users', nextPage, limit, search, roleFilter, statusFilter],
        queryFn: async () => {
          let url = `admin/users?page=${nextPage}&limit=${limit}`;
          if (search) url += `&search=${encodeURIComponent(search)}`;
          if (roleFilter && roleFilter !== 'all') url += `&role=${roleFilter}`;
          if (statusFilter && statusFilter !== 'all') url += `&status=${statusFilter}`;
          
          const response = await api.get<UsersResponse>(url);
          return response.data;
        },
      });
    }
  }, [data, page, limit, search, roleFilter, statusFilter, queryClient]);

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
    // 立即触发搜索，不使用防抖
    setSearch((e.target as HTMLFormElement).querySelector('input')?.value || '');
    setPage(1);
  };

  // 处理角色筛选变更
  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setPage(1);
  };

  // 处理状态筛选变更
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  // 处理创建用户
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('创建用户表单提交', newUser);
    
    if (isCreating) {
      console.log('已经在创建中，跳过');
      return;
    }

    // 表单验证
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast.error('请填写所有必填字段');
      console.log('表单验证失败: 缺少必填字段');
      return;
    }

    // 验证用户名格式
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(newUser.username)) {
      console.log('用户名验证详情:', {
        用户名: newUser.username,
        长度: newUser.username.length,
        验证结果: /^[a-zA-Z0-9_]{3,20}$/.test(newUser.username),
        正则匹配: newUser.username.match(/^[a-zA-Z0-9_]{3,20}$/)
      });
      
      // 提供更具体的错误消息
      if (newUser.username.length < 3) {
        toast.error('用户名长度不能少于3个字符');
        console.log('用户名格式验证失败: 长度小于3个字符');
      } else if (newUser.username.length > 20) {
        toast.error('用户名长度不能超过20个字符');
        console.log('用户名格式验证失败: 长度超过20个字符');
      } else {
        toast.error('用户名只能包含字母、数字和下划线');
        console.log('用户名格式验证失败: 包含非法字符');
      }
      return;
    }

    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      toast.error('请输入有效的邮箱地址');
      console.log('邮箱格式验证失败');
      return;
    }

    // 验证密码
    const passwordValidation = validatePassword(newUser.password);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.message);
      console.log('密码验证失败:', passwordValidation.message);
      return;
    }

    setIsCreating(true);
    console.log('开始创建用户...');
    
    try {
      console.log('发送创建用户请求到:', '/admin/users');
      console.log('发送数据:', newUser);
      
      // 使用api实例，它会自动处理认证
      const result = await api.post('/admin/users', newUser);
      
      console.log('创建用户成功:', result.data);
      toast.success('用户创建成功');
      setNewUser({
        username: '',
        nickname: '',
        email: '',
        password: '',
        role: 'NORMAL',
        status: 'ACTIVE'
      });
      
      // 关闭对话框
      setIsCreateDialogOpen(false);
      
      // 使用 React Query 使缓存失效并重新获取数据
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error: any) {
      console.error('创建用户错误:', error);
      toast.error(error.response?.data?.message || error.message || '创建用户失败，请重试');
    } finally {
      setIsCreating(false);
    }
  };

  // 处理更新角色
  const handleUpdateRole = async (userId: number, role: string) => {
    try {
      // 使用api实例，它会自动处理认证
      await api.patch(`/admin/users/${userId}/role`, { role });
      
      toast.success('角色更新成功');
      
      // 使用 React Query 使缓存失效并重新获取数据
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // 使用广播通道触发跨标签页的用户角色更新事件
      broadcastUserRoleUpdate(userId, role);
      
      // 如果更新的是当前登录用户，刷新用户状态
      if (user && user.id === userId) {
        console.log('检测到当前用户角色变更，刷新用户状态');
        
        // 先尝试强制刷新用户资料
        try {
          await forceRefreshUserProfile();
          console.log('forceRefreshUserProfile 执行完成');
        } catch (error) {
          console.error('forceRefreshUserProfile 失败:', error);
        }
        
        // 无论是否成功，都显示提示并刷新页面
        toast.success('您的用户等级已更新，页面将自动刷新');
        
        // 延迟刷新页面，确保状态更新
        setTimeout(() => {
          // 清除本地存储，强制重新获取
          localStorage.removeItem('auth-storage');
          sessionStorage.removeItem('auth-storage');
          
          // 刷新页面
          window.location.reload();
        }, 1000);
      }
    } catch (error: any) {
      console.error('更新角色失败:', error);
      toast.error(error.message || '角色更新失败');
    }
  };

  // 处理更新状态
  const handleUpdateStatus = async (userId: number, status: string) => {
    try {
      // 使用api实例，它会自动处理认证
      await api.patch(`/admin/users/${userId}/status`, { status });
      
      toast.success('状态更新成功');
      
      // 使用 React Query 使缓存失效并重新获取数据
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // 使用广播通道触发跨标签页的用户状态更新事件
      broadcastUserStatusUpdate(userId, status);
      
      // 如果更新的是当前登录用户，刷新用户状态
      if (user && user.id === userId) {
        console.log('检测到当前用户状态变更，刷新用户状态');
        try {
          await forceRefreshUserProfile();
          toast.success('您的用户状态已更新，页面将自动刷新');
          // 延迟刷新页面，让用户看到提示
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
          console.error('刷新用户状态失败:', error);
          toast.warning('状态更新成功，但状态刷新失败，请重新登录以查看最新状态');
        }
      }
    } catch (error: any) {
      console.error('更新状态失败:', error);
      toast.error(error.message || '状态更新失败');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-red-500">管理员</Badge>;
      case 'PREMIUM':
        return <Badge className="bg-purple-500">高级用户</Badge>;
      case 'LIFETIME':
        return <Badge className="bg-blue-500">终身会员</Badge>;
      default:
        return <Badge className="bg-gray-500">普通用户</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">正常</Badge>;
      case 'MUTED':
        return <Badge className="bg-yellow-500">禁言</Badge>;
      case 'BANNED':
        return <Badge className="bg-red-500">封禁</Badge>;
      default:
        return null;
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return null; // 权限检查中，不渲染内容
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <CardTitle>用户管理</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>创建新用户</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建新用户</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="username">用户名</label>
                    <Input
                      id="username"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="nickname">昵称</label>
                    <Input
                      id="nickname"
                      value={newUser.nickname}
                      onChange={(e) => setNewUser({ ...newUser, nickname: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="email">邮箱</label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">密码</Label>
                    <PasswordInput
                      id="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="输入密码"
                    />
                    <p className="text-sm text-muted-foreground">
                      {PASSWORD_RULES.text}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="role">角色</label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择角色" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NORMAL">普通用户</SelectItem>
                        <SelectItem value="PREMIUM">高级用户</SelectItem>
                        <SelectItem value="LIFETIME">终身会员</SelectItem>
                        <SelectItem value="ADMIN">管理员</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="status">状态</label>
                    <Select
                      value={newUser.status}
                      onValueChange={(value) => setNewUser({ ...newUser, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">正常</SelectItem>
                        <SelectItem value="MUTED">禁言</SelectItem>
                        <SelectItem value="BANNED">封禁</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      type="submit"
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          创建中...
                        </>
                      ) : '创建'}
                    </Button>
                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
              <Input
                placeholder="搜索用户名或昵称"
                defaultValue={search}
                onChange={handleSearchInput}
                className="flex-1"
              />
              <Button type="submit">搜索</Button>
            </form>
            <div className="flex gap-2">
              <Select
                value={roleFilter}
                onValueChange={handleRoleFilterChange}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="角色筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部角色</SelectItem>
                  <SelectItem value="NORMAL">普通用户</SelectItem>
                  <SelectItem value="PREMIUM">高级用户</SelectItem>
                  <SelectItem value="LIFETIME">终身会员</SelectItem>
                  <SelectItem value="ADMIN">管理员</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="ACTIVE">正常</SelectItem>
                  <SelectItem value="MUTED">禁言</SelectItem>
                  <SelectItem value="BANNED">封禁</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-3 px-4 text-left font-medium">用户信息</th>
                  <th className="py-3 px-4 text-left font-medium">Email</th>
                  <th className="py-3 px-4 text-left font-medium">角色</th>
                  <th className="py-3 px-4 text-left font-medium">状态</th>
                  <th className="py-3 px-4 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        <span>加载中...</span>
                      </div>
                    </td>
                  </tr>
                ) : !data?.items || data.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-muted-foreground">
                      {search || roleFilter !== 'all' || statusFilter !== 'all' 
                        ? '未找到匹配的用户'
                        : '暂无用户数据'}
                    </td>
                  </tr>
                ) : (
                  data.items.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-full overflow-hidden">
                            <Image
                              src={processImageUrl(user.avatarUrl)}
                              alt={user.nickname}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium">{user.nickname}</div>
                            <div className="text-xs text-muted-foreground">@{user.username}</div>
                            <div className="text-xs text-muted-foreground">
                              注册: {format(new Date(user.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {getRoleBadge(user.role)}
                          {user.premiumExpiryDate && user.role === 'PREMIUM' && (
                            <div className="text-xs text-muted-foreground">
                              到期: {format(new Date(user.premiumExpiryDate), 'yyyy-MM-dd', { locale: zhCN })}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          {/* 只有非默认admin用户才显示管理按钮 */}
                          {user.username !== 'admin' ? (
                            <>
                              <Select
                                defaultValue={user.role}
                                onValueChange={(value) => handleUpdateRole(user.id, value)}
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue placeholder="修改角色" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="NORMAL">普通用户</SelectItem>
                                  <SelectItem value="PREMIUM">高级用户</SelectItem>
                                  <SelectItem value="LIFETIME">终身会员</SelectItem>
                                  <SelectItem value="ADMIN">管理员</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              {user.status === 'ACTIVE' ? (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(user.id, 'MUTED')}
                                >
                                  禁言
                                </Button>
                              ) : user.status === 'MUTED' ? (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(user.id, 'ACTIVE')}
                                >
                                  解除禁言
                                </Button>
                              ) : null}
                              
                              {user.status !== 'BANNED' ? (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(user.id, 'BANNED')}
                                >
                                  封禁
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(user.id, 'ACTIVE')}
                                >
                                  解封
                                </Button>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">系统管理员</span>
                          )}
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
              总计 {data?.meta?.total || 0} 个用户
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
                disabled={!data?.meta?.totalPages || page >= data?.meta?.totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 