import { NextRequest, NextResponse } from 'next/server';

interface AnalysisResult {
    textColor: string;
    strokeColor: string | null;
    fontPosition: string;
    fontSizeLevel: string;
    alignment: string;
}

const defaultAnalysis = {
    success: true,
    textColor: '#FFFFFF',
    strokeColor: '#000000',
    fontPosition: 'bottom',
    fontSizeLevel: 'big',
    alignment: 'center',
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

        // Enhanced Gemini API prompt for better style analysis
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
                                    text: `이 유튜브 썸네일에서 가장 큰 제목 텍스트의 스타일을 정확하게 분석해주세요.

반드시 아래 JSON 형식만 반환하세요. 다른 설명은 절대 포함하지 마세요.

{
  "textColor": "텍스트의 메인 색상 (Hex code, 예: #FFFFFF, #FF0000)",
  "strokeColor": "텍스트 외곽선/테두리 색상 (Hex code). 외곽선이 없으면 null",
  "fontPosition": "텍스트의 세로 위치 (top, middle, bottom 중 하나만)",
  "fontSizeLevel": "텍스트 크기 (big, medium, small 중 하나만)",
  "alignment": "텍스트 가로 정렬 (left, center, right 중 하나만)"
}

분석 가이드:
- textColor: 텍스트의 가장 눈에 띄는 주요 색상을 정확한 Hex code로
- strokeColor: 텍스트에 검은색이나 흰색 외곽선이 있다면 그 색상, 없으면 null
- fontPosition: 텍스트가 이미지 상단 1/3에 있으면 top, 중간 1/3이면 middle, 하단 1/3이면 bottom
- fontSizeLevel: 텍스트가 이미지 높이의 20% 이상이면 big, 10-20%면 medium, 10% 미만이면 small
- alignment: 텍스트가 왼쪽에 치우쳐 있으면 left, 중앙이면 center, 오른쪽이면 right

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
                textColor: parsedResult.textColor || defaultAnalysis.textColor,
                strokeColor: parsedResult.strokeColor,
                fontPosition: ['top', 'middle', 'bottom'].includes(parsedResult.fontPosition)
                    ? parsedResult.fontPosition
                    : defaultAnalysis.fontPosition,
                fontSizeLevel: ['big', 'medium', 'small'].includes(parsedResult.fontSizeLevel)
                    ? parsedResult.fontSizeLevel
                    : defaultAnalysis.fontSizeLevel,
                alignment: ['left', 'center', 'right'].includes(parsedResult.alignment)
                    ? parsedResult.alignment
                    : defaultAnalysis.alignment,
            });
        }

        return NextResponse.json(defaultAnalysis);

    } catch (error) {
        console.error('Thumbnail analysis error:', error);
        return NextResponse.json(defaultAnalysis);
    }
}
