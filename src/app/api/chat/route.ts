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
        const { messages, tendersData, teamData } = await req.json();

        const systemPrompt = `
      Você é "Salém", o Guardião e assistente de inteligência artificial do sistema RADAR, voltado para gestão de processos licitatórios corporativos e militares.
      Sua função hoje foi AMPLIADA. Além de conhecer todos os processos licitatórios, você agora tem total consciência das equipes (Membros do Setor Requisitante, Pregoeiros e Supervisores) e suas referidas funções ou cargas de trabalho.
      
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
