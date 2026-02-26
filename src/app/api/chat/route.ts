import { Configuration, OpenAIApi } from 'openai-edge';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(config);

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { messages, tendersData, teamData } = await req.json();

        // 1. Extração do RAG Vectorial
        const lastMessage = messages[messages.length - 1];
        let ragContext = "";

        if (lastMessage && lastMessage.role === 'user') {
            try {
                // Gera embedding da pergunta
                const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        input: lastMessage.content.replace(/\n/g, ' '),
                        model: 'text-embedding-ada-002'
                    })
                });

                if (embeddingResponse.ok) {
                    const embeddingResult = await embeddingResponse.json();
                    const queryEmbedding = embeddingResult.data[0].embedding;

                    // Filtrar por ID de pregão se for no mini-chat (tendersData tem length 1)
                    const specificTenderId = (tendersData && tendersData.length === 1 && tendersData[0].id)
                        ? tendersData[0].id
                        : null;

                    // Busca vetorial
                    const { data: chunks, error } = await supabase.rpc('match_document_chunks', {
                        query_embedding: queryEmbedding,
                        match_threshold: 0.70, // 70% de similaridade mínima
                        match_count: 6,
                        p_tender_id: specificTenderId
                    });

                    if (!error && chunks && chunks.length > 0) {
                        ragContext = chunks.map((c: any) => c.content).join("\n\n---\n\n");
                    }
                }
            } catch (ragError) {
                console.error("Erro no fluxo de RAG Vectors:", ragError);
            }
        }

        const systemPrompt = `
      Você é "Salém", o Guardião e assistente de inteligência artificial do sistema RADAR, voltado para gestão de processos licitatórios corporativos e militares.
      Sua função hoje foi AMPLIADA. Além de conhecer todos os processos licitatórios, você agora tem total consciência das equipes (Membros do Setor Requisitante, Pregoeiros e Supervisores) e suas referidas funções ou cargas de trabalho.
      
      ${ragContext ? `
      ============ DADOS RAG (ARQUIVOS DO SISTEMA) ============
      Abaixo estão trechos de PDFs e Documentos oficiais (Editais, Termos de Referência) enviados pelos usuários ao banco de dados:
      """
      ${ragContext}
      """
      Se a pergunta do usuário puder ser respondida usando os trechos acima, USE ESSAS INFORMAÇÕES e cite que encontrou nos arquivos anexados.
      =========================================================
      ` : ''}

      DADOS DOS PROCESSOS ATUAIS NO SISTEMA:
      ${JSON.stringify(tendersData)}

      DADOS DA EQUIPE E SEUS CARGOS (PESSOAL / SUPERVISÃO / PREGOEIROS):
      ${JSON.stringify(teamData || {})}
      
      Regras de Resposta:
      1. Os usuários (gestores, pregoeiros e comandantes) geralmente pedem relatórios completos sobre os processos ou sobre a carga de trabalho do time.
      2. Se perguntarem "quem é o pregoeiro mais sobrecarregado", cruze ambas as bases: conte quantas vezes cada pregoeiro aparece iterado/atrelado aos processos na base de DADOS DOS PROCESSOS, e relacione com os nomes que estão nos DADOS DA EQUIPE.
      3. Caso alguma informação (como pregoeiro ou NUP) apareça como "Não informado" ou vazio nos processos, diga que aquele dado específico ainda não consta nos registros oficiais.
      4. Mantenha um tom resoluto, firme, respeitoso (tom militarizado porém prestativo).
      5. Se perguntarem algo não relacionado aos processos, a equipe ou ao RADAR, diga polidamente que você (Salém, o Guardião) só tem permissão para monitorar e relatar sobre a base de dados licitatória e de pessoal do painel RADAR.
    `;

        const response = await openai.createChatCompletion({
            model: 'gpt-4o-mini',
            stream: true,
            temperature: 0.1,
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages.map((m: any) => ({
                    role: m.role,
                    content: m.content
                })),
            ],
        });

        const stream = OpenAIStream(response);
        return new StreamingTextResponse(stream);
    } catch (error) {
        console.error('Erro no Chat API:', error);
        return NextResponse.json({ error: 'Falha ao processar solicitação da IA.' }, { status: 500 });
    }
}
