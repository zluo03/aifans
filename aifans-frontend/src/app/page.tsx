'use client';

import Image from "next/image";
import { useState, useEffect } from 'react';
import AnnouncementModal from '@/components/announcements/announcement-modal';
import InspirationPhotoWall from "@/components/InspirationPhotoWall";

export default function Home() {
  const [showAnnouncements, setShowAnnouncements] = useState(false);

  // 页面加载后显示公告
  useEffect(() => {
    setShowAnnouncements(true);
  }, []);

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
        <InspirationPhotoWall />
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
      {/* 公告弹框 */}
      {showAnnouncements && (
        <AnnouncementModal onClose={() => setShowAnnouncements(false)} />
      )}
    </div>
  );
}
