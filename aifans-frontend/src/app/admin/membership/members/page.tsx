'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { membershipApi, Member, MembershipQueryDto } from '@/lib/api/membership';
import { Loader2, Search, Crown } from 'lucide-react';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const fetchMembers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const query: MembershipQueryDto = {
        page,
        limit: 20,
        search: search.trim() || undefined,
      };
      
      const response = await membershipApi.admin.getMembers(query);
      setMembers(response.data);
      setCurrentPage(response.page);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (error) {
      console.error('获取会员列表失败:', error);
      toast({
        title: '获取会员列表失败',
        description: '请稍后重试',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMembers(1, searchTerm);
  };

  const handlePageChange = (page: number) => {
    fetchMembers(page, searchTerm);
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'PREMIUM':
        return '高级会员';
      case 'LIFETIME':
        return '终身会员';
      case 'ADMIN':
        return '管理员';
      default:
        return '普通用户';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'PREMIUM':
        return 'default';
      case 'LIFETIME':
        return 'destructive';
      case 'ADMIN':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '正常';
      case 'MUTED':
        return '禁言';
      case 'BANNED':
        return '封禁';
      default:
        return status;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'MUTED':
        return 'secondary';
      case 'BANNED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-yellow-500" />
          <h1 className="text-2xl font-bold">会员管理</h1>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="搜索用户名、昵称或邮箱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-64"
          />
          <Button onClick={handleSearch} variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>会员列表 (共 {total} 人)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>用户名</TableHead>
                    <TableHead>昵称</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>会员等级</TableHead>
                    <TableHead>到期时间</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>注册时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        暂无会员数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{member.id}</TableCell>
                        <TableCell className="font-medium">{member.username}</TableCell>
                        <TableCell>{member.nickname}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(member.role) as any}>
                            {getRoleText(member.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {member.premiumExpiryDate ? (
                            member.role === 'LIFETIME' ? (
                              <span className="text-green-600">永久有效</span>
                            ) : (
                              format(new Date(member.premiumExpiryDate), 'yyyy-MM-dd')
                            )
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(member.status) as any}>
                            {getStatusText(member.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(member.createdAt), 'yyyy-MM-dd')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    上一页
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    第 {currentPage} 页，共 {totalPages} 页
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    下一页
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 