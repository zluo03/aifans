'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface Creator {
  id: number;
  userId: number;
  nickname: string;
  avatarUrl: string | null;
  bio: string | null;
  expertise: string | null;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export const columns: ColumnDef<Creator>[] = [
  {
    accessorKey: 'rank',
    header: '排名',
    cell: ({ row, table }) => {
      const index = table.getSortedRowModel().rows.findIndex(r => r.id === row.id);
      return (
        <div className="flex items-center gap-2">
          {index === 0 && <span className="text-2xl">🥇</span>}
          {index === 1 && <span className="text-2xl">🥈</span>}
          {index === 2 && <span className="text-2xl">🥉</span>}
          {index > 2 && (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              {index + 1}
            </div>
          )}
          {index <= 2 && <span className="ml-2 font-bold text-lg">#{index + 1}</span>}
        </div>
      );
    },
  },
  {
    accessorKey: 'nickname',
    header: '昵称',
    cell: ({ row }) => {
      const creator = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
            {creator.avatarUrl ? (
              <img 
                src={creator.avatarUrl} 
                alt={creator.nickname} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
                {creator.nickname.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="font-medium">{creator.nickname}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'score',
    header: '积分',
    cell: ({ row }) => {
      const score = row.original.score;
      return (
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          <span className="text-amber-600 font-bold text-lg">{score.toLocaleString()}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'userId',
    header: '用户ID',
  },
  {
    accessorKey: 'createdAt',
    header: '创建时间',
    cell: ({ row }) => {
      return new Date(row.original.createdAt).toLocaleDateString('zh-CN');
    },
  },
  {
    accessorKey: 'updatedAt',
    header: '最后更新',
    cell: ({ row }) => {
      return new Date(row.original.updatedAt).toLocaleDateString('zh-CN');
    },
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) => {
      const creator = row.original;
      const router = useRouter();
      
      return (
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/creators/${creator.userId}`)}
          >
            查看
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => router.push(`/admin/creators/${creator.id}/edit`)}
          >
            编辑
          </Button>
        </div>
      );
    },
  },
]; 