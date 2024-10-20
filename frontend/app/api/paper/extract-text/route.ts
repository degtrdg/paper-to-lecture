import { NextRequest, NextResponse } from 'next/server';
import { encoding_for_model } from 'tiktoken';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const reorgPrompt = (rawPaper: string) => `I need help reorganizing this text that was extracted from a pdf without taking into account reading order. It's interleaved different parts so that it doesn't make sense reading it in the way it currently is. It also has some unnecessary information like a long list of references that should be removed. But everything that is related to the main content of the paper should be kept no matter what. Return a version of the text in a linear form that is readable inside of a single codeblock that contains the ENTIRE paper within a single codeblock of \`\`\` so that it can extracted with regex. Do not hallucinate anything. Do not make up any information.

\`\`\`
${rawPaper}
\`\`\`
`;

function truncatePaper(paper: string, maxTokens: number = 25000): string {
    const encoder = encoding_for_model('gpt-3.5-turbo');
    const tokens = encoder.encode(reorgPrompt(paper));
    
    if (tokens.length <= maxTokens) {
        return paper;
    }

    const lines = paper.split('\n');
    let truncatedPaper = '';
    let currentTokens = 0;

    for (const line of lines) {
        const lineTokens = encoder.encode(reorgPrompt(line)).length;
        if (currentTokens + lineTokens > maxTokens) {
            break;
        }
        truncatedPaper += line + '\n';
        currentTokens += lineTokens;
    }

    return truncatedPaper.trim();
}

export async function POST(request: NextRequest) {
    try {
        const { rawPaper } = await request.json();

        if (!rawPaper) {
            return NextResponse.json({ error: 'Raw paper text is required' }, { status: 400 });
        }

        const truncatedPaper = truncatePaper(rawPaper, 25000);

        const response = await openai.chat.completions.create({
            model: 'o1-preview',
            messages: [{ role: 'user', content: reorgPrompt(truncatedPaper) }],
        });

        const extractedText = response.choices[0]?.message?.content || '';

        return NextResponse.json({ extractedText });
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
