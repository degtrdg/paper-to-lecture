import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { text } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const response = await fetch('https://api.cartesia.ai/tts/bytes', {
            method: 'POST',
            headers: {
                'Cartesia-Version': '2024-06-10',
                'X-API-Key': 'f38eabcc-1c34-47c4-b07c-511da59d263a',
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
            const errorData = await response.json();
            console.error('Cartesia API Error:', errorData);
            return NextResponse.json({ error: 'Failed to generate audio' }, { status: response.status });
        }

        const audioBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(audioBuffer);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': 'attachment; filename="audio.mp3"',
            },
        });
    } catch (error) {
        console.error('Error generating audio:', error);
        return NextResponse.json({ error: 'Failed to generate audio' }, { status: 500 });
    }
}
