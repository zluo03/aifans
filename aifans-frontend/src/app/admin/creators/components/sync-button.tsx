'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function SyncCreatorsButton() {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/sync-creators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '同步失败');
      }

      const result = await response.json();
      toast.success(result.message || `同步成功，已更新 ${result.updated}/${result.total} 个创作者信息`);
    } catch (error: any) {
      console.error('同步创作者信息失败:', error);
      toast.error(error.message || '同步创作者信息失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSync} 
      disabled={loading}
      variant="default"
      className="gap-2"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading ? '同步中...' : '同步创作者信息'}
    </Button>
  );
} 