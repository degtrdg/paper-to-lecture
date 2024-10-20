import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Add this new test function
export async function testProcessJob(enableTest: boolean = false) {
    if (!enableTest) {
        console.log("Test is disabled. Set enableTest to true to run the test.");
        return;
    }

    const testUserId = "test_user_" + uuidv4();
    console.log("Starting test job processing for user:", testUserId);

    try {
        // Simulate slide creation
        console.log("Creating test slides...");
        const testSlides = [
            {
                title: "Introduction to Cancer Stemness",
                markdownContent: "- Cancer progression involves stem-cell-like features\n- Stemness refers to self-renewal and differentiation",
                speakerNotes: "Cancer stemness is a crucial concept in understanding tumor progression."
            },
            {
                title: "Stemness Indices",
                markdownContent: "- Developed novel stemness indices\n- Based on gene expression and DNA methylation",
                speakerNotes: "These indices help quantify the degree of dedifferentiation in tumors."
            }
        ];

        // Actually call the TTS API
        console.log("Calling TTS API...");
        let voiceovers = [];
        for (let slide of testSlides) {
            try {
                const ttsResult = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tts`, {
                    method: 'POST',
                    body: JSON.stringify({ text: slide.speakerNotes }),
                });
                console.log("TTS result status:", ttsResult.status);

                if (!ttsResult.ok) {
                    console.error(`TTS API returned status ${ttsResult.status} for slide`);
                    voiceovers.push('');
                    continue;
                }

                const audioBuffer = await ttsResult.arrayBuffer();
                const base64Audio = Buffer.from(audioBuffer).toString('base64');
                voiceovers.push(base64Audio);
            } catch (error) {
                console.error(`Error processing TTS:`, error);
                voiceovers.push('');
            }
        }

        // Prepare data for create_video endpoint
        const formData = new FormData();

        // Add slides JSON
        const slidesBlob = new Blob([JSON.stringify(testSlides)], {
            type: 'application/json'
        });
        formData.append('slides', slidesBlob, 'slides.json');

        // Add voiceover files
        voiceovers.forEach((voiceover, index) => {
            if (voiceover) {
                const audioBlob = new Blob([Buffer.from(voiceover, 'base64')], {
                    type: 'audio/mpeg'
                });
                formData.append('voiceovers', audioBlob, `voiceover_${index}.mp3`);
            }
        });

        // Actually call create_video endpoint
        console.log("Calling create_video API...");
        const createVideoResult = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create_video`, {
            method: 'POST',
            body: formData,
        });

        if (!createVideoResult.ok) {
            throw new Error(`Failed to create video: ${createVideoResult.statusText}`);
        }

        const createVideoResponse = await createVideoResult.json();
        console.log("Video created:", createVideoResponse);

        console.log("Test job processing completed successfully");

        return {
            userId: testUserId,
            slidesCount: testSlides.length,
            voiceoversCount: voiceovers.length,
            videoUrl: createVideoResponse.video_url
        };

    } catch (error) {
        console.error("Error in test job processing:", error);
        throw error;
    }
}

// Modify your existing processJob function to include the test
export async function processJob(user_id: string, pdfUrl: string, isTest: boolean = true) {
    if (isTest) {
        return await testProcessJob(true);
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    console.log("Processing job:", user_id, pdfUrl);
    try {
        
        // First, lets call the info truncator
        const infoTruncatorResult = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/paper/truncate-pdf`, {
            method: 'POST',
            body: JSON.stringify({ pdfUrl: pdfUrl }),
        });
        const infoTruncatorResponse = await infoTruncatorResult.json();
        const pdfBase64 = infoTruncatorResponse['pdf'];
        console.log("Info truncator responded");
        // For not, we'll just download the pdf and send it to the paper text extractor
        //const pdfBytes = await downloadPdf(pdfUrl);
        await supabase
        .from('jobs')
        .update({ status: 2 }) 
        .eq('user_id', user_id);    
        // Then, lets call the paper text extractor
        const paperTextExtractorResult = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/extract_pdf_text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pdf_base64: pdfBase64 }),
        });
        const paperTextExtractorResponse = await paperTextExtractorResult.json();
        console.log("Paper text extractor response:", paperTextExtractorResponse);
        await supabase
        .from('jobs')
        .update({ status: 3 })
        .eq('user_id', user_id);
        // The text extractor is not set up yet, so let's create some dummy data, about 5 paragraphs of text poorly formatted with words in wrong places
        //const paperText = "This is a test paper, it has some words in wrong pla   ces and is not formatted well. It also has some references that should be removed. But everything that is related to the main content of the paper should be kept no matter what. Return a version of the text in a linear form that is readable inside a browser. It should be a single string with no line breaks. It should be about 5 paragraphs of text. It should be about 1000 words.";
        // Then, call the truncate text api
        const truncateTextResult = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/paper/truncate-text`, {
            method: 'POST',
            body: JSON.stringify({ rawPaper: paperTextExtractorResponse['full_text'] }),
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
        console.log("Data extractor response: ", dataExtractorResponse['slides']);
        console.log("Data extractor response (slide 1): ", dataExtractorResponse['slides'][1]);
        
        console.log("Data extractor response (speaker notes): ", dataExtractorResponse['slides'][1]['speakerNotes']);

        
        await supabase
        .from('jobs')
        .update({ status: 6 })
        .eq('user_id', user_id);
        // Now, for eachc slide, we should take the speakerNotes and create a voiceover for it
        // We can do this by calling the tts api
        let voiceovers = [];
        for (let i = 0; i < dataExtractorResponse['slides'].length; i++) {
            if (dataExtractorResponse['slides'][i] && dataExtractorResponse['slides'][i]['speakerNotes'] === '') {
                voiceovers.push('');
                continue;
            }
            console.log("TTSing text: ", dataExtractorResponse['slides'][i]['speakerNotes']);
            console.log("TTSing slide: ", dataExtractorResponse['slides'][i]);
            
            try {
                const ttsResult = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tts`, {
                    method: 'POST',
                    body: JSON.stringify({ text: dataExtractorResponse['slides'][i]['speakerNotes'] }),
                });
                console.log("TTS result: ", ttsResult.status);

                if (!ttsResult.ok) {
                    console.error(`TTS API returned status ${ttsResult.status} for slide ${i}`);
                    voiceovers.push(''); // Push an empty string for failed TTS
                    continue; // Skip to the next iteration
                }

                const audioBuffer = await ttsResult.arrayBuffer();
                const base64Audio = Buffer.from(audioBuffer).toString('base64');
                voiceovers.push(base64Audio);
            } catch (error) {
                console.error(`Error processing TTS for slide ${i}:`, error);
                voiceovers.push(''); // Push an empty string for failed TTS
            }
        }
        dataExtractorResponse['voiceovers'] = voiceovers;
        console.log("Slides with voiceovers: ", dataExtractorResponse);
        // Then ITS SHOWTIME
        await supabase
        .from('jobs')
        .update({ status: 7 })
        .eq('user_id', user_id);

        // Prepare data for create_video endpoint
        const formData = new FormData();

        // Add slides JSON
        const slidesBlob = new Blob([JSON.stringify(dataExtractorResponse.slides)], {
            type: 'application/json'
        });
        formData.append('slides', slidesBlob, 'slides.json');

        // Add voiceover files
        dataExtractorResponse.voiceovers.forEach((voiceover: string | null, index: number) => {
            if (voiceover) {
                const audioBlob = new Blob([Buffer.from(voiceover, 'base64')], {
                    type: 'audio/mpeg'
                });
                formData.append('voiceovers', audioBlob, `voiceover_${index}.mp3`);
            }
        });

        // Call create_video endpoint
        const createVideoResult = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create_video`, {
            method: 'POST',
            body: formData,
        });

        if (!createVideoResult.ok) {
            throw new Error(`Failed to create video: ${createVideoResult.statusText}`);
        }

        const createVideoResponse = await createVideoResult.json();
        const video_id = uuidv4();
        // Add to a supabase table
        const { data, error } = await supabase
            .from('videos')
            .insert({
                uuid: video_id,
                video_link: createVideoResponse.video_url,
                creator_id: user_id
            });

        if (error) {
            console.error('Error inserting video into database:', error);
            throw new Error('Failed to save video information');
        }
        // Update job status with the video_id
        await supabase
            .from('jobs')
            .update({ 
                status: 8,
                video_id: video_id
            })
            .eq('user_id', user_id);

        console.log(`Job completed successfully. Video ID: ${video_id}`);


    } catch (error) {
        console.error(`Error processing job ${user_id}:`, error);
        
        // Update job status to error
        await supabase
            .from('jobs')
            .update({ status: 0 })
            .eq('user_id', user_id);
    }
}

async function downloadPdf(pdfUrl: string) {
    const response = await fetch(pdfUrl);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}
