'use client';

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api/api";
import { processImageUrl } from "@/lib/utils/image-url";
import { useAuthStore } from "@/lib/store/auth-store";

// 定义简化版的 Post 类型，只包含首页需要的字段
interface SimplePost {
  id: number;
  fileUrl: string;
  title?: string;
  likesCount?: number;
}

// 将常量移到组件外部
const FRAME_STYLES = [
  "frame-black",
  "frame-white",
];

// 将纯函数移到组件外部
function getRandomFrame() {
  return FRAME_STYLES[Math.floor(Math.random() * FRAME_STYLES.length)];
}

// 生成不重叠的随机布局（简化版，瀑布流+间隔）
function generateLayout(count: number, containerW: number, containerH: number, ratios: number[]) {
  // 两行错落排列
  const rows = 2;
  const gap = 16; // 间距缩小
  const usableH = containerH - gap;
  const rowH = ((usableH - gap) / rows) * 0.85; // 高度缩小
  const perRow = Math.ceil(count / rows);
  let positions: any[] = [];
  let idx = 0;
  for (let row = 0; row < rows; row++) {
    const n = row === 0 ? perRow : count - perRow;
    let totalRatio = 0;
    for (let i = 0; i < n; i++) totalRatio += ratios[idx + i] || 1;
    let x = gap;
    let widths: number[] = [];
    // 先计算前n-1张图片宽度
    for (let i = 0; i < n - 1; i++) {
      const ratio = ratios[idx + i] || 1;
      const w = ((containerW - gap * (n + 1)) * ratio) / totalRatio;
      widths.push(w);
    }
    // 最后一张图片宽度为剩余空间
    let usedW = widths.reduce((a, b) => a + b, 0);
    let lastW = containerW - gap * (n + 1) - usedW;
    widths.push(lastW > 0 ? lastW : 0);
    // 生成每张图片的位置
    for (let i = 0; i < n; i++) {
      const w = widths[i];
      const h = rowH;
      const y = row * (rowH + gap) + gap;
      positions.push({ w, h, x, y });
      x += w + gap;
      idx++;
    }
  }
  return positions;
}

// 统一的加载状态UI
const LoadingUI = () => (
  <div className="flex justify-center items-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
  </div>
);

// 空状态UI
const EmptyUI = () => (
  <div className="flex justify-center items-center min-h-[200px]">
    <div className="text-center text-gray-500">
      <div className="text-lg">暂无灵感照片</div>
    </div>
  </div>
);

export default function InspirationPhotoWall() {
  const [photos, setPhotos] = useState<SimplePost[]>([]);
  const [ratios, setRatios] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<any[]>([]);
  const [containerH, setContainerH] = useState(400);
  const [containerW, setContainerW] = useState(1200);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuthStore();

  // 组件挂载标记
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // 初始化容器宽度
  useEffect(() => {
    if (!mounted) return;
    const updateWidth = () => setContainerW(window.innerWidth);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    async function fetchPhotos() {
      try {
        setIsLoading(true);
        const response = await api.get('/api/posts', { params: { type: "IMAGE", limit: 24 } });
        if (response.data && response.data.data && response.data.data.length > 0) {
          const sorted = [...response.data.data].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
          const count = 10 + Math.floor(Math.random() * 7);
          const topN = sorted.slice(0, count);
          const allZero = topN.every(item => !item.likesCount);
          setPhotos(allZero ? response.data.data.slice(0, count) : topN);
        } else {
          setPhotos([]);
        }
      } catch (error) {
        setPhotos([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPhotos();
  }, [mounted]);

  // 获取图片比例
  useEffect(() => {
    if (!mounted || photos.length === 0) return;
    Promise.all(
      photos.map(photo =>
        new Promise<number>(resolve => {
          const img = new window.Image();
          img.onload = () => resolve(img.naturalWidth / img.naturalHeight);
          img.onerror = () => resolve(1);
          img.src = processImageUrl(photo.fileUrl);
        })
      )
    ).then(setRatios);
  }, [photos, mounted]);

  // 生成布局
  useEffect(() => {
    if (!mounted || ratios.length === 0) return;
    setLayout(generateLayout(ratios.length, containerW, containerH, ratios));
  }, [ratios, containerW, containerH, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const calcH = () => Math.max(Math.round(window.innerHeight * 0.7) - 120, 200);
    setContainerH(calcH());
    const onResize = () => setContainerH(calcH());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [mounted]);

  if (!mounted || isLoading) {
    return <LoadingUI />;
  }

  if (!photos.length) {
    return <EmptyUI />;
  }

  return (
    <div className="w-full flex justify-center items-start select-none" style={{ minHeight: '0', marginTop: 0 }}>
      <div
        ref={containerRef}
        className="relative"
        style={{ width: '100vw', height: containerH, borderRadius: 0, overflow: "hidden", zIndex: 10, position: 'relative' }}
      >
        {layout.map((frame, idx) => (
          <div
            key={photos[idx]?.id || idx}
            className={`absolute flex items-center justify-center ${getRandomFrame()}`}
            style={{
              left: frame.x,
              top: frame.y,
              width: frame.w,
              height: frame.h,
              margin: 0,
              zIndex: 1,
              boxSizing: 'border-box',
              transition: 'all 0.5s cubic-bezier(.23,1,.32,1)',
            }}
          >
            <img
              src={processImageUrl(photos[idx]?.fileUrl)}
              alt={photos[idx]?.title || "灵感照片"}
              className="object-contain w-full h-full rounded-none"
              draggable={false}
              style={{ userSelect: "none" }}
            />
          </div>
        ))}
        <style jsx>{`
          .frame-black {
            border: 10px solid #222;
            background: #181818;
            border-radius: 0;
            box-shadow:
              0 4px 16px 0 rgba(0,0,0,0.28),
              0 2.5px 0 #222 inset,
              0 1px 0 #fff4 inset;
          }
          .frame-white {
            border: 10px solid #fff;
            background: #f8f8f8;
            border-radius: 0;
            box-shadow:
              0 6px 18px 0 rgba(0,0,0,0.20),
              0 2.5px 0 #ccc inset,
              0 1px 0 #fff inset;
          }
        `}</style>
      </div>
    </div>
  );
} 