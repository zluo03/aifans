import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

export function GuestAccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
      <div className="text-center max-w-md">
        <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">需要登录才能访问</h1>
        <p className="text-gray-600 mb-6">
          创作者页面需要登录后才能浏览。请先登录或注册账号。
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/login">登录</Link>
          </Button>
          <Button asChild>
            <Link href="/register">注册</Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 