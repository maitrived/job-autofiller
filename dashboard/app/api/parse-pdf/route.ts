import { NextRequest, NextResponse } from 'next/server';

// Polyfill for Node 22+
if (typeof global.DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix { constructor() {} };
    (global as any).ImageData = class ImageData { constructor() {} };
    (global as any).Path2D = class Path2D { constructor() {} };
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Load legacy PDF.js gracefully to avoid turbopack ESM strict mode crashes
        const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

        // Disable font face evaluation since we only need raw text
        const loadingTask = pdfjsLib.getDocument({ 
            data: uint8Array,
            disableFontFace: true,
            standardFontDataUrl: `node_modules/pdfjs-dist/standard_fonts/`
        });
        
        const pdfDocument = await loadingTask.promise;
        
        let extractedText = '';
        for (let i = 1; i <= pdfDocument.numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const content = await page.getTextContent();
            extractedText += content.items.map((item: any) => item.str).join(' ') + '\n\n';
        }
        
        return NextResponse.json({ text: extractedText.trim() });
    } catch (e: any) {
        console.error("PDF Parsing Error:", e);
        return NextResponse.json({ error: e.message || 'Server extraction failed' }, { status: 500 });
    }
}
