'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface ThumbnailRemakeProps {
    videoId: string;
    thumbnailUrl: string;
}

interface StyleAnalysis {
    textColor: string;
    strokeColor: string | null;
    fontSizeRatio: number;
    fontWeight: string;
    verticalPosition: string;
    horizontalAlign: string;
}

const defaultStyle: StyleAnalysis = {
    textColor: '#FFFFFF',
    strokeColor: '#000000',
    fontSizeRatio: 0.12,
    fontWeight: 'bold',
    verticalPosition: 'bottom',
    horizontalAlign: 'center',
};

export default function ThumbnailRemake({ videoId, thumbnailUrl }: ThumbnailRemakeProps) {
    const [userImage, setUserImage] = useState<string | null>(null);
    const [userText, setUserText] = useState('나만의 썸네일 제목');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [styleAnalysis, setStyleAnalysis] = useState<StyleAnalysis>(defaultStyle);
    const [isDragOver, setIsDragOver] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Analyze thumbnail style when component mounts or thumbnailUrl changes
    useEffect(() => {
        const analyzeStyle = async () => {
            setIsAnalyzing(true);
            try {
                const response = await fetch('/api/analyze-thumbnail', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ thumbnailUrl }),
                });
                const data = await response.json();
                if (data.success) {
                    setStyleAnalysis({
                        textColor: data.textColor || defaultStyle.textColor,
                        strokeColor: data.strokeColor,
                        fontSizeRatio: data.fontSizeRatio || defaultStyle.fontSizeRatio,
                        fontWeight: data.fontWeight || defaultStyle.fontWeight,
                        verticalPosition: data.verticalPosition || defaultStyle.verticalPosition,
                        horizontalAlign: data.horizontalAlign || defaultStyle.horizontalAlign,
                    });
                }
            } catch (error) {
                console.error('Style analysis failed:', error);
            }
            setIsAnalyzing(false);
        };

        analyzeStyle();
    }, [thumbnailUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setUserImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setUserImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    // Calculate text Y position based on verticalPosition
    const getTextYPosition = (position: string, canvasHeight: number, fontSize: number) => {
        const padding = 60;
        switch (position) {
            case 'top':
                return padding + fontSize / 2;
            case 'middle':
                return canvasHeight / 2;
            case 'bottom':
            default:
                return canvasHeight - padding - fontSize / 2;
        }
    };

    // Calculate text X position based on horizontalAlign
    const getTextXPosition = (align: string, canvasWidth: number, textWidth: number) => {
        const padding = 60;
        switch (align) {
            case 'left':
                return padding;
            case 'right':
                return canvasWidth - textWidth - padding;
            case 'center':
            default:
                return (canvasWidth - textWidth) / 2;
        }
    };

    const generateThumbnail = async () => {
        if (!canvasRef.current) return;

        setIsGenerating(true);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = 1280;
        const height = 720;
        canvas.width = width;
        canvas.height = height;

        try {
            // Step 1: Draw blurred background from original thumbnail
            const bgImage = new Image();
            bgImage.crossOrigin = 'anonymous';

            await new Promise<void>((resolve, reject) => {
                bgImage.onload = () => resolve();
                bgImage.onerror = reject;
                bgImage.src = thumbnailUrl;
            });

            // Draw background with blur effect
            ctx.filter = 'blur(25px) brightness(0.4) saturate(1.2)';
            ctx.drawImage(bgImage, -50, -50, width + 100, height + 100);
            ctx.filter = 'none';

            // Add gradient overlay for depth
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
            gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Step 2: Draw user image if provided
            if (userImage) {
                const userImg = new Image();
                await new Promise<void>((resolve, reject) => {
                    userImg.onload = () => resolve();
                    userImg.onerror = reject;
                    userImg.src = userImage;
                });

                // Calculate dimensions to fit user image
                const maxHeight = height * 0.9;
                const aspectRatio = userImg.width / userImg.height;
                let imgHeight = maxHeight;
                let imgWidth = imgHeight * aspectRatio;

                if (imgWidth > width * 0.7) {
                    imgWidth = width * 0.7;
                    imgHeight = imgWidth / aspectRatio;
                }

                const imgX = (width - imgWidth) / 2;
                const imgY = height - imgHeight;

                // Add shadow to user image
                ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
                ctx.shadowBlur = 40;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 15;

                ctx.drawImage(userImg, imgX, imgY, imgWidth, imgHeight);

                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            }

            // Step 3: Draw text with analyzed style
            // Calculate dynamic font size based on fontSizeRatio
            const fontSize = Math.round(height * styleAnalysis.fontSizeRatio);
            const fontWeight = styleAnalysis.fontWeight === 'bold' ? 'bold' :
                styleAnalysis.fontWeight === 'normal' ? 'normal' :
                    styleAnalysis.fontWeight; // Use the weight directly (e.g., '800')

            ctx.font = `${fontWeight} ${fontSize}px 'Noto Sans KR', sans-serif`;
            ctx.textBaseline = 'middle';

            const textMetrics = ctx.measureText(userText);
            const textWidth = textMetrics.width;

            // Calculate position based on analysis
            const textX = getTextXPosition(styleAnalysis.horizontalAlign, width, textWidth);
            const textY = getTextYPosition(styleAnalysis.verticalPosition, height, fontSize);

            // Draw stroke/outline if strokeColor exists
            if (styleAnalysis.strokeColor) {
                ctx.strokeStyle = styleAnalysis.strokeColor;
                ctx.lineWidth = Math.max(fontSize * 0.08, 4); // Dynamic stroke width
                ctx.lineJoin = 'round';
                ctx.miterLimit = 2;
                ctx.strokeText(userText, textX, textY);
            }

            // Draw outer glow for better visibility
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            // Main text fill
            ctx.fillStyle = styleAnalysis.textColor;
            ctx.fillText(userText, textX, textY);

            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            // Convert canvas to image
            const dataUrl = canvas.toDataURL('image/png');
            setGeneratedImage(dataUrl);

        } catch (error) {
            console.error('Thumbnail generation failed:', error);
        }

        setIsGenerating(false);
    };

    const downloadGeneratedImage = () => {
        if (!generatedImage) return;

        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `custom_thumbnail_${videoId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="mt-12 glass-card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-white">내 사진으로 리메이크하기</h3>
                    <span className="text-xs px-2 py-0.5 bg-purple-500/30 text-purple-300 rounded-full">Beta</span>
                </div>
            </div>

            <p className="text-white/60 mb-6">
                원본 썸네일의 스타일을 AI가 분석하여 나만의 썸네일을 만들어드립니다!
            </p>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Left: Input Section */}
                <div className="space-y-6">
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                            사진 업로드 (배경 제거된 인물 사진 권장)
                        </label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                ${isDragOver
                                    ? 'border-purple-500 bg-purple-500/10'
                                    : 'border-white/20 hover:border-white/40 bg-white/5'
                                }
              `}
                        >
                            {userImage ? (
                                <div className="relative">
                                    <img
                                        src={userImage}
                                        alt="업로드된 이미지"
                                        className="max-h-40 mx-auto rounded-lg"
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setUserImage(null);
                                        }}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                            <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="3" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <svg className="w-12 h-12 mx-auto mb-3 text-white/40" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <p className="text-white/60">클릭하거나 이미지를 드래그하세요</p>
                                    <p className="text-white/40 text-sm mt-1">PNG, JPG 지원</p>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    {/* Text Input */}
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                            썸네일 문구
                        </label>
                        <input
                            type="text"
                            value={userText}
                            onChange={(e) => setUserText(e.target.value)}
                            placeholder="썸네일에 넣을 텍스트를 입력하세요"
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>

                    {/* Style Info */}
                    <div className="p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                            <p className="text-sm text-white/60">AI가 분석한 원본 스타일:</p>
                            {isAnalyzing && (
                                <svg className="animate-spin w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg">
                                <div
                                    className="w-5 h-5 rounded border border-white/30"
                                    style={{ backgroundColor: styleAnalysis.textColor }}
                                />
                                <span className="text-xs text-white/80">텍스트 색상</span>
                            </div>
                            {styleAnalysis.strokeColor && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg">
                                    <div
                                        className="w-5 h-5 rounded border border-white/30"
                                        style={{ backgroundColor: styleAnalysis.strokeColor }}
                                    />
                                    <span className="text-xs text-white/80">외곽선 색상</span>
                                </div>
                            )}
                            <div className="px-3 py-2 bg-white/10 rounded-lg">
                                <span className="text-xs text-white/80">크기: {Math.round(styleAnalysis.fontSizeRatio * 100)}%</span>
                            </div>
                            <div className="px-3 py-2 bg-white/10 rounded-lg">
                                <span className="text-xs text-white/80">위치: {styleAnalysis.verticalPosition}</span>
                            </div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={generateThumbnail}
                        disabled={isGenerating}
                        className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                생성 중...
                            </>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                썸네일 생성하기
                            </>
                        )}
                    </button>
                </div>

                {/* Right: Preview Section */}
                <div className="flex flex-col">
                    <label className="block text-sm font-medium text-white/80 mb-2">
                        미리보기
                    </label>
                    <div className="flex-1 aspect-video bg-black/30 rounded-xl overflow-hidden flex items-center justify-center min-h-[200px]">
                        {generatedImage ? (
                            <img
                                src={generatedImage}
                                alt="생성된 썸네일"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="text-center text-white/40 p-6">
                                <svg className="w-16 h-16 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
                                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                                    <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <p>사진을 업로드하고<br />생성 버튼을 눌러주세요</p>
                            </div>
                        )}
                    </div>

                    {generatedImage && (
                        <button
                            onClick={downloadGeneratedImage}
                            className="mt-4 w-full py-3 bg-white/10 border border-white/20 rounded-xl text-white font-medium transition-all hover:bg-white/20 flex items-center justify-center gap-2"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15M7 10L12 15M12 15L17 10M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            다운로드
                        </button>
                    )}
                </div>
            </div>

            {/* Hidden Canvas for Generation */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
