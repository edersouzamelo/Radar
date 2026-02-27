import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// We use pdfjs-dist directly for Edge/Serverless compatibility
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Defina o worker local (necessário pelo pdfjs-dist)
// Nota: Em serverless na Vercel o PDF.JS funciona melhor na versão Legacy sem canvas dom dependencies
pdfjsLib.GlobalWorkerOptions.workerSrc = `pdfjs-dist/legacy/build/pdf.worker.js`;

export const maxDuration = 60; // 1 min (Vercel max for Hobby)
export const dynamic = 'force-dynamic';

// Initialize Supabase admin client (requires service role key or anon key depending on your setup)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Chunking configuration
const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;

function chunkText(text: string): string[] {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
        chunks.push(text.slice(i, i + CHUNK_SIZE));
        i += CHUNK_SIZE - CHUNK_OVERLAP;
    }
    return chunks;
}

async function getEmbeddingsBatch(texts: string[]) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            input: texts.map(t => t.replace(/\n/g, ' ')),
            model: 'text-embedding-ada-002'
        })
    });

    if (!response.ok) {
        let errText = await response.text();
        throw new Error(`OpenAI API Error: ${response.status} - ${errText}`);
    }

    const result = await response.json();
    return result.data.map((item: any) => item.embedding);
}

export async function POST(req: Request) {
    try {
        const { fileUrl, tenderId, fileId, fileName } = await req.json();

        if (!fileUrl || !tenderId || !fileId) {
            return NextResponse.json({ error: 'Faltam parâmetros obrigatórios (fileUrl, tenderId, fileId).' }, { status: 400 });
        }

        // 1. Download the file from the public URL
        const response = await fetch(fileUrl);
        if (!response.ok) {
            throw new Error(`Falha ao baixar o arquivo: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let extractedText = '';

        // 2. Extract text (currently assuming PDF, but we can add more logic)
        if (fileName.toLowerCase().endsWith('.pdf')) {
            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
            const pdfDoc = await loadingTask.promise;

            const numPages = pdfDoc.numPages;
            const textPromises = [];

            for (let i = 1; i <= numPages; i++) {
                textPromises.push(
                    pdfDoc.getPage(i).then(page => page.getTextContent())
                );
            }

            const pagesContent = await Promise.all(textPromises);

            extractedText = pagesContent.map(page =>
                page.items.map((item: any) => item.str).join(' ')
            ).join('\n\n');
        } else {
            // Se for TXT ou outro formato de texto simples
            // Seria implementado conversão docx, etc, aqui. 
            // Mas para fallback de texto:
            extractedText = buffer.toString('utf-8');
        }

        // Remove excessive whitespace
        extractedText = extractedText.replace(/\s+/g, ' ').trim();

        if (extractedText.length < 50) {
            return NextResponse.json({ message: 'Texto muito curto ou não extraído do documento.' }, { status: 200 });
        }

        // 3. Chunk text
        const chunks = chunkText(extractedText);

        // 4. Generate Embeddings and Save to Supabase (BATCH)
        const batchSize = 50;
        let totalInserted = 0;

        for (let i = 0; i < chunks.length; i += batchSize) {
            const currentBatch = chunks.slice(i, i + batchSize);
            const embeddings = await getEmbeddingsBatch(currentBatch);

            const documentsToInsert = currentBatch.map((content, idx) => ({
                tender_id: tenderId,
                file_id: fileId,
                content: content,
                embedding: embeddings[idx]
            }));

            const { error } = await supabase
                .from('tender_document_chunks')
                .insert(documentsToInsert);

            if (error) {
                console.error("Supabase Bulk Insert Error:", error);
                throw new Error("Falha ao salvar chunks no banco de vetores.");
            }
            totalInserted += documentsToInsert.length;
        }

        return NextResponse.json({
            success: true,
            message: 'Documento processado com sucesso e adcionado ao banco Vetorial.',
            chunksProcessed: chunks.length
        });

    } catch (error: any) {
        console.error('RAG Process Error:', error);
        return NextResponse.json({ error: error.message || 'Falha interna durante o RAG.' }, { status: 500 });
    }
}
