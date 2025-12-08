import { NextRequest, NextResponse } from 'next/server';

interface AnalysisResult {
    x_percent: number;
    y_percent: number;
    alignment: string;
    font_size_percent: number;
    text_color: string;
    stroke_color: string | null;
}

const defaultAnalysis = {
    success: true,
    x_percent: 50,
    y_percent: 80,
    alignment: 'center',
    font_size_percent: 12,
    text_color: '#FFFFFF',
    stroke_color: '#000000',
};

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
            return NextResponse.json(defaultAnalysis);
        }

        // Fetch the thumbnail image and convert to base64
        const imageResponse = await fetch(thumbnailUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

        // Coordinate-based precise analysis
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
                                    text: `이 유튜브 썸네일의 **가장 큰 메인 텍스트(제목)**의 중심점 위치와 스타일을 정밀하게 분석해주세요.

반드시 아래 JSON 형식만 반환하세요. 다른 설명은 절대 포함하지 마세요.

{
  "x_percent": 이미지 너비 기준 텍스트 중심점의 가로 위치 (0~100, 왼쪽 끝 0, 오른쪽 끝 100),
  "y_percent": 이미지 높이 기준 텍스트 중심점의 세로 위치 (0~100, 상단 0, 하단 100),
  "alignment": 텍스트 정렬 방식 ("left", "center", "right" 중 하나만),
  "font_size_percent": 이미지 높이 대비 글자 크기 비율 (5~30 사이 숫자),
  "text_color": 텍스트의 메인 색상 (정확한 Hex code, 예: "#FFFFFF"),
  "stroke_color": 텍스트 외곽선 색상 (Hex code, 없으면 null)
}

분석 가이드:
- x_percent: 텍스트 덩어리의 중심이 이미지 가로 어디에 있는지 (왼쪽 0%, 정중앙 50%, 오른쪽 100%)
- y_percent: 텍스트 덩어리의 중심이 이미지 세로 어디에 있는지 (상단 0%, 중간 50%, 하단 100%)
- alignment: 텍스트가 왼쪽 정렬이면 "left", 중앙이면 "center", 오른쪽이면 "right"
- font_size_percent: 텍스트 높이가 이미지 전체 높이의 몇 %인지 (큰 제목 15-25%, 중간 10-15%, 작은 5-10%)
- text_color: 텍스트의 주요 색상을 정확한 Hex code로
- stroke_color: 텍스트에 검은색/흰색 테두리가 있다면 그 색상, 없으면 null

JSON만 반환하세요.`,
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

            // Validate and return
            return NextResponse.json({
                success: true,
                x_percent: typeof parsedResult.x_percent === 'number'
                    ? Math.min(Math.max(parsedResult.x_percent, 0), 100)
                    : defaultAnalysis.x_percent,
                y_percent: typeof parsedResult.y_percent === 'number'
                    ? Math.min(Math.max(parsedResult.y_percent, 0), 100)
                    : defaultAnalysis.y_percent,
                alignment: ['left', 'center', 'right'].includes(parsedResult.alignment)
                    ? parsedResult.alignment
                    : defaultAnalysis.alignment,
                font_size_percent: typeof parsedResult.font_size_percent === 'number'
                    ? Math.min(Math.max(parsedResult.font_size_percent, 5), 30)
                    : defaultAnalysis.font_size_percent,
                text_color: parsedResult.text_color || defaultAnalysis.text_color,
                stroke_color: parsedResult.stroke_color,
            });
        }

        return NextResponse.json(defaultAnalysis);

    } catch (error) {
        console.error('Thumbnail analysis error:', error);
        return NextResponse.json(defaultAnalysis);
    }
}
