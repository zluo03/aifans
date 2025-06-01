'use client';

import { useState, useEffect } from 'react';

// 简化版本，不使用AnnouncementModal和InspirationPhotoWall组件
export default function HomeContent() {
  // header高度112px，footer高度56px
  const HEADER_HEIGHT = 112;
  const FOOTER_HEIGHT = 56;
  const contentHeight = `calc(100vh - ${HEADER_HEIGHT + FOOTER_HEIGHT}px)`;

  return (
    <div
      className="flex flex-col w-full overflow-hidden"
      style={{ height: contentHeight }}
    >
      <div style={{ flex: 7, minHeight: 0, display: 'flex', zIndex: 10, position: 'relative' }}>
        {/* 照片墙替代内容 */}
        <div className="w-full flex justify-center items-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 max-w-6xl">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`bg-gray-200 rounded-md overflow-hidden shadow-md`} 
                   style={{ height: `${Math.floor(Math.random() * 100) + 150}px` }}>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ flex: 3, minHeight: 0, display: 'flex', alignItems: 'center', marginTop: 20, zIndex: 20, position: 'relative' }}>
        <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-4 justify-center items-stretch">
          <div className="flex-1 bg-white/80 backdrop-blur-md rounded-xl shadow-xl flex flex-col justify-center items-center p-8 min-h-[120px]">
            <h3 className="text-2xl font-semibold text-black mb-2">灵感无限</h3>
            <p className="text-base text-black/70">优质作品，激发无限灵感</p>
          </div>
          <div className="flex-1 bg-white/80 backdrop-blur-md rounded-xl shadow-xl flex flex-col justify-center items-center p-8 min-h-[120px]">
            <h3 className="text-2xl font-semibold text-black mb-2">成长无限</h3>
            <p className="text-base text-black/70">丰富资源，助力成长进阶</p>
          </div>
          <div className="flex-1 bg-white/80 backdrop-blur-md rounded-xl shadow-xl flex flex-col justify-center items-center p-8 min-h-[120px]">
            <h3 className="text-2xl font-semibold text-black mb-2">合作无限</h3>
            <p className="text-base text-black/70">结识同好，交流合作成长</p>
          </div>
        </div>
      </div>
    </div>
  );
} 