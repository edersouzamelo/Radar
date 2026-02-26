import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usando require porque pdf-parse causa erro de default export em módulo ESM
const pdf = require('pdf-parse');

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

async function getEmbedding(text: string) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            input: text.replace(/\n/g, ' '),
            model: 'text-embedding-ada-002'
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data[0].embedding;
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
            const pdfData = await pdf(buffer);
            extractedText = pdfData.text;
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

        // 4. Generate Embeddings and Save to Supabase
        // Process in batches to avoid rate limits or memory issues
        const insertedChunks = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunkContent = chunks[i];
            const embedding = await getEmbedding(chunkContent);

            const { data, error } = await supabase
                .from('tender_document_chunks')
                .insert({
                    tender_id: tenderId,
                    file_id: fileId,
                    content: chunkContent,
                    embedding: embedding
                });

            if (error) {
                console.error("Supabase Insert Error:", error);
                throw new Error("Falha ao salvar chunk no banco.");
            }

            insertedChunks.push({ id: i });
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
