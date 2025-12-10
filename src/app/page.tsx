'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';

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
      setError('유튜브 링크를 입력해 주세요 😊');
      setVideoId(null);
      return;
    }

    const extractedId = extractVideoId(trimmedUrl);

    if (!extractedId) {
      setError('링크가 잘못되었어요. 다시 확인해 주세요 🔍');
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
      {/* Hero Section - Centered */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-4xl mb-16 text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-red-100 to-white bg-clip-text text-transparent">
            유튜브 썸네일 저장
          </h1>
          <p className="text-lg md:text-xl text-zinc-400">
            유튜브 영상 썸네일을 <span className="text-red-500 font-semibold">한 번에 빠르게</span> 저장하세요
          </p>
        </motion.div>

        {/* Animated Search Bar with Pulsing Glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="pulse-glow"
        >
          <div className="input-wrapper flex items-center gap-3 bg-zinc-900/50 backdrop-blur-sm border-2 border-zinc-800 rounded-full p-2 pl-6">
            <Search className="text-zinc-500 flex-shrink-0" size={24} />
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyPress}
              onPaste={handlePaste}
              placeholder="유튜브 링크를 붙여넣으세요"
              className="flex-1 w-full bg-transparent border-none outline-none text-white placeholder:text-zinc-600 py-4"
            />
            <button
              onClick={extractThumbnails}
              disabled={isLoading}
              className="btn-primary flex items-center gap-2 px-8 py-4 rounded-full font-semibold whitespace-nowrap"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>가져오기</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.div>
                </>
              )}
            </button>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 text-sm text-zinc-600"
        >
          예시) https://youtu.be/xxxxx
        </motion.p>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex items-center gap-3 px-6 py-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 mb-8 max-w-2xl"
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Result Section - Grid Cards */}
      {videoId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-7xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-8 justify-center"
          >
            <ImageIcon className="text-red-500" size={28} />
            <h2 className="text-3xl font-bold text-white">썸네일 목록</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(Object.keys(thumbnailQualities) as QualityKey[]).map((quality, index) => (
              <motion.div
                key={quality}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="thumbnail-card glass-card p-6 relative overflow-hidden flex flex-col"
              >
                <div className={`absolute top-4 right-4 px-4 py-2 rounded-lg text-xs font-bold text-white z-10 ${thumbnailQualities[quality].badgeClass}`}>
                  {thumbnailQualities[quality].label}
                </div>
                <div className="relative rounded-xl overflow-hidden mb-4 flex-shrink-0 aspect-video bg-zinc-900/50">
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
                  <div className="thumbnail-overlay absolute bottom-0 left-0 right-0 p-4 pt-8 bg-gradient-to-t from-black/90 to-transparent opacity-0 transition-opacity duration-300">
                    <span className="text-sm text-white font-medium">{thumbnailQualities[quality].resolution}</span>
                  </div>
                </div>
                <div className="mt-auto">
                  <button
                    onClick={() => downloadThumbnail(quality)}
                    disabled={downloadingQuality === quality}
                    className="btn-download flex items-center justify-center gap-2 w-full py-4 px-6 rounded-xl text-white font-semibold"
                  >
                    {downloadingQuality === quality ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Download size={18} />
                        저장하기
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center mt-20 pt-8 border-t border-zinc-800 text-zinc-600 text-sm max-w-4xl"
      >
        <p>© {new Date().getFullYear()} 유튜브 썸네일 저장 | 무료 고화질 다운로드</p>
      </motion.footer>
    </div>
  );
}
