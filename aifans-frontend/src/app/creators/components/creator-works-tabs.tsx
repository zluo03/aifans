import React, { useState } from 'react';
import { parseCreatorData } from '@/lib/utils/json-parser';
import { MediaPreviewModal } from './media-preview-modal';

interface CreatorWorksTabsProps {
  creator: {
    images?: any[];
    videos?: any[];
    audios?: any[];
  };
}

export function CreatorWorksTabs({ creator }: CreatorWorksTabsProps) {
  const [tab, setTab] = useState<'image' | 'video' | 'audio'>('image');
  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    type: 'image' | 'video';
    title?: string;
  } | null>(null);
  
  // 解析创作者数据
  const parsedCreator = parseCreatorData(creator);
  const images = parsedCreator?.images || [];
  const videos = parsedCreator?.videos || [];
  const audios = parsedCreator?.audios || [];
  
  // 关键调试信息
  console.log('🖼️ 图片数据:', images.length > 0 ? `${images.length}张图片` : '无图片');
  if (images.length > 0) {

  }
  
  const hasImages = images && images.length > 0;
  const hasVideos = videos && videos.length > 0;
  const hasAudios = audios && audios.length > 0;
  
  // 如果没有图片但有其他内容，默认显示有内容的标签
  React.useEffect(() => {
    if (!hasImages && hasVideos) setTab('video');
    else if (!hasImages && !hasVideos && hasAudios) setTab('audio');
  }, [hasImages, hasVideos, hasAudios]);

  return (
    <div className="w-full max-w-6xl mx-auto px-6 pb-8">
      {/* 标签切换 */}
      <div className="flex gap-2 mb-8 justify-center">
        {hasImages && (
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              tab === 'image' 
                ? 'bg-primary-gradient text-white shadow-lg' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
            }`}
            onClick={() => setTab('image')}
          >
            图片作品 ({images?.length || 0})
          </button>
        )}
        
        {hasVideos && (
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              tab === 'video' 
                ? 'bg-secondary-gradient text-white shadow-lg' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
            }`}
            onClick={() => setTab('video')}
          >
            视频作品 ({videos?.length || 0})
          </button>
        )}
        
        {hasAudios && (
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              tab === 'audio' 
                ? 'bg-rainbow-gradient text-white shadow-lg' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
            }`}
            onClick={() => setTab('audio')}
          >
            音频作品 ({audios?.length || 0})
          </button>
        )}
      </div>

      {/* 内容展示 */}
      <div className="min-h-[400px]">
        {/* 图片作品 */}
        {tab === 'image' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {images?.map((img: any, idx: number) => (
              <div 
                key={idx} 
                className="group relative overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                onClick={() => {
                  if (img.url && img.url.trim() !== '') {
                    setPreviewMedia({ url: img.url, type: 'image', title: img.title });
                  }
                }}
              >
                <div className="aspect-square">
                  <img 
                    src={img.url} 
                    alt={img.title || `作品 ${idx + 1}`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    style={{
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    } as React.CSSProperties}
                    onError={(e) => console.error(`❌ 图片加载失败:`, img.url)}
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                  />
                </div>
                {img.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-sm font-medium truncate">{img.title}</p>
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
        {tab === 'video' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos?.map((video: any, idx: number) => (
              <div 
                key={idx} 
                className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                onClick={() => {
                  if (video.url && video.url.trim() !== '') {
                    setPreviewMedia({ url: video.url, type: 'video', title: video.title });
                  }
                }}
              >
                <div className="aspect-video relative">
                  <video 
                    src={video.url} 
                    className="w-full h-full object-cover"
                    poster={video.thumbnailUrl}
                    style={{
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    } as React.CSSProperties}
                    onContextMenu={(e) => e.preventDefault()}
                    controlsList="nodownload nofullscreen noremoteplayback"
                    disablePictureInPicture
                    muted
                    preload="metadata"
                  />
                  <div className="absolute top-3 left-3">
                    <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                      视频
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
                    <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  {video.title && (
                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">{video.title}</h4>
                  )}
                  {video.desc && (
                    <p className="text-sm text-gray-600 line-clamp-2">{video.desc}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 音频作品 */}
        {tab === 'audio' && hasAudios && (
          <div className="space-y-6 max-w-3xl mx-auto">
            {audios?.map((audio: any, idx: number) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-secondary-gradient rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    {audio.title && (
                      <h4 className="font-semibold text-gray-900 mb-2 truncate">{audio.title}</h4>
                    )}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <audio 
                        src={audio.url} 
                        controls 
                        className="w-full"
                        style={{
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          MozUserSelect: 'none',
                          msUserSelect: 'none'
                        } as React.CSSProperties}
                        onContextMenu={(e) => e.preventDefault()}
                        controlsList="nodownload noremoteplayback"
                      />
                    </div>
                  </div>
                </div>
                {audio.desc && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 leading-relaxed">{audio.desc}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 空状态 */}
        {((tab === 'image' && !hasImages) || 
          (tab === 'video' && !hasVideos) || 
          (tab === 'audio' && !hasAudios)) && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
              {tab === 'image' && (
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              {tab === 'video' && (
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              {tab === 'audio' && (
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              )}
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

      {/* 媒体预览模态框 */}
      <MediaPreviewModal
        open={!!previewMedia && !!previewMedia.url}
        onOpenChange={() => setPreviewMedia(null)}
        mediaUrl={previewMedia?.url || ''}
        mediaType={previewMedia?.type || 'image'}
        title={previewMedia?.title}
      />
    </div>
  );
} 