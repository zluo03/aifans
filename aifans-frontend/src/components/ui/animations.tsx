'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ReactNode } from 'react';

// 淡入淡出动画
export const FadeIn = ({ 
  children, 
  delay = 0,
  duration = 0.5,
  className = '',
}: { 
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

// 从下滑入动画
export const SlideUp = ({ 
  children, 
  delay = 0,
  duration = 0.5,
  distance = 20,
  className = '',
}: { 
  children: ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: distance }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: distance }}
    transition={{ duration, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

// 卡片悬停动画
export const AnimatedCard = ({ 
  children, 
  className = '',
}: { 
  children: ReactNode;
  className?: string;
}) => (
  <motion.div
    whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)' }}
    transition={{ type: 'spring', stiffness: 300 }}
    className={className}
  >
    {children}
  </motion.div>
);

// 弹出动画（用于对话框）
export const PopIn = ({ 
  children, 
  isOpen, 
  className = '',
}: { 
  children: ReactNode;
  isOpen: boolean;
  className?: string;
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className={className}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

// 文本打字机效果
export const TypingText = ({ 
  text, 
  speed = 0.05,
  className = '',
}: { 
  text: string;
  speed?: number;
  className?: string;
}) => {
  const textVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: speed,
      },
    },
  };

  const letterVariants: Variants = {
    hidden: { opacity: 0, y: 5 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <motion.span
      variants={textVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {Array.from(text).map((char, i) => (
        <motion.span
          key={i}
          variants={letterVariants}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  );
};

// 页面过渡动画
export const PageTransition = ({ 
  children 
}: { 
  children: ReactNode 
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className="w-full"
  >
    {children}
  </motion.div>
);

// 列表渐入动画
export const AnimatedList = ({ 
  children, 
  delay = 0.1,
  staggerDelay = 0.1,
  className = '',
}: { 
  children: ReactNode[];
  delay?: number;
  staggerDelay?: number;
  className?: string;
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      visible: {
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: delay,
        },
      },
    }}
    className={className}
  >
    {children.map((child, index) => (
      <motion.div
        key={index}
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.3 }}
      >
        {child}
      </motion.div>
    ))}
  </motion.div>
);

// 3D卡片翻转效果（像书籍翻页）
export const FlipCard = ({
  front,
  back,
  isFlipped,
  className = '',
}: {
  front: ReactNode;
  back: ReactNode;
  isFlipped: boolean;
  className?: string;
}) => {
  return (
    <div className={`relative ${className}`} style={{ perspective: '1000px' }}>
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="w-full h-full"
      >
        <div
          className={`absolute w-full h-full backface-hidden ${
            isFlipped ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ backfaceVisibility: 'hidden', transition: 'opacity 0.6s' }}
        >
          {front}
        </div>
        <div
          className={`absolute w-full h-full backface-hidden ${
            isFlipped ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            transition: 'opacity 0.6s',
          }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
};

// 骨架屏加载动画
export const SkeletonPulse = ({ className = '' }: { className?: string }) => (
  <motion.div
    animate={{ opacity: [0.5, 0.8, 0.5] }}
    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
    className={`bg-muted ${className}`}
    style={{ borderRadius: 'inherit' }}
  />
);

// 带加载状态的按钮动画
export const LoadingButton = ({
  children,
  isLoading,
  className = '',
}: {
  children: ReactNode;
  isLoading: boolean;
  className?: string;
}) => (
  <div className={`relative ${className}`}>
    <motion.div
      animate={{ opacity: isLoading ? 0 : 1 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
    {isLoading && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </motion.div>
    )}
  </div>
); 