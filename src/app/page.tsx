'use client';

import { useState, useRef, useCallback } from 'react';

// YouTube URL Patterns
const youtubePatterns = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
];

// Thumbnail qualities
const thumbnailQualities = {
  maxres: { name: 'maxresdefault', label: '최고 화질', resolution: '1280 x 720', badgeClass: 'badge-maxres' },
  sd: { name: 'sddefault', label: '표준 화질', resolution: '640 x 480', badgeClass: 'badge-sd' },
  hq: { name: 'hqdefault', label: '고화질', resolution: '480 x 360', badgeClass: 'badge-hq' },
  mq: { name: 'mqdefault', label: '중간 화질', resolution: '320 x 180', badgeClass: 'badge-mq' }
};

type QualityKey = keyof typeof thumbnailQualities;

function extractVideoId(url: string): string | null {
  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

function getThumbnailUrl(videoId: string, quality: QualityKey): string {
  return `https://img.youtube.com/vi/${videoId}/${thumbnailQualities[quality].name}.jpg`;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingQuality, setDownloadingQuality] = useState<QualityKey | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const extractThumbnails = useCallback(() => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError('유튜브 영상 URL을 입력해주세요.');
      setVideoId(null);
      return;
    }

    const extractedId = extractVideoId(trimmedUrl);

    if (!extractedId) {
      setError('올바른 유튜브 URL 형식이 아닙니다. 다시 확인해주세요.');
      setVideoId(null);
      return;
    }

    setError('');
    setIsLoading(true);

    setTimeout(() => {
      setVideoId(extractedId);
      setIsLoading(false);
    }, 500);
  }, [url]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      extractThumbnails();
    }
  };

  const handlePaste = () => {
    setTimeout(() => {
      if (inputRef.current) {
        const pastedUrl = inputRef.current.value.trim();
        if (extractVideoId(pastedUrl)) {
          setUrl(pastedUrl);
          extractThumbnails();
        }
      }
    }, 100);
  };

  const downloadThumbnail = async (quality: QualityKey) => {
    if (!videoId) return;

    setDownloadingQuality(quality);

    try {
      const imageUrl = getThumbnailUrl(videoId, quality);
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `youtube_thumbnail_${videoId}_${quality}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch {
      window.open(getThumbnailUrl(videoId, quality), '_blank');
    }

    setTimeout(() => {
      setDownloadingQuality(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-[#0f0f23] to-black flex flex-col items-center pt-24 pb-12 relative">
      {/* Background Animation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Main Container - Wide Layout */}
      <div className="w-full max-w-[1600px] px-8 relative z-10">
        {/* Header */}
        <header className="text-center mb-16 animate-fadeInDown w-full">
          <div className="flex items-center justify-center gap-4 mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="24" rx="6" fill="url(#gradient)" />
              <path d="M9.5 8.5L16 12L9.5 15.5V8.5Z" fill="white" />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="24" y2="24">
                  <stop stopColor="#FF0000" />
                  <stop offset="1" stopColor="#FF6B6B" />
                </linearGradient>
              </defs>
            </svg>
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">유튜브 썸네일 추출기</h1>
          </div>
          <p className="text-lg text-white/70 font-light">유튜브 영상의 고화질 썸네일을 무료로 다운로드하세요</p>
        </header>

        {/* Input Section */}
        <main className="w-full">
          <div className="glass-card p-8 md:p-10 mb-10 animate-fadeInUp w-full">
            <div className="input-wrapper flex flex-col md:flex-row items-center gap-4 bg-black/30 rounded-3xl p-3 md:p-3 md:pl-6 border border-white/10 transition-all">
              <svg className="hidden md:block text-white/50 flex-shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 10-5.656-5.656l-1.1 1.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyPress}
                onPaste={handlePaste}
                placeholder="유튜브 영상 URL을 붙여넣으세요..."
                className="flex-1 w-full bg-transparent border-none outline-none text-white text-center md:text-left placeholder:text-white/50 py-3 md:py-0"
              />
              <button
                onClick={extractThumbnails}
                disabled={isLoading}
                className="btn-primary flex items-center gap-2 px-6 py-3.5 rounded-3xl text-white font-semibold whitespace-nowrap w-full md:w-auto justify-center"
              >
                {isLoading ? (
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    <span>추출</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </div>
            <p className="mt-4 text-sm text-white/50 text-center">
              예: https://www.youtube.com/watch?v=xxxxx 또는 https://youtu.be/xxxxx
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 md:p-5 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 mb-8 animate-shake w-full">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Result Section */}
          {videoId && (
            <div className="animate-fadeInUp w-full">
              <h2 className="flex items-center gap-3 text-2xl font-semibold mb-6 text-white">
                <svg className="text-red-500" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                  <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                추출된 썸네일
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                {(Object.keys(thumbnailQualities) as QualityKey[]).map((quality) => (
                  <div key={quality} className="thumbnail-card glass-card p-5 relative overflow-hidden flex flex-col">
                    <div className={`absolute top-7 right-7 px-3 py-1.5 rounded-full text-xs font-semibold text-white z-10 ${thumbnailQualities[quality].badgeClass}`}>
                      {thumbnailQualities[quality].label}
                    </div>
                    <div className="relative rounded-xl overflow-hidden mb-4 flex-shrink-0 aspect-video bg-black/20">
                      <img
                        src={getThumbnailUrl(videoId, quality)}
                        alt={`${thumbnailQualities[quality].label} 썸네일`}
                        className="w-full h-full object-cover block transition-transform duration-300"
                        onError={(e) => {
                          if (quality === 'maxres') {
                            (e.target as HTMLImageElement).src = getThumbnailUrl(videoId, 'hq');
                          }
                        }}
                      />
                      <div className="thumbnail-overlay absolute bottom-0 left-0 right-0 p-4 pt-8 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-300">
                        <span className="text-sm text-white font-medium">{thumbnailQualities[quality].resolution}</span>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <button
                        onClick={() => downloadThumbnail(quality)}
                        disabled={downloadingQuality === quality}
                        className="btn-download flex items-center justify-center gap-2 w-full py-3 px-6 bg-white/10 border border-white/20 rounded-xl text-white font-medium"
                      >
                        {downloadingQuality === quality ? (
                          <>
                            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            다운로드 중...
                          </>
                        ) : (
                          <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15M7 10L12 15M12 15L17 10M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            다운로드
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="text-center mt-16 pt-8 border-t border-white/10 text-white/50 text-sm w-full">
          <p>© {new Date().getFullYear()} 유튜브 썸네일 추출기 | 간편하고 빠른 썸네일 다운로드</p>
        </footer>
      </div>
    </div>
  );
}
