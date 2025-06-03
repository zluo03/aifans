import React, { useState } from 'react';
import { MediaPreviewModal } from './media-preview-modal';

interface CreatorWorksTabsProps {
  creator: any;
}

// 预览媒体类型
interface PreviewMedia {
  url: string;
  type: 'image' | 'video' | 'audio';
  title?: string;
}

export function CreatorWorksTabs({ creator }: CreatorWorksTabsProps) {
  const [tab, setTab] = useState<'image' | 'video' | 'audio'>('image');
  // 预览媒体状态
  const [previewMedia, setPreviewMedia] = useState<PreviewMedia | null>(null);

  // 处理图片点击预览
  const handleImagePreview = (image: any) => {
    if (image.url && image.url.trim() !== '') {
      setPreviewMedia({ 
        url: image.url, 
        type: 'image', 
        title: image.title || image.desc 
      });
    }
  };

  // 处理视频点击预览
  const handleVideoPreview = (video: any) => {
    if (video.url && video.url.trim() !== '') {
      setPreviewMedia({ 
        url: video.url, 
        type: 'video', 
        title: video.title || video.desc 
      });
    }
  };

  // 处理音频点击预览 - 不再需要
  const handleAudioPreview = (audio: any) => {
    // 音频直接在卡片内播放，不需要弹窗预览
  };

  // 获取当前选项卡的作品数量
  const getWorkCount = () => {
    if (tab === 'image') return creator.images?.length || 0;
    if (tab === 'video') return creator.videos?.length || 0;
    if (tab === 'audio') return creator.audios?.length || 0;
    return 0;
  };

  const images = creator.images || [];
  const videos = creator.videos || [];
  const audios = creator.audios || [];

  return (
    <div className="mt-12 max-w-5xl mx-auto px-4">
      <div className="flex border-b border-gray-200">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            tab === 'image'
              ? 'text-primary-gradient border-b-2 border-[var(--custom-primary)]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setTab('image')}
        >
          图片作品 ({images.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            tab === 'video'
              ? 'text-primary-gradient border-b-2 border-[var(--custom-primary)]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setTab('video')}
        >
          视频作品 ({videos.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            tab === 'audio'
              ? 'text-primary-gradient border-b-2 border-[var(--custom-primary)]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setTab('audio')}
        >
          音频作品 ({audios.length})
        </button>
      </div>

      <div className="mt-6">
        {/* 图片作品 */}
        {tab === 'image' && images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img: any, idx: number) => (
              <div 
                key={idx} 
                className="group relative aspect-square rounded-lg overflow-hidden shadow-sm border border-gray-100 cursor-pointer"
                onClick={() => handleImagePreview(img)}
              >
                <img 
                  src={img.url} 
                  alt={img.title || `图片作品 ${idx+1}`} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {img.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-white text-sm font-medium truncate">{img.title}</h3>
                    {img.desc && (
                      <p className="text-white/80 text-xs mt-1 line-clamp-2">{img.desc}</p>
                    )}
                  </div>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 视频作品 */}
        {tab === 'video' && videos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video: any, idx: number) => (
              <div 
                key={idx} 
                className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                onClick={() => handleVideoPreview(video)}
              >
                <div className="aspect-video relative">
                  <video
                    src={video.url}
                    className="w-full h-full object-cover"
                    muted
                    onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                    onMouseOut={(e) => {
                      const videoEl = e.target as HTMLVideoElement;
                      videoEl.pause();
                      videoEl.currentTime = 0;
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 音频作品 */}
        {tab === 'audio' && audios.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {audios.map((audio: any, idx: number) => (
              <div 
                key={idx} 
                className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              >
                <div className="relative flex flex-col items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50 p-4" style={{aspectRatio: '2/1'}}>
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--custom-primary)] to-[var(--custom-secondary)] flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                  </div>
                  <audio 
                    src={audio.url} 
                    controls 
                    className="w-full" 
                    controlsList="nodownload"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 无作品显示 */}
        {getWorkCount() === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {tab === 'image' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                {tab === 'video' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />}
                {tab === 'audio' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />}
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              暂无{tab === 'image' ? '图片' : tab === 'video' ? '视频' : '音频'}作品
            </h3>
            <p className="text-gray-500 text-center">
              创作者还没有上传{tab === 'image' ? '图片' : tab === 'video' ? '视频' : '音频'}作品
            </p>
          </div>
        )}
      </div>

      {/* 媒体预览模态框 - 只用于图片和视频 */}
      <MediaPreviewModal
        open={!!previewMedia && !!previewMedia.url && previewMedia.type !== 'audio'}
        onOpenChange={() => setPreviewMedia(null)}
        mediaUrl={previewMedia?.url || ''}
        mediaType={previewMedia?.type || 'image'}
        title={previewMedia?.title}
      />
    </div>
  );
} 