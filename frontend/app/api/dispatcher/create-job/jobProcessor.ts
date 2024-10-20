import { createClient } from '@supabase/supabase-js';

export async function processJob(user_id: string, pdfUrl: string) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    console.log("Processing job:", user_id, pdfUrl);
    try {
        
        // First, lets call the info truncator
        /*const infoTruncatorResult = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/paper/truncate-pdf`, {
            method: 'POST',
            body: JSON.stringify({ pdfUrl: pdfUrl }),
        });
        const infoTruncatorResponse = await infoTruncatorResult.json();
        const pdfBytes = infoTruncatorResponse['pdf'];
        await supabase
        .from('jobs')
        .update({ status: 2 }) 
        .eq('user_id', user_id);*/

        // Then, lets call the paper text extractor
        /*const paperTextExtractorResult = await fetch('/api/paper/extract-info', {
            method: 'POST',
            body: JSON.stringify({ pdfBytes, user: user_id }),
        });
        const paperTextExtractorResponse = await paperTextExtractorResult.json();*/
        await supabase
        .from('jobs')
        .update({ status: 3 })
        .eq('user_id', user_id);
        // The text extractor is not set up yet, so let's create some dummy data, about 5 paragraphs of text poorly formatted with words in wrong places
        const paperText = "This is a test paper, it has some words in wrong places and is not formatted well. It also has some references that should be removed. But everything that is related to the main content of the paper should be kept no matter what. Return a version of the text in a linear form that is readable inside a browser. It should be a single string with no line breaks. It should be about 5 paragraphs of text. It should be about 1000 words.";

        // Then, call the truncate text api
        const truncateTextResult = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/paper/truncate-text`, {
            method: 'POST',
            body: JSON.stringify({ rawPaper: paperText }),
        });
        const truncateTextResponse = await truncateTextResult.json();
        console.log("Truncated paper:", truncateTextResponse);
        const truncatedPaper = truncateTextResponse['extractedText'];
        await supabase
        .from('jobs')
        .update({ status: 4 })
        .eq('user_id', user_id);

        // Then, call the create slides api
        const createSlidesResult = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/slides/get-slides`, {
            method: 'POST',
            body: JSON.stringify({ paper: truncatedPaper }),
        });

        if (!createSlidesResult.ok) {
            throw new Error(`Failed to create slides: ${createSlidesResult.statusText}`);
        }

        const createSlidesResponse = await createSlidesResult.json();
        await supabase
        .from('jobs')
        .update({ status: 5 })
        .eq('user_id', user_id);
        // Call the data extractor
        const dataExtractorResult = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/slides/extract`, {
            method: 'POST',
            body: JSON.stringify({ slidesRaw: createSlidesResponse['slides'] }),
        });
        const dataExtractorResponse = await dataExtractorResult.json();
        await supabase
        .from('jobs')
        .update({ status: 6 })
        .eq('user_id', user_id);
        // Then, call the extract slides api 

        // Then, call the export slides api

        // Then, call the tts api

        // Then, call the video parsing api (ffmpeg)

        // Then ITS SHOWTIME
        await supabase
        .from('jobs')
        .update({ status: 7 })
        .eq('user_id', user_id);

    } catch (error) {
        console.error(`Error processing job ${user_id}:`, error);
        
        // Update job status to error
        await supabase
            .from('jobs')
            .update({ status: 0 })
            .eq('user_id', user_id);
    }
}
