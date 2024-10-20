import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);



// Argument: pdfUrl
// Returns: { success: true, apiResponse: { ... } }

export async function POST(request: NextRequest) {
  try {
    const { pdfUrl } = await request.json();
    // Download the PDF
    const pdfResponse = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
    const pdfBuffer = Buffer.from(pdfResponse.data);

    const pdfDoc = await PDFDocument.load(pdfBuffer);

    const newPdfDoc = await PDFDocument.create();

    // Process each page
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      const pageBuffer = await extractPageBuffer(pdfDoc, i);
      
      const hasReferences = await checkForReferences(pageBuffer);

      if (!hasReferences) {
        // Copy non-reference pages to the new PDF
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
        newPdfDoc.addPage(copiedPage);
      }
    }

    // Save the new PDF without reference pages
    const pdfBytes = await newPdfDoc.save();
    
    // Convert to base64
    const base64Pdf = Buffer.from(pdfBytes).toString('base64');

    return NextResponse.json({ success: true, pdf: base64Pdf });
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ success: false, error: 'Failed to process PDF' }, { status: 500 });
  }
}

async function extractPageBuffer(pdfDoc: PDFDocument, pageIndex: number): Promise<Uint8Array> {
  const newPdfDoc = await PDFDocument.create();
  const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageIndex]);
  newPdfDoc.addPage(copiedPage);
  return await newPdfDoc.save();
}

async function checkForReferences(pageBuffer: Uint8Array): Promise<boolean> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const result = await model.generateContent([
    "Is this page a reference page? (one of the pages in the PDF that soley contains references) Answer with just 'yes' or 'no'.",
    { inlineData: { data: Buffer.from(pageBuffer).toString('base64'), mimeType: "application/pdf" } },
  ]);
  const response = await result.response;
  console.log("Response:", response.text());
  return response.text().toLowerCase().trim().includes('yes');
}
