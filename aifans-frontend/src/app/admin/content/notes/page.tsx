'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { toast } from 'sonner';
import axios from 'axios';
import { Eye, Search, Filter, Loader2, Check, X, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store/auth-store';

// 笔记状态对应的Badge
const NoteStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'VISIBLE':
      return <Badge className="bg-green-500">可见</Badge>;
    case 'HIDDEN_BY_ADMIN':
      return <Badge variant="secondary">已隐藏</Badge>;
    case 'ADMIN_DELETED':
      return <Badge variant="destructive">已删除</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

// 笔记接口定义
interface Note {
  id: number;
  title: string;
  content: any;
  coverImageUrl: string | null;
  categoryId: number;
  userId: number;
  likesCount: number;
  favoritesCount: number;
  viewsCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    nickname: string | null;
  };
  category: {
    id: number;
    name: string;
  };
}

export default function AdminNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all-status');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ 
    type: 'visibility' | 'delete'; 
    id: number; 
    status?: string;
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { token } = useAuthStore();

  // 获取笔记列表
  const fetchNotes = async () => {
    if (!token) {
      toast.error('请先登录');
      return;
    }

    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.query = search;
      if (statusFilter && statusFilter !== 'all-status') params.status = statusFilter;
      
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      const response = await fetch('/api/admin/notes?' + new URLSearchParams(params), {
        headers: {
          'Authorization': formattedToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`获取列表失败: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      setNotes(data.notes || []);
    } catch (error) {
      console.error('获取笔记列表失败:', error);
      toast.error(error instanceof Error ? error.message : '获取笔记列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // 处理搜索
  const handleSearch = () => {
    fetchNotes();
  };

  // 查看笔记详情
  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setShowDetailDialog(true);
  };

  // 处理修改笔记可见性
  const handleUpdateVisibility = (id: number, status: string) => {
    setConfirmAction({ type: 'visibility', id, status });
    setShowConfirmDialog(true);
  };

  // 处理删除笔记
  const handleDelete = (id: number) => {
    setConfirmAction({ type: 'delete', id });
    setShowConfirmDialog(true);
  };

  // 确认操作
  const confirmOperation = async () => {
    if (!confirmAction) return;
    
    setActionLoading(true);
    
    try {
      if (confirmAction.type === 'visibility' && confirmAction.status) {
        await axios.patch(`/api/admin/notes/${confirmAction.id}`, {
          status: confirmAction.status
        });
        
        toast.success(confirmAction.status === 'VISIBLE' ? '笔记已设为可见' : '笔记已隐藏');
      } else if (confirmAction.type === 'delete') {
        await axios.delete(`/api/admin/notes/${confirmAction.id}`);
        toast.success('笔记已被删除');
      }
      
      // 刷新笔记列表
      fetchNotes();
      
      // 关闭确认对话框
      setShowConfirmDialog(false);
      setConfirmAction(null);
    } catch (error) {
      toast.error('操作失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">笔记管理</h1>
        <div className="flex space-x-2">
          <div className="relative w-64">
            <Input
              placeholder="搜索笔记标题..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-0 top-0 h-full"
              onClick={handleSearch}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="筛选状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-status">全部状态</SelectItem>
              <SelectItem value="VISIBLE">可见</SelectItem>
              <SelectItem value="HIDDEN_BY_ADMIN">已隐藏</SelectItem>
              <SelectItem value="ADMIN_DELETED">已删除</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={fetchNotes}>
            <Filter className="h-4 w-4 mr-2" />
            筛选
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>笔记列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>作者</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>浏览/点赞/收藏</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6">
                      暂无笔记
                    </TableCell>
                  </TableRow>
                ) : (
                  notes.map((note) => (
                    <TableRow key={note.id}>
                      <TableCell>{note.id}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {note.title}
                      </TableCell>
                      <TableCell>
                        {note.user.nickname || note.user.username}
                      </TableCell>
                      <TableCell>{note.category.name}</TableCell>
                      <TableCell>
                        <NoteStatusBadge status={note.status} />
                      </TableCell>
                      <TableCell>
                        {note.viewsCount} / {note.likesCount} / {note.favoritesCount}
                      </TableCell>
                      <TableCell>
                        {format(new Date(note.createdAt), 'yyyy-MM-dd HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewNote(note)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {note.status === 'VISIBLE' ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUpdateVisibility(note.id, 'HIDDEN_BY_ADMIN')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          ) : note.status === 'HIDDEN_BY_ADMIN' ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUpdateVisibility(note.id, 'VISIBLE')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          ) : null}
                          
                          {note.status !== 'ADMIN_DELETED' && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDelete(note.id)}
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 笔记详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>笔记详情</DialogTitle>
          </DialogHeader>
          {selectedNote && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <h3 className="text-lg font-semibold">{selectedNote.title}</h3>
                <div className="text-sm text-muted-foreground">
                  由 {selectedNote.user.nickname || selectedNote.user.username} 发布于 
                  {format(new Date(selectedNote.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                </div>
              </div>
              
              {selectedNote.coverImageUrl && (
                <div>
                  <img 
                    src={selectedNote.coverImageUrl} 
                    alt={selectedNote.title}
                    className="rounded-md max-h-[200px] object-cover" 
                  />
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">笔记内容</h4>
                <div className="border rounded-md p-4 bg-muted/30">
                  {/* 简单渲染内容预览，实际应该使用编辑器组件 */}
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(selectedNote.content, null, 2)}
                  </pre>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">分类</p>
                  <p>{selectedNote.category.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">状态</p>
                  <NoteStatusBadge status={selectedNote.status} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">浏览量</p>
                  <p>{selectedNote.viewsCount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">点赞数</p>
                  <p>{selectedNote.likesCount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">收藏数</p>
                  <p>{selectedNote.favoritesCount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">最后更新</p>
                  <p>{format(new Date(selectedNote.updatedAt), 'yyyy-MM-dd HH:mm:ss')}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 确认操作对话框 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>确认操作</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {confirmAction?.type === 'visibility' && (
              <p>
                {confirmAction.status === 'VISIBLE' 
                  ? '确定要将这篇笔记设为可见吗？' 
                  : '确定要隐藏这篇笔记吗？'
                }
              </p>
            )}
            {confirmAction?.type === 'delete' && (
              <p>确定要删除这篇笔记吗？此操作无法撤销。</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              取消
            </Button>
            <Button 
              variant={confirmAction?.type === 'delete' ? 'destructive' : 'default'}
              onClick={confirmOperation}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 