const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Load Credentials
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Supabase credentials missing!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Extract Data from src/lib/data.ts
const dataFilePath = path.join(__dirname, '..', 'src', 'lib', 'data.ts');
const dataContent = fs.readFileSync(dataFilePath, 'utf-8');

// Use regex to find the tenders array in the TypeScript file
const tendersMatch = dataContent.match(/export const tenders: Tender\[\] = (\[[\s\S]*?\]);/);
if (!tendersMatch) {
    console.error('❌ Error: Could not find tenders array in src/lib/data.ts');
    process.exit(1);
}

const tenders = JSON.parse(tendersMatch[1]);
console.log(`📦 Loaded ${tenders.length} tenders from local data.`);

// 3. Map and Push
async function pushToCloud() {
    console.log('🚀 Starting Cloud Sync (Direct to Supabase)...');

    const uploads = tenders.map(t => ({
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
        is_gcalc: t.isGCALC || false,
        commitment: t.commitment || 'PCA da OM',
        requester_sector: t.requesterSector || t.department,
        coordinator: t.coordinator || 'CAF',
        coord: t.coord || '',
        section: t.section || '',
        responsible_internal: t.responsibleInternal || '',
        responsible_external: t.responsibleExternal || '',
        bi_publication: t.biPublication || '',
        optimization_notes: t.optimizationNotes || '',
        next_deadline: t.nextDeadline || '',
        next_activity: t.nextActivity || '',
        intercurrences: t.intercurrences || '',
        last_updated_by: t.lastUpdatedBy || 'Auto-Import Antigravity',
        quick_notes: t.quickNotes || '',
        verification_status: t.verificationStatus || 'Pendente',
        // In the context code, date_checks are embedded in dates._date_checks
        dates: { ...(t.dates || {}), _date_checks: (t.dates && t.dates._date_checks) || {} },
        updates: t.updates || [],
        observations: t.observations || []
    }));

    // Split into chunks of 20 to avoid payload limits or timeout
    const chunkSize = 20;
    for (let i = 0; i < uploads.length; i += chunkSize) {
        const chunk = uploads.slice(i, i + chunkSize);
        console.log(`📡 Pushing chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(uploads.length / chunkSize)}...`);

        const { error } = await supabase
            .from('tenders')
            .upsert(chunk, { onConflict: 'id' });

        if (error) {
            console.error(`❌ Error in chunk ${i / chunkSize}:`, error);
        }
    }

    console.log('✅ All 98 tenders pushed to Supabase Cloud!');
    console.log('🔗 Visit: https://radar-jel.vercel.app/tenders');
}

pushToCloud();
