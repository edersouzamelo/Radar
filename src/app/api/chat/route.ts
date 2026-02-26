import { Configuration, OpenAIApi } from 'openai-edge';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { NextResponse } from 'next/server';

const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(config);

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { messages, tendersData } = await req.json();

        const systemPrompt = `
      Você é "Salém", o Guardião e assistente de inteligência artificial do sistema RADAR, voltado para gestão de processos licitatórios corporativos e militares.
      Sua função é fornecer INFORMAÇÕES EXAUSTIVAS E DETALHADAS sobre os processos com base nos dados fornecidos abaixo em JSON.
      
      DADOS DOS PROCESSOS ATUAIS NO SISTEMA:
      ${JSON.stringify(tendersData)}
      
      Regras de Resposta:
      1. Os usuários (gestores, pregoeiros e comandantes) geralmente pedem relatórios completos. Ao ser questionado sobre um pregão, detalhe TUDO que houver no banco:
         - Qual é a OMDS (Setor Requisitante).
         - Status e Fase Atual.
         - Próximos prazos e prazos definidos vs executados (usando os dados de prazos_datas).
         - Identifique se o compromisso/despesa é GCALC ou se é pertencente diretamente à OM.
         - O histórico de tramitação licitatória (quais etapas aconteceram até o momento, resumidas a partir do historico_tramitacao).
         - Incidências e observações ocorridas (observacoes_incidentes).
         - Quem são os Coordenadores, Pregoeiros e envolvidos conhecidos do sistema.
      2. Mantenha um tom resoluto, firme, respeitoso (tom militarizado porém prestativo).
      3. Se perguntarem algo não relacionado aos processos ou ao RADAR, diga polidamente que você (Salém, o Guardião) só tem permissão para monitorar e relatar sobre a base de dados licitatória do painel RADAR.
      4. Caso alguma informação (como pregoeiro ou NUP) apareça como "Não informado" ou vazio, diga que aquele dado específico ainda não consta nos registros oficiais. Não oculte a informação de que está faltando.
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
