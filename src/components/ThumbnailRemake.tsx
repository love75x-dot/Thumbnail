'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface ThumbnailRemakeProps {
    videoId: string;
    thumbnailUrl: string;
}

interface StyleAnalysis {
    x_percent: number;
    y_percent: number;
    alignment: string;
    font_size_percent: number;
    text_color: string;
    stroke_color: string | null;
}

const defaultStyle: StyleAnalysis = {
    x_percent: 50,
    y_percent: 80,
    alignment: 'center',
    font_size_percent: 12,
    text_color: '#FFFFFF',
    stroke_color: '#000000',
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

    // Analyze thumbnail style
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
                        x_percent: data.x_percent || defaultStyle.x_percent,
                        y_percent: data.y_percent || defaultStyle.y_percent,
                        alignment: data.alignment || defaultStyle.alignment,
                        font_size_percent: data.font_size_percent || defaultStyle.font_size_percent,
                        text_color: data.text_color || defaultStyle.text_color,
                        stroke_color: data.stroke_color,
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
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    const targetRatio = 16 / 9;
                    const imgRatio = img.width / img.height;

                    let sourceWidth = img.width;
                    let sourceHeight = img.height;
                    let sourceX = 0;
                    let sourceY = 0;

                    if (imgRatio > targetRatio) {
                        sourceWidth = img.height * targetRatio;
                        sourceX = (img.width - sourceWidth) / 2;
                    } else if (imgRatio < targetRatio) {
                        sourceHeight = img.width / targetRatio;
                        sourceY = (img.height - sourceHeight) / 2;
                    }

                    const maxWidth = 1280;
                    const maxHeight = 720;
                    canvas.width = maxWidth;
                    canvas.height = maxHeight;

                    ctx.drawImage(
                        img,
                        sourceX, sourceY, sourceWidth, sourceHeight,
                        0, 0, maxWidth, maxHeight
                    );

                    setUserImage(canvas.toDataURL('image/png'));
                };
                img.src = event.target?.result as string;
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
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    const targetRatio = 16 / 9;
                    const imgRatio = img.width / img.height;

                    let sourceWidth = img.width;
                    let sourceHeight = img.height;
                    let sourceX = 0;
                    let sourceY = 0;

                    if (imgRatio > targetRatio) {
                        sourceWidth = img.height * targetRatio;
                        sourceX = (img.width - sourceWidth) / 2;
                    } else if (imgRatio < targetRatio) {
                        sourceHeight = img.width / targetRatio;
                        sourceY = (img.height - sourceHeight) / 2;
                    }

                    const maxWidth = 1280;
                    const maxHeight = 720;
                    canvas.width = maxWidth;
                    canvas.height = maxHeight;

                    ctx.drawImage(
                        img,
                        sourceX, sourceY, sourceWidth, sourceHeight,
                        0, 0, maxWidth, maxHeight
                    );

                    setUserImage(canvas.toDataURL('image/png'));
                };
                img.src = event.target?.result as string;
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
            // Step 1: Draw blurred background
            const bgImage = new Image();
            bgImage.crossOrigin = 'anonymous';

            await new Promise<void>((resolve, reject) => {
                bgImage.onload = () => resolve();
                bgImage.onerror = reject;
                bgImage.src = thumbnailUrl;
            });

            ctx.filter = 'blur(25px) brightness(0.4) saturate(1.2)';
            ctx.drawImage(bgImage, -50, -50, width + 100, height + 100);
            ctx.filter = 'none';

            // Add gradient overlay
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
            gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Step 2: Draw user image
            if (userImage) {
                const userImg = new Image();
                await new Promise<void>((resolve, reject) => {
                    userImg.onload = () => resolve();
                    userImg.onerror = reject;
                    userImg.src = userImage;
                });

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

                ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
                ctx.shadowBlur = 40;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 15;

                ctx.drawImage(userImg, imgX, imgY, imgWidth, imgHeight);

                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            }

            // Step 3: Draw text with COORDINATE-BASED positioning
            const fontSize = Math.round(height * (styleAnalysis.font_size_percent / 100));
            ctx.font = `bold ${fontSize}px 'Noto Sans KR', sans-serif`;

            // Set text alignment based on analysis
            ctx.textAlign = styleAnalysis.alignment as CanvasTextAlign;
            ctx.textBaseline = 'middle';

            // Calculate EXACT coordinates from percentages
            const targetX = width * (styleAnalysis.x_percent / 100);
            const targetY = height * (styleAnalysis.y_percent / 100);

            // Draw stroke if exists
            if (styleAnalysis.stroke_color) {
                ctx.strokeStyle = styleAnalysis.stroke_color;
                ctx.lineWidth = Math.max(fontSize * 0.1, 6);
                ctx.lineJoin = 'round';
                ctx.miterLimit = 2;
                ctx.strokeText(userText, targetX, targetY);
            }

            // Draw shadow for better visibility
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;

            // Draw main text at EXACT coordinates
            ctx.fillStyle = styleAnalysis.text_color;
            ctx.fillText(userText, targetX, targetY);

            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            // Convert to image
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
        <div className="mt-12 glass-card p-8 md:p-10 w-full">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-2xl font-semibold text-white">썸네일 카피</h3>
                    <span className="text-xs px-2 py-0.5 bg-purple-500/30 text-purple-300 rounded-full">AI 좌표 기반</span>
                </div>
            </div>

            <p className="text-white/60 mb-8">
                원본 썸네일의 텍스트 위치를 정밀하게 분석하여 똑같은 좌표에 배치합니다! (이미지는 자동으로 16:9 비율로 조정됩니다)
            </p>

            {/* Grid Layout: 4 (Input) + 8 (Preview) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Input Section (30%) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                            사진 업로드
                        </label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={`
                border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
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
                                        className="max-h-32 mx-auto rounded-lg"
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
                                    <svg className="w-10 h-10 mx-auto mb-2 text-white/40" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <p className="text-white/60 text-sm">클릭 또는 드래그</p>
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
                            placeholder="텍스트 입력"
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>

                    {/* Style Info */}
                    <div className="p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                            <p className="text-sm text-white/60">AI 분석 결과:</p>
                            {isAnalyzing && (
                                <svg className="animate-spin w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg">
                                <div
                                    className="w-4 h-4 rounded border border-white/30"
                                    style={{ backgroundColor: styleAnalysis.text_color }}
                                />
                                <span className="text-xs text-white/80">텍스트</span>
                            </div>
                            <div className="px-3 py-2 bg-white/10 rounded-lg">
                                <span className="text-xs text-white/80">위치: X {styleAnalysis.x_percent}%, Y {styleAnalysis.y_percent}%</span>
                            </div>
                            <div className="px-3 py-2 bg-white/10 rounded-lg">
                                <span className="text-xs text-white/80">크기: {styleAnalysis.font_size_percent}%</span>
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
                                생성하기
                            </>
                        )}
                    </button>
                </div>

                {/* Right: Preview Section (70%) */}
                <div className="lg:col-span-8 flex flex-col">
                    <label className="block text-sm font-medium text-white/80 mb-2">
                        미리보기 (1280 x 720)
                    </label>
                    <div className="flex-1 aspect-video bg-black/30 rounded-xl overflow-hidden flex items-center justify-center border border-white/10">
                        {generatedImage ? (
                            <img
                                src={generatedImage}
                                alt="생성된 썸네일"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="text-center text-white/40 p-8">
                                <svg className="w-20 h-20 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
                                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                                    <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <p className="text-lg">사진을 업로드하고 생성 버튼을 눌러주세요</p>
                                <p className="text-sm text-white/30 mt-2">원본과 동일한 좌표에 텍스트가 배치됩니다</p>
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

            {/* Hidden Canvas */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
