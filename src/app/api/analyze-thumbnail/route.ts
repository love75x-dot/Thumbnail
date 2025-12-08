import { NextRequest, NextResponse } from 'next/server';

interface AnalysisResult {
    textColor: string;
    strokeColor: string | null;
    fontSizeRatio: number;
    fontWeight: string;
    verticalPosition: string;
    horizontalAlign: string;
}

const defaultAnalysis = {
    success: true,
    textColor: '#FFFFFF',
    strokeColor: '#000000',
    fontSizeRatio: 0.12,
    fontWeight: 'bold',
    verticalPosition: 'bottom',
    horizontalAlign: 'center',
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
            // API 키가 없으면 기본값 반환
            return NextResponse.json(defaultAnalysis);
        }

        // Fetch the thumbnail image and convert to base64
        const imageResponse = await fetch(thumbnailUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

        // Call Gemini API with enhanced prompt
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
                                    text: `이 유튜브 썸네일에서 가장 큰 제목 텍스트의 스타일을 분석해주세요. 
                                    
반드시 아래 형식의 JSON만 반환하세요. 다른 설명은 절대 포함하지 마세요.

{
  "textColor": "텍스트의 메인 색상 (Hex code, 예: #FFFFFF)",
  "strokeColor": "텍스트 외곽선/테두리 색상 (Hex code). 외곽선이 없으면 null",
  "fontSizeRatio": 이미지 높이 대비 폰트 크기 비율 (0.05 ~ 0.3 사이 숫자, 예: 0.15),
  "fontWeight": "폰트 굵기 (normal, 500, 600, 700, 800, 900, bold 중 하나)",
  "verticalPosition": "세로 위치 (top, middle, bottom 중 하나)",
  "horizontalAlign": "가로 정렬 (left, center, right 중 하나)"
}

분석 시 주의사항:
- textColor: 텍스트의 가장 주요한 색상을 추출
- strokeColor: 텍스트에 검은색이나 다른 색의 외곽선/그림자가 있다면 해당 색상, 없으면 null
- fontSizeRatio: 텍스트가 이미지에서 차지하는 비율 (큰 텍스트면 0.15~0.25, 작으면 0.08~0.12)
- fontWeight: 굵은 폰트면 bold 또는 800, 일반이면 normal
- verticalPosition: 텍스트가 위에 있으면 top, 가운데면 middle, 아래면 bottom
- horizontalAlign: 텍스트가 왼쪽 정렬이면 left, 중앙이면 center, 오른쪽이면 right`,
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

            // Validate and sanitize the parsed result
            return NextResponse.json({
                success: true,
                textColor: parsedResult.textColor || defaultAnalysis.textColor,
                strokeColor: parsedResult.strokeColor,
                fontSizeRatio: typeof parsedResult.fontSizeRatio === 'number'
                    ? Math.min(Math.max(parsedResult.fontSizeRatio, 0.05), 0.3)
                    : defaultAnalysis.fontSizeRatio,
                fontWeight: parsedResult.fontWeight || defaultAnalysis.fontWeight,
                verticalPosition: parsedResult.verticalPosition || defaultAnalysis.verticalPosition,
                horizontalAlign: parsedResult.horizontalAlign || defaultAnalysis.horizontalAlign,
            });
        }

        // Return default values if parsing fails
        return NextResponse.json(defaultAnalysis);

    } catch (error) {
        console.error('Thumbnail analysis error:', error);
        // Return default values on error
        return NextResponse.json(defaultAnalysis);
    }
}
