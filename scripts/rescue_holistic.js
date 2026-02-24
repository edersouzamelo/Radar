const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runRescue() {
    console.log('🚑 Iniciando Resgate Holístico v2.0...');

    // 1. Load Credentials
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) env[key.trim()] = value.join('=').trim();
    });

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // 2. Carregar Equipe para Mapeamento de Nomes -> IDs
    console.log('👥 Mapeando equipe...');
    const { data: team } = await supabase.from('team_members').select('id, name');
    const teamMap = new Map();
    team.forEach(m => {
        teamMap.set(m.name.toLowerCase().trim(), m.id);
    });

    // 3. Carregar Licitações do data.ts (Parsing manual robusto)
    console.log('📖 Lendo data.ts...');
    const dataPath = path.join(__dirname, '..', 'src', 'lib', 'data.ts');
    const dataContent = fs.readFileSync(dataPath, 'utf-8');

    // Buscamos o array de tenders
    const tendersMatch = dataContent.match(/export const tenders: Tender\[\] = (\[[\s\S]*?\]);/);
    if (!tendersMatch) throw new Error('Array de tenders não encontrado no data.ts');

    // Limpeza para Eval Seguro
    let cleanStr = tendersMatch[1]
        .replace(/\/\/.*$/gm, '') // remove comments
        .replace(/,\s*]/g, ']') // remove trailing commas
        .replace(/,\s*}/g, '}');

    let localTenders;
    try {
        localTenders = eval(`(${cleanStr})`);
    } catch (e) {
        console.error('❌ Erro no eval:', e);
        return;
    }

    // 4. Buscar dados atuais do Banco para fazer o MERGE das anotações manuais (Postits)
    console.log('🔍 Buscando dados atuais do banco para merge...');
    const { data: cloudTenders } = await supabase.from('tenders').select('id, quick_notes, verification_status, observations');
    const cloudMap = new Map(cloudTenders?.map(t => [t.id, t]) || []);

    // 5. Preparar Upload
    console.log('🔨 Preparando dados para upload...');
    const uploads = localTenders.map(t => {
        const existing = cloudMap.get(t.id);

        // Helper para achar ID do pregoeiro
        const findId = (name) => {
            if (!name) return null;
            const cleanName = name.toLowerCase().trim();
            // Tenta achar match parcial ou total
            for (let [mName, mId] of teamMap.entries()) {
                if (mName.includes(cleanName) || cleanName.includes(mName)) return mId;
            }
            return null;
        };

        return {
            id: t.id,
            uasg: t.uasg,
            number: t.number,
            nup: t.nup || '',
            description: t.description,
            department: t.department,
            opening_date: t.openingDate,
            estimated_value: t.estimatedValue || 0,
            status: t.status,
            current_stage: t.currentStage,
            has_issues: t.hasIssues || false,
            is_gcalc: t.isGCALC || true, // Prioriza GCALC
            commitment: (t.isGCALC || t.commitment === 'GCALC') ? 'GCALC' : (t.commitment || 'PCA da OM'),
            requester_sector: t.requesterSector || t.department,
            coordinator: t.coordinator || 'CAF',
            coord: t.coord || '',
            section: t.section || '',
            bi_publication: t.biPublication || '',
            optimization_notes: t.optimizationNotes || '',
            next_deadline: t.nextDeadline || '',
            next_activity: t.nextActivity || '',
            intercurrences: t.intercurrences || '',
            last_updated_by: 'IA RESCUE v2',
            // --- PROTEÇÃO DE DADOS MANUAIS ---
            quick_notes: (existing && existing.quick_notes) ? existing.quick_notes : (t.quickNotes || ''),
            verification_status: (existing && existing.verification_status && existing.verification_status !== 'Pendente') ? existing.verification_status : (t.verificationStatus || 'Pendente'),

            // --- RECUPERAÇÃO DE PREGOEIROS (Nomes -> IDs) ---
            pregoeiro_fase_interna_id: findId(t.responsibleInternal) || findId(t.responsibleExternal),
            pregoeiro_fase_externa_id: findId(t.responsibleExternal) || findId(t.responsibleInternal),

            // --- RECUPERAÇÃO DE OBSERVAÇÕES (O array de postits) ---
            observations: (existing && existing.observations && existing.observations.length > (t.observations?.length || 0))
                ? existing.observations
                : (t.observations || []),

            dates: t.dates || {},
            updates: t.updates || []
        };
    });

    // 6. Push em Chunks
    const chunkSize = 20;
    for (let i = 0; i < uploads.length; i += chunkSize) {
        const chunk = uploads.slice(i, i + chunkSize);
        const { error } = await supabase.from('tenders').upsert(chunk, { onConflict: 'id' });
        if (error) console.error(`❌ Erro no chunk ${i}:`, error);
        else console.log(`✅ Chunk ${i + chunk.length} sincronizado.`);
    }

    console.log('🏁 RESGATE CONCLUÍDO! Verifique a página de Pregões.');
}

runRescue();
