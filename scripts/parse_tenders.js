const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../import/data.csv');
const outputPath = path.join(__dirname, '../src/lib/data.ts');

const content = fs.readFileSync(csvPath, 'utf8');

function splitCSV(content) {
    const result = [];
    let row = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                cell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            row.push(cell.trim());
            cell = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++;
            row.push(cell.trim());
            if (row.length > 0) result.push(row);
            row = [];
            cell = '';
        } else {
            cell += char;
        }
    }
    if (row.length > 0 || cell) {
        row.push(cell.trim());
        result.push(row);
    }
    return result;
}

function parseDate(dateStr) {
    if (!dateStr) return undefined;
    const clean = dateStr.replace(/✔️|ERA|-|🆕.*|\n/g, '').trim();
    if (!clean) return undefined;

    // Catch common patterns
    const match = clean.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (match) {
        let [_, d, m, y] = match;
        if (y.length === 2) y = '20' + y;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return undefined;
}

const rows = splitCSV(content);
const dataRows = rows.slice(3); // Skip header rows

const tenders = dataRows.map((row, idx) => {
    const number = row[0];
    const description = row[1];

    // Ignore rows that are clearly not tenders (too short or empty description)
    if (!description || description.length < 5) return null;

    // Skip header-like rows or empty rows
    if (description.includes('CONTROLE DE LICITAÇÕES') || description.includes('Objeto')) return null;

    const uasg = "122456";
    const isGCALC = (row[2] || '').toLowerCase().includes('sim');
    const coord = row[3];
    const department = row[4];

    const openingDateStr = row[12];
    const openingDate = parseDate(openingDateStr) || '2026-01-01T09:00:00';

    const obs = row[14] || '';
    const status = obs.includes('Homologado') || obs.includes('Concluído') ? 'completed' :
        obs.includes('Suspenso') || obs.includes('Cancelado') || obs.includes('Abandonado') ? 'suspended' : 'active';

    let currentStage = 'Edital Publicado';
    if (obs.includes('Homologação')) currentStage = 'Homologação';
    else if (obs.includes('Habilitação')) currentStage = 'Habilitação';
    else if (obs.includes('Julgamento')) currentStage = 'Julgamento';
    else if (obs.includes('Disputa') || obs.includes('Seção')) currentStage = 'Disputa';
    else if (obs.includes('Fase Interna')) currentStage = 'Edital Publicado';

    const responsibleInternal = row[21];
    const responsibleExternal = row[22];
    const biPublication = row[23];
    const intercurrences = row[24];
    const optimizationNotes = row[25];
    const nextDeadline = row[26];
    const nextActivity = row[27];

    return {
        id: `tender-${(number || 'TBD').replace(/[\/\s\.]/g, '-')}-${idx}`,
        uasg,
        number: number || "A definir",
        description,
        department,
        openingDate: openingDate.includes('T') ? openingDate : `${openingDate}T09:00:00`,
        status,
        currentStage,
        hasIssues: obs.includes('!') || obs.toLowerCase().includes('problema') || obs.toLowerCase().includes('atraso') || obs.includes('🆕'),
        isGCALC,
        coord,
        responsibleInternal,
        responsibleExternal,
        biPublication,
        intercurrences,
        optimizationNotes,
        nextDeadline,
        nextActivity,
        updates: [],
        observations: []
    };
}).filter(t => t !== null);

const tsContent = `import { Tender } from "@/types";

export const tenders: Tender[] = ${JSON.stringify(tenders, null, 4)};
`;

fs.writeFileSync(outputPath, tsContent);
console.log(`Successfully wrote ${tenders.length} tenders to ${outputPath}`);
