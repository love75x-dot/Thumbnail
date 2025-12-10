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
    <div className="relative min-h-screen bg-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-white">
      </div>

      <div className="max-w-6xl mx-auto px-5 py-10 relative z-10">
        {/* Header */}
        <header className="text-center mb-12 animate-fadeInDown">
          <div className="flex items-center justify-center gap-4 mb-4">
            <svg width="48" height="48" viewBox="0 0 159 110" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M154 17.5C154 17.5 152.5 7.75 148.5 3.75C143.5 -1.25 137.5 -1.25 134.5 -1.25C112.5 -2.75 79.5 -2.75 79.5 -2.75C79.5 -2.75 46.5 -2.75 24.5 -1.25C21.5 -1.25 15.5 -1.25 10.5 3.75C6.5 7.75 5 17.5 5 17.5C5 17.5 3.5 29.25 3.5 41V52.5C3.5 64.25 5 76 5 76C5 76 6.5 85.75 10.5 89.75C15.5 94.75 22.5 94.5 25.5 95.25C37.5 96.5 79.5 97 79.5 97C79.5 97 112.5 96.75 134.5 95.25C137.5 95 143.5 94.75 148.5 89.75C152.5 85.75 154 76 154 76C154 76 155.5 64.25 155.5 52.5V41C155.5 29.25 154 17.5 154 17.5Z" fill="#FF0000" />
              <path d="M63.5 69.5L103.5 46.5L63.5 23.5V69.5Z" fill="white" />
            </svg>
            <h1 className="text-3xl md:text-4xl font-bold text-black">유튜브 썸네일 추출기</h1>
          </div>
          <p className="text-lg text-gray-600 font-light">유튜브 영상의 고화질 썸네일을 무료로 다운로드하세요</p>
        </header>

        {/* Input Section */}
        <main>
          <div className="glass-card p-6 md:p-8 mb-8 animate-fadeInUp bg-gray-50 border border-gray-200">
            <div className="input-wrapper flex flex-col md:flex-row items-center gap-4 bg-gray-100 rounded-3xl p-2 md:p-2 md:pl-5 border-2 border-gray-300 transition-all">
              <svg className="hidden md:block text-gray-600 flex-shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                className="flex-1 w-full bg-transparent border-none outline-none text-black text-center md:text-left placeholder:text-gray-500 py-3 md:py-0"
              />
              <button
                onClick={extractThumbnails}
                disabled={isLoading}
                className="btn-primary flex items-center gap-2 px-7 py-3.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold whitespace-nowrap w-full md:w-auto justify-center shadow-md"
              >
                {isLoading ? (
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    <span>썸네일 추출</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500 text-center">
              예: https://www.youtube.com/watch?v=xxxxx 또는 https://youtu.be/xxxxx
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 md:p-5 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 mb-8 animate-shake">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Result Section */}
          {videoId && (
            <div className="animate-fadeInUp">
              <h2 className="flex items-center gap-3 text-2xl font-semibold mb-6 text-black">
                <svg className="text-black" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                  <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                추출된 썸네일
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {(Object.keys(thumbnailQualities) as QualityKey[]).map((quality) => (
                  <div key={quality} className="thumbnail-card glass-card p-5 relative overflow-hidden bg-white border border-gray-200 shadow-md rounded-lg">
                    <div className={`absolute top-3 right-3 px-4 py-2 rounded text-xs font-bold text-white z-10 shadow-lg ${thumbnailQualities[quality].badgeClass}`}>
                      {thumbnailQualities[quality].label}
                    </div>
                    <div className="relative rounded-xl overflow-hidden mb-4">
                      <img
                        src={getThumbnailUrl(videoId, quality)}
                        alt={`${thumbnailQualities[quality].label} 썸네일`}
                        className="w-full h-auto block transition-transform duration-300"
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
                    <button
                      onClick={() => downloadThumbnail(quality)}
                      disabled={downloadingQuality === quality}
                      className="btn-download flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 border-none rounded-lg text-white font-semibold shadow-md transition-all"
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
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="text-center mt-16 pt-8 border-t border-gray-200 text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} 유튜브 썸네일 추출기 | 간편하고 빠른 썸네일 다운로드</p>
        </footer>
      </div>
    </div>
  );
}
