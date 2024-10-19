import { OpenAI } from "openai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { zodToJsonSchema } from "zod-to-json-schema";
import { createClient } from "@/utils/supabase/server";


function corsHandler(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get('origin') || '*'
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}



const vidSchema = z.object({
  links: z.array(z.string()),
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export async function POST(request: NextRequest) {
  const supabase = createClient()
  try {
    const { prompt, data, studentId } = await request.json();
    // Get the Student's filters from the database
    console.log("Student ID:", studentId)
    const { data: filtersData, error } = await supabase.from("students").select("filters").eq("student_id", studentId).single();
    if (error) {
      console.error("Error fetching filters:", error);
      return NextResponse.json({ error: "Error fetching filters" }, { status: 500 });
    }

    const filters = filtersData?.filters || [];

    console.log(prompt)
    console.log(data)
    console.log("Filters:", filters)
    // Convert Zod schema to JSON Schema
    const jsonSchema = zodToJsonSchema(vidSchema) as { properties: Record<string, unknown>, required?: string[] };

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Your job is to create a JSON object that contains a list of links for YouTube videos. You work as a filter for YouTube videos. You will be given a list of things that the user doesn't want to see; you will need to filter out anything that doesn't fit the criteria. Make sure to return only JSON.",
        },
        {
          role: "user",
          content: `Prompt: ${prompt}\n\nData: ${JSON.stringify(data)}\n\nFilters: ${JSON.stringify(filters)}`,
        },
      ],
      functions: [
        {
          name: "get_video_links",
          description:
            "Returns a list of YouTube video links that meet the criteria.",
          parameters: {
            type: "object",
            properties: jsonSchema.properties,
            required: jsonSchema.required ?? [],
          },
        },
      ],
      function_call: { name: "get_video_links" },
    });

    const functionCall = response.choices[0].message.function_call;

    if (functionCall && functionCall.arguments) {
      const args = JSON.parse(functionCall.arguments);
      const parsedData = vidSchema.safeParse(args);

      if (parsedData.success) {
        console.log(parsedData.data)
        return NextResponse.json(parsedData.data);
      } else {
        return NextResponse.json(
          { error: "Invalid response format", details: parsedData.error },
          { status: 400 }
        );
      }
    } else {
      throw new Error("No function call in response");
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
