'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoadingComplete'> {
  fallbackSrc?: string;
  showLoadingBlur?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  className,
  fallbackSrc = '/images/placeholder.svg',
  showLoadingBlur = true,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {showLoadingBlur && isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Image
        src={error ? fallbackSrc : src}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
        {...props}
      />
    </div>
  );
}

interface OptimizedAvatarProps extends Omit<ImageProps, 'onLoadingComplete'> {
  fallbackSrc?: string;
}

export function OptimizedAvatar({
  src,
  alt,
  className,
  fallbackSrc = '/images/default-avatar.png',
  width = 40,
  height = 40,
  ...props
}: OptimizedAvatarProps) {
  const [error, setError] = useState(false);
  const finalSrc = error ? fallbackSrc : src;
  const isExternalUrl = typeof finalSrc === 'string' && finalSrc.startsWith('http');

  return (
    <div className={cn('relative rounded-full overflow-hidden', className)}>
      {isExternalUrl ? (
        <img
          src={finalSrc}
          alt={alt}
          className="object-cover w-full h-full"
          onError={() => setError(true)}
          width={width}
          height={height}
          {...props}
        />
      ) : (
        <Image
          src={finalSrc}
          alt={alt}
          width={width}
          height={height}
          className="object-cover"
          onError={() => setError(true)}
          {...props}
        />
      )}
    </div>
  );
}

interface OptimizedBackgroundImageProps extends Omit<ImageProps, 'onLoadingComplete'> {
  fallbackSrc?: string;
  overlayColor?: string;
  children?: React.ReactNode;
}

export function OptimizedBackgroundImage({
  src,
  alt,
  className,
  fallbackSrc = '/images/placeholder.svg',
  overlayColor = 'rgba(0, 0, 0, 0.4)',
  children,
  ...props
}: OptimizedBackgroundImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Image
        src={error ? fallbackSrc : src}
        alt={alt}
        className={cn(
          'object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        fill
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
        {...props}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundColor: overlayColor }}
      />
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
} 