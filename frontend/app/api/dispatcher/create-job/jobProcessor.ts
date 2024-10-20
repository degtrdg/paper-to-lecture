import { createClient } from '@supabase/supabase-js';

export async function processJob(user_id: string, pdfUrl: string) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    try {
        
        // First, lets call the paper text extractor
        

        await supabase
            .from('jobs')
            .update({ status: 2 }) // Assuming 2 means "processing"
            .eq('user_id', user_id);

        // Perform your long-running task here
        // For example, process the PDF, extract information, etc.
        // This is where you'd put your actual job processing logic

        // Simulating a long process with a delay
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Update job status to completed
        await supabase
            .from('jobs')
            .update({ status: 3 }) // Assuming 3 means "completed"
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
