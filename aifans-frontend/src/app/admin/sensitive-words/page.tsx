'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/api';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/hooks';

interface SensitiveWord {
  id: number;
  word: string;
}

export default function SensitiveWordsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [words, setWords] = useState<SensitiveWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [wordToDelete, setWordToDelete] = useState<SensitiveWord | null>(null);
  
  // 权限检查
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/');
      toast.error('没有访问权限');
    }
  }, [user, router]);

  // 获取敏感词列表
  const fetchWords = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/sensitive-words');
      setWords(response.data);
    } catch (error) {
      console.error('Error fetching sensitive words:', error);
      toast.error('获取敏感词列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchWords();
    }
  }, [user]);

  // 添加敏感词
  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWord.trim()) {
      toast.error('敏感词不能为空');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post('/admin/sensitive-words', { word: newWord.trim() });
      toast.success('敏感词添加成功');
      setNewWord('');
      fetchWords();
    } catch (error) {
      console.error('Error adding sensitive word:', error);
      toast.error('添加敏感词失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 打开删除确认对话框
  const handleDeleteClick = (word: SensitiveWord) => {
    setWordToDelete(word);
    setDeleteDialogOpen(true);
  };

  // 确认删除敏感词
  const handleConfirmDelete = async () => {
    if (!wordToDelete) return;
    
    try {
      await api.delete(`/admin/sensitive-words/${wordToDelete.id}`);
      toast.success('敏感词已删除');
      
      // 更新本地数据
      setWords(prevWords => prevWords.filter(word => word.id !== wordToDelete.id));
      setDeleteDialogOpen(false);
      setWordToDelete(null);
    } catch (error) {
      console.error('Error deleting sensitive word:', error);
      toast.error('删除敏感词失败');
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return null; // 权限检查中，不渲染内容
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>敏感词管理</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddWord} className="flex gap-2 mb-6">
            <Input
              placeholder="输入敏感词"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              className="max-w-sm"
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? '添加中...' : '添加敏感词'}
            </Button>
          </form>

          {loading ? (
            <div className="py-10 text-center">加载中...</div>
          ) : words.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              暂无敏感词
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {words.map((word) => (
                <div
                  key={word.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <span className="font-medium">{word.word}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(word)}
                  >
                    删除
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除敏感词 "{wordToDelete?.word}" 吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 