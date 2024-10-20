import { NextRequest, NextResponse } from 'next/server';
import Instructor from "@instructor-ai/instructor";
import OpenAI from 'openai';
import { z } from "zod";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const client = Instructor({
   client: openai,
   mode: "FUNCTIONS"
});

const slideStructureSystemPrompt = 
`You are an expert at extracting information in a structured format slides.`;

const getSlideStructuredPrompt = (slide: string) =>
`
I need to extract the following information from this chunk of text:
\`\`\`
${slide}
\`\`\`
`;

const SlideSchema = z.object({
  title: z.string().describe("The title of the slide"),
  markdownContent: z.string().describe("The main content of the slide in markdown format"),
  speakerNotes: z.string().describe("Speaker notes for the slide")
});

type Slide = z.infer<typeof SlideSchema>;

async function processSlide(slide: string): Promise<Slide> {
  console.log("Processing slide: ", slide);
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
        {role: 'system', content: slideStructureSystemPrompt},
        {role: 'user', content: getSlideStructuredPrompt(slide)}
    ],
    response_model: { 
      schema: SlideSchema, 
      name: "Slide"
    }
  });
  console.log("Response: ", response);
  return response;
}


// Argument: slidesRaw
// Returns: { slides: [Slide, Slide, ...] }

export async function POST(request: NextRequest) {
    try {
        const { slidesRaw } = await request.json();

        if (!slidesRaw || typeof slidesRaw !== 'string') {
            return NextResponse.json({ error: 'Invalid or missing slidesRaw content' }, { status: 400 });
        }

        const slides = slidesRaw.split('---').map(slide => slide.trim());

        console.log(`Number of slides: ${slides.length}`);
        console.log('First slide:', slides[0]);
        console.log('Second slide:', slides[1]);

        const processedSlides = await Promise.all(slides.map(processSlide));

        return NextResponse.json({ slides: processedSlides });
    } catch (error) {
        console.error('Error processing slides:', error);
        return NextResponse.json({ error: 'Failed to process slides' }, { status: 500 });
    }
}
