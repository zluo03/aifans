'use client';

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  animated?: boolean;
}

export function Skeleton({
  className,
  animated = true,
  ...props
}: SkeletonProps) {
  if (animated) {
    return (
      <motion.div
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        className={cn("bg-muted rounded-md", className)}
        {...(props as any)}
      />
    );
  }
  
  return (
    <div
      className={cn("bg-muted rounded-md", className)}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[200px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="w-full space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function SkeletonAvatar() {
  return <Skeleton className="h-10 w-10 rounded-full" />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number, className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")} 
        />
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="w-full space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-start space-x-4">
          <SkeletonAvatar />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonSearchResults({ items = 3, withImage = true }: { items?: number, withImage?: boolean }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {withImage && <Skeleton className="h-16 w-16 rounded-md flex-shrink-0" />}
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
