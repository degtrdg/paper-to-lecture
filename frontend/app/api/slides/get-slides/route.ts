import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const getSlidesPrompt = (paper: string) =>
    `I need to write a presentation that answers at least this in the presentation:
    
    Background/Rationale for the research
    - reasons that instigated the authors to perform the study
    Central question addressed by the paper
    - objective or hypothesis
    Methods
    - overview of experimental flow/approach without technical details
    Journal Club Discussion Elements
    Results & discussion
    - data and its meaning/interpretation in relation to the central question
    Conclusion
    - reiterate key findings of the paper and its significance to the research field
    
    We still need to bring in figures to explain and introduce/explain certain parts but it is roughly what we need to have.
    
    This is the paper. I can't give you images yet, so try to infer things.
    \`\`\`
    ${paper}
    \`\`\`
    
    I need a powerpoint presentation of this.
    
    This is the rubric for my presentation by the way. I just copy pasted from the pdf but i'm sure you can figure out the original interpretation:
    
    \`\`\`
    Rubric
    Presentation Category Elements of a strong presentation Weight (%)
    Knowledge and explanation
    of subject matter:
    • Conveys big picture understanding
    • Presents essential information
     (accurate description of facts,
     objectives, procedures, findings etc.)
    60
    (breakdown
    below)
    Introduction/Background/
    Central question
    • Introduce yourself and state why
     you chose this paper
    • Concise description of background
     needed to understand objective(s),
     significance and results
    • Clearly state central question
     addressed by the paper
    (15)
    Experimental
    approach/Methods
    • Gives information necessary (and no
     more!) to understand results
    • Shows overview of experimental
     flow/approach if appropriate
    (10)
    Data/Results/Discussion • Logical flow of findings
    • Complete and concise explanations
    • Integrated results + discussion +
     your thoughts/criticisms of the paper
    (20)
    Summary/Conclusions • Reiterate key findings and explain
     their significance
    (5)
    Future Directions • Concise description of proposed
     future direction, experimental
     approach and significance of
     expected findings
    (10)
    Overall organization of talk • Content introduced in logical, easy-
     to-follow sequence
    • Main points emphasized, repeated
     (preview/tell/review) is important
    • Transition statements between ideas
    10
    Overall effectiveness of
    slides (text and visuals)
    • Clear slide titles
    • Good balance of text and figures
    • Text/figures large enough to be seen
    • Not too many or too few slides
    15
    Overall effectiveness of
    delivery
    • Confident, enthusiastic delivery
    • Main points verbally emphasized
    • Get to main points quickly
    • Strong eye contact
    • Use of both technical and informal
     language as appropriate
    • Presentation 20 mins in length
    10 
    \`\`\`
    
    We need to have the slides in where it says what will be on the slides but also what I'll be saying right over those slides.
    
    That means having the title and the slide's content in markdown format (with # headers, bullet points, and newlines for spacing). The title slide will only have the title of the paper as content. In terms of what you'd say in the speaker notes, you'll give context on the paper and the authors along with your elevator pitch for the paper basically. The order of each slide will be the content of the slide and then the speaker notes. All the information about the each slide will be in a single md codeblock. So if there are n slides, there will be n codeblocks which I can easily extract with regex by splitting your entire output by \`---\`.
    
    The presentation notes need to have detailed things that I would say for each of those notes. This needs to be fully encompassing so that I can present it straight from what you give me. We will not be introducing ourselves by name since we are already known. It is very important that you do not hallucinate or make up things in the presentation as this is about a research paper.`;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
    try {
        const { paper } = await request.json();

        if (!paper || typeof paper !== 'string') {
            return NextResponse.json({ error: 'Invalid or missing paper content' }, { status: 400 });
        }

        const response = await openai.chat.completions.create({
            model: 'o1-preview',
            messages: [{ role: 'user', content: getSlidesPrompt(paper) }]
        });

        const slides = response.choices[0].message.content;

        return NextResponse.json({ slides: slides });
    } catch (error) {
        console.error('Error generating slides:', error);
        return NextResponse.json({ error: 'Failed to generate slides' }, { status: 500 });
    }
}
