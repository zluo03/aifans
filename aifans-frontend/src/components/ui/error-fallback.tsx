'use client';

import { Button } from "./button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { SlideUp } from "./animations";
import Link from "next/link";

interface ErrorFallbackProps {
  error?: Error | string;
  resetErrorBoundary?: () => void;
  retry?: () => void;
  homeUrl?: string;
  message?: string;
  title?: string;
  className?: string;
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
  retry,
  homeUrl = "/",
  message = "抱歉，出现了一些错误。我们会尽快修复。",
  title = "出错了",
  className = "",
}: ErrorFallbackProps) {
  const errorMessage = error ? (typeof error === "string" ? error : error.message) : undefined;

  const handleRetry = () => {
    if (retry) {
      retry();
    } else if (resetErrorBoundary) {
      resetErrorBoundary();
    } else {
      window.location.reload();
    }
  };

  return (
    <SlideUp className={`rounded-lg p-6 max-w-xl mx-auto text-center ${className}`}>
      <div className="flex flex-col items-center">
        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        
        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 w-full text-left">
            <p className="text-sm font-mono text-red-800 dark:text-red-300 break-words">
              {errorMessage}
            </p>
          </div>
        )}
        
        <div className="flex flex-wrap gap-3 justify-center">
          <Button 
            variant="outline" 
            onClick={handleRetry}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            重试
          </Button>
          
          <Button
            variant="default"
            asChild
          >
            <Link href={homeUrl}>
              <Home className="h-4 w-4 mr-2" />
              返回首页
            </Link>
          </Button>
        </div>
      </div>
    </SlideUp>
  );
}

export function NetworkError({
  retry,
  message = "网络连接失败，请检查您的网络连接后重试。",
}: {
  retry?: () => void;
  message?: string;
}) {
  return (
    <ErrorFallback
      title="网络错误"
      message={message}
      retry={retry}
      className="bg-white dark:bg-gray-900 shadow-md"
    />
  );
}

export function NotFoundError({
  homeUrl = "/",
  message = "抱歉，您要访问的页面不存在或已被删除。",
}: {
  homeUrl?: string;
  message?: string;
}) {
  return (
    <ErrorFallback
      title="页面未找到"
      message={message}
      homeUrl={homeUrl}
      className="bg-white dark:bg-gray-900 shadow-md"
    />
  );
}

export function ServerError({
  retry,
  message = "服务器遇到问题，请稍后再试。",
}: {
  retry?: () => void;
  message?: string;
}) {
  return (
    <ErrorFallback
      title="服务器错误"
      message={message}
      retry={retry}
      className="bg-white dark:bg-gray-900 shadow-md"
    />
  );
}

export function AuthError({
  homeUrl = "/auth/login",
  message = "您需要登录才能访问此页面。",
}: {
  homeUrl?: string;
  message?: string;
}) {
  return (
    <ErrorFallback
      title="需要登录"
      message={message}
      homeUrl={homeUrl}
      className="bg-white dark:bg-gray-900 shadow-md"
    />
  );
}

export function PermissionError({
  homeUrl = "/",
  message = "您没有权限访问此页面。",
}: {
  homeUrl?: string;
  message?: string;
}) {
  return (
    <ErrorFallback
      title="权限不足"
      message={message}
      homeUrl={homeUrl}
      className="bg-white dark:bg-gray-900 shadow-md"
    />
  );
} 