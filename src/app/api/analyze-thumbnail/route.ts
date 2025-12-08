import { NextRequest, NextResponse } from 'next/server';

interface AnalysisResult {
    textColor: string;
    textPosition: string;
    fontStyle: string;
    fontSize: string;
    backgroundStyle: string;
}

export async function POST(request: NextRequest) {
    try {
        const { thumbnailUrl } = await request.json();

        if (!thumbnailUrl) {
            return NextResponse.json(
                { success: false, error: '썸네일 URL이 필요합니다.' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            // API 키가 없으면 기본값 반환
            return NextResponse.json({
                success: true,
                textColor: '#FFFFFF',
                textPosition: 'bottom-center',
                fontStyle: 'bold',
                fontSize: 'large',
                backgroundStyle: 'blur'
            });
        }

        // Fetch the thumbnail image and convert to base64
        const imageResponse = await fetch(thumbnailUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

        // Call Gemini API
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    inlineData: {
                                        mimeType: mimeType,
                                        data: base64Image,
                                    },
                                },
                                {
                                    text: `이 유튜브 썸네일 이미지를 분석해주세요. 다음 정보를 JSON 형식으로 추출해주세요:
1. textColor: 썸네일의 주요 텍스트 색상 (Hex code, 예: "#FFFFFF")
2. textPosition: 텍스트의 대략적인 위치 ("top-left", "top-center", "top-right", "center", "bottom-left", "bottom-center", "bottom-right" 중 하나)
3. fontStyle: 폰트 스타일 분위기 ("bold", "thin", "normal", "italic" 중 하나)
4. fontSize: 폰트 크기 느낌 ("small", "medium", "large", "xlarge" 중 하나)
5. backgroundStyle: 배경 스타일 ("solid", "gradient", "image", "blur" 중 하나)

JSON만 반환해주세요. 다른 설명은 필요 없습니다.`,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.1,
                        topK: 1,
                        topP: 1,
                        maxOutputTokens: 500,
                    },
                }),
            }
        );

        if (!geminiResponse.ok) {
            throw new Error('Gemini API 호출 실패');
        }

        const geminiData = await geminiResponse.json();
        const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Parse JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsedResult = JSON.parse(jsonMatch[0]) as AnalysisResult;
            return NextResponse.json({
                success: true,
                ...parsedResult,
            });
        }

        // Return default values if parsing fails
        return NextResponse.json({
            success: true,
            textColor: '#FFFFFF',
            textPosition: 'bottom-center',
            fontStyle: 'bold',
            fontSize: 'large',
            backgroundStyle: 'blur',
        });

    } catch (error) {
        console.error('Thumbnail analysis error:', error);

        // Return default values on error
        return NextResponse.json({
            success: true,
            textColor: '#FFFFFF',
            textPosition: 'bottom-center',
            fontStyle: 'bold',
            fontSize: 'large',
            backgroundStyle: 'blur',
        });
    }
}
