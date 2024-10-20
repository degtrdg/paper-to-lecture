import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { text } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }
        console.log("Text: ", text);
        const response = await fetch('https://api.cartesia.ai/tts/bytes', {
            method: 'POST',
            headers: {
                'Cartesia-Version': '2024-06-10',
                'X-API-Key': process.env.CARTE_API_KEY!,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                transcript: text,
                model_id: "sonic-english",  
                voice: {
                    mode: "id",
                    id: "a0e99841-438c-4a64-b679-ae501e7d6091", 
                },
                output_format: {
                    container: "mp3",
                    encoding: "mp3",
                    sample_rate: 44100,
                },
            }),
        });

        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                console.error('Cartesia API Error:', errorData);
                return NextResponse.json({ error: 'Failed to generate audio', details: errorData }, { status: response.status });
            } else {
                const errorText = await response.text();
                console.error('Cartesia API Error:', errorText);
                return NextResponse.json({ error: 'Failed to generate audio', details: errorText }, { status: response.status });
            }
        }

        const audioBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(audioBuffer);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': 'attachment; filename="audio.mp3"',
            },
        });
    } catch (error: any) {
        console.error('Error generating audio:', error);
        return NextResponse.json({ error: 'Failed to generate audio', details: error.message }, { status: 500 });
    }
}
