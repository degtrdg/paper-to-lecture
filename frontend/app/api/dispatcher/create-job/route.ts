import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// New import for the background process
import { processJob } from './jobProcessor';

export async function POST(request: NextRequest) {
    const { pdfUrl, user } = await request.json();
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    // Check if a job already exists for this user and PDF URL
    const { data: existingJob, error: fetchError } = await supabase
        .from('jobs')
        .select()
        .eq('user_id', user)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error fetching existing job:", fetchError);
        return NextResponse.json({ status: "error", message: "Error checking for existing job" }, { status: 500 });
    }

    let result;
    if (existingJob) {
        // Update the existing job
        result = await supabase
            .from('jobs')
            .update({ status: 1 })
            .eq('user_id', user)
            .select();
    } else {
        // Create a new job
        result = await supabase
            .from('jobs')
            .insert({
                user_id: user,
                status: 1
            })
            .select();
    }

    const { data, error } = result;

    if (error) {
        console.error("Error creating/updating job:", error);
        return NextResponse.json({ status: "error", message: "Failed to create/update job" }, { status: 500 });
    }


    // Start the background process
    const jobId = data[0].user_id;
    processJob(jobId, pdfUrl).catch(error => {
        console.error(`Error processing job ${jobId}:`, error);
        // Here you might want to update the job status to indicate an error
    });

    return NextResponse.json({ status: "ok", jobId: jobId });
}
