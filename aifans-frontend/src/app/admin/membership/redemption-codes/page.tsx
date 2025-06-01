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
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { membershipApi, RedemptionCode, MembershipQueryDto } from '@/lib/api/membership';
import { Loader2, Plus, Gift, Copy, Search } from 'lucide-react';

export default function RedemptionCodesPage() {
  const [codes, setCodes] = useState<RedemptionCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [durationDays, setDurationDays] = useState(30);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const fetchCodes = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const query: MembershipQueryDto = {
        page,
        limit: 20,
        search: search.trim() || undefined,
      };
      
      const response = await membershipApi.admin.getRedemptionCodes(query);
      setCodes(response.data);
      setCurrentPage(response.page);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (error) {
      console.error('获取兑换码列表失败:', error);
      toast({
        title: '获取兑换码列表失败',
        description: '请稍后重试',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCodes(1, searchTerm);
  };

  const handlePageChange = (page: number) => {
    fetchCodes(page, searchTerm);
  };

  const handleCreateCode = async () => {
    if (durationDays <= 0) {
      toast({
        title: '参数错误',
        description: '有效期必须大于0天',
      });
      return;
    }

    try {
      setCreating(true);
      const newCode = await membershipApi.admin.createRedemptionCode({
        durationDays
      });
      
      toast({
        title: '兑换码生成成功',
        description: `兑换码：${newCode.code}`,
      });
      
      setShowCreateDialog(false);
      setDurationDays(30);
      fetchCodes(currentPage, searchTerm);
    } catch (error) {
      console.error('生成兑换码失败:', error);
      toast({
        title: '生成兑换码失败',
        description: '请稍后重试',
      });
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: '复制成功',
        description: '兑换码已复制到剪贴板',
      });
    } catch (error) {
      toast({
        title: '复制失败',
        description: '请手动复制兑换码',
      });
    }
  };

  const formatDuration = (days: number) => {
    if (days >= 365) {
      const years = Math.floor(days / 365);
      return `${years}年`;
    } else if (days >= 30) {
      const months = Math.floor(days / 30);
      return `${months}个月`;
    } else {
      return `${days}天`;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Gift className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-bold">兑换码管理</h1>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="搜索兑换码..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-64"
          />
          <Button onClick={handleSearch} variant="outline">
            <Search className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            生成兑换码
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>兑换码列表 (共 {total} 个)</CardTitle>
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
                    <TableHead>兑换码</TableHead>
                    <TableHead>有效期</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>使用者</TableHead>
                    <TableHead>使用时间</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        暂无兑换码数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    codes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell>{code.id}</TableCell>
                        <TableCell className="font-mono font-medium">
                          {code.code}
                        </TableCell>
                        <TableCell>{formatDuration(code.durationDays)}</TableCell>
                        <TableCell>
                          <Badge variant={code.isUsed ? 'secondary' : 'default'}>
                            {code.isUsed ? '已使用' : '未使用'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {code.usedByUser ? (
                            <div>
                              <div>{code.usedByUser.nickname}</div>
                              <div className="text-xs text-muted-foreground">
                                ID: {code.usedByUser.id}
                              </div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {code.usedAt ? (
                            format(new Date(code.usedAt), 'yyyy-MM-dd HH:mm')
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(code.createdAt), 'yyyy-MM-dd HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(code.code)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
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

      {/* 生成兑换码对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>生成兑换码</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="duration">有效期（天）</Label>
              <Input
                id="duration"
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value) || 0)}
                placeholder="30"
                min="1"
                max="3650"
              />
              <p className="text-xs text-muted-foreground mt-1">
                建议：30天（月度）、90天（季度）、365天（年度）
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={creating}
            >
              取消
            </Button>
            <Button onClick={handleCreateCode} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              生成兑换码
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 