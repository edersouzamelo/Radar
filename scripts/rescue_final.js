const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runRescue() {
    console.log('🚑 Resgate de Emergência RADAR v3.0...');

    // 1. Env
    const envContent = fs.readFileSync('.env.local', 'utf-8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) env[key.trim()] = value.join('=').trim();
    });
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // 2. Data.ts Parsing (Extreme Robust Edition)
    const dataContent = fs.readFileSync('src/lib/data.ts', 'utf-8');
    const startIdx = dataContent.indexOf(' tenders: Tender[] = [') + ' tenders: Tender[] = '.length;
    const endIdx = dataContent.lastIndexOf('];') + 1;
    const tendersPart = dataContent.substring(startIdx, endIdx);

    // Eval is safe here because we isolated the literal
    const localTenders = eval(`(${tendersPart})`);
    console.log(`📦 Carregados ${localTenders.length} pregões do arquivo local.`);

    // 3. Team Map
    const { data: team } = await supabase.from('team_members').select('id, name');
    const teamMap = new Map(team.map(m => [m.name.toLowerCase().trim(), m.id]));

    const findId = (name) => {
        if (!name) return null;
        const clean = name.toLowerCase().trim();
        for (let [mName, mId] of teamMap.entries()) {
            if (mName.includes(clean) || clean.includes(mName)) return mId;
        }
        return null;
    };

    // 4. Cloud Merge Data
    const { data: cloudTenders } = await supabase.from('tenders').select('id, quick_notes, verification_status, observations');
    const cloudMap = new Map(cloudTenders?.map(t => [t.id, t]) || []);

    // 5. Build Upload
    const uploads = localTenders.map(t => {
        const existing = cloudMap.get(t.id);

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
            is_gcalc: t.isGCALC || (t.commitment === 'GCALC'),
            commitment: t.commitment || (t.isGCALC ? 'GCALC' : 'PCA da OM'),
            requester_sector: t.requesterSector || t.department,
            coordinator: t.coordinator || 'CAF',
            coord: t.coord || '',
            section: t.section || '',
            bi_publication: t.biPublication || '',
            optimization_notes: t.optimizationNotes || '',
            next_deadline: t.nextDeadline || '',
            next_activity: t.nextActivity || '',
            intercurrences: t.intercurrences || '',
            last_updated_by: 'RESCUE V3',
            // --- PROTECTED ---
            quick_notes: (existing && existing.quick_notes) ? existing.quick_notes : (t.quickNotes || ''),
            verification_status: (existing && existing.verification_status && existing.verification_status !== 'Pendente') ? existing.verification_status : (t.verificationStatus || 'Pendente'),
            // --- RECOVERY ---
            pregoeiro_fase_interna_id: findId(t.responsibleInternal) || findId(t.responsibleExternal),
            pregoeiro_fase_externa_id: findId(t.responsibleExternal) || findId(t.responsibleInternal),
            observations: (existing && existing.observations && existing.observations.length > (t.observations?.length || 0)) ? existing.observations : (t.observations || []),
            dates: t.dates || {},
            updates: t.updates || []
        };
    });

    // 6. Push
    for (let i = 0; i < uploads.length; i += 50) {
        const chunk = uploads.slice(i, i + 50);
        await supabase.from('tenders').upsert(chunk, { onConflict: 'id' });
        console.log(`✅ Sincronizados ${i + chunk.length}/${uploads.length}`);
    }
    console.log('🚀 MISSÃO CUMPRIDA! SISTEMA RESTAURADO.');
}

runRescue().catch(console.error);
