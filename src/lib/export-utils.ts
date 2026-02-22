import { Tender, TenderStatus, TenderStage } from "@/types";

export function exportTendersToCSV(tenders: Tender[], userName: string) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');

    // Headers - Versão Completa 2.0
    const headers = [
        "Número", "UASG", "NUP", "Objeto", "Status", "Fase Atual",
        "Compromisso", "Coordenador", "Setor Requisitante",
        "Prazo CJU", "Retorno CJU", "Prazo Ajustes Pub", "Data Pub",
        "Abertura/Julgamento", "Prev Homologação", "Prazo Homologação",
        "Assinatura Atas", "Vigência Ant", "Prazo GCALC",
        "Pregoeiro Interno", "Pregoeiro Externo", "Notas Rápidas",
        "Observações", "Última Atualização", "Atualizado Por"
    ];

    // Data rows
    const rows = tenders.map(t => [
        t.number,
        t.uasg,
        t.nup || "",
        `"${t.description.replace(/"/g, '""')}"`,
        t.status,
        t.currentStage,
        t.commitment || "",
        t.coordinator || "",
        t.requesterSector || "",
        t.dates?.cjuSendDeadline || "",
        t.dates?.cjuReturnDate || "",
        t.dates?.publicationAdjustmentsDeadline || "",
        t.dates?.publicationDate || "",
        t.dates?.proposalOpeningDate || "",
        t.dates?.homologationForecast || "",
        t.dates?.homologationDeadline || "",
        t.dates?.minutesSignatureDeadline || "",
        t.dates?.vigenciaAnterior || "",
        t.dates?.prazoGCALC || "",
        t.pregoeiroFaseInternaId || "", // Nota: Aqui salva o ID, pode ser melhor salvar o nome? Para import é melhor ID ou ambos
        t.pregoeiroFaseExternaId || "",
        `"${(t.quickNotes || "").replace(/"/g, '""')}"`,
        `"${(t.observations || []).map(obs => `[${obs.date}] ${obs.author}: ${obs.content}`).join(" | ").replace(/"/g, '""')}"`,
        t.lastUpdatedAt || "",
        t.lastUpdatedBy || ""
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `radar_backup_completo_${now.getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export async function parseCSVToTenders(csvText: string): Promise<Partial<Tender>[]> {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));

    // Mapeamento de cabeçalhos para suportar Planilha Google e Backup Radar
    const headerMap: Record<string, string> = {
        // Radar -> Google (ou variações)
        "Número": "Número",
        "UASG": "UASG",
        "NUP": "NUP",
        "Objeto": "Descrição",
        "Descrição": "Descrição",
        "Status": "Status",
        "Fase Atual": "Fase Atual",
        "Compromisso": "Compromisso",
        "Coordenador": "Coordenador",
        "Setor Requisitante": "Setor Requisitante",
        "Prazo CJU": "SAL (Prazo)",
        "Retorno CJU": "Regresso CJU",
        "Prazo Ajustes Pub": "Publicação (Prazo)",
        "Data Pub": "Publicação (Efetiva)",
        "Abertura/Julgamento": "Sessão Pública",
        "Sessão Pública": "Sessão Pública",
        "Prev Homologação": "Homologação (Prev)",
        "Prazo Homologação": "Homologação (Prazo)",
        "Assinatura Atas": "Assinatura Atas",
        "Vigência Ant": "Vigência Anterior",
        "Prazo GCALC": "Prazo GCALC",
        "Notas Rápidas": "Quick Notes",
        "Quick Notes": "Quick Notes",
        "Observações": "Observações",
        "Última Atualização": "Última Atualização",
        "Atualizado Por": "Atualizado Por"
    };

    const results: Partial<Tender>[] = [];

    for (let i = 1; i < lines.length; i++) {
        // Regex para lidar com vírgulas dentro de aspas
        const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const cleanValues = values.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').replace(/\r/g, ''));

        const row: any = {};
        headers.forEach((header, index) => {
            row[header] = cleanValues[index];
        });

        // Função auxiliar para buscar valor por qualquer cabeçalho mapeado
        const getValue = (targetKey: string) => {
            // Tenta encontrar o valor usando o nome original do targetKey ou os mapeamentos dele
            if (row[targetKey] !== undefined) return row[targetKey];
            const mappedHeader = Object.keys(headerMap).find(key => key === targetKey);
            if (mappedHeader && row[headerMap[mappedHeader]] !== undefined) {
                return row[headerMap[mappedHeader]];
            }
            return undefined;
        };

        const tender: Partial<Tender> = {
            number: getValue("Número"),
            uasg: getValue("UASG"),
            nup: getValue("NUP"),
            description: getValue("Objeto") || getValue("Descrição"),
            status: (getValue("Status") || "FASE INTERNA NA OMDS") as TenderStatus,
            currentStage: (getValue("Fase Atual") || "1. Entrada do TR na SAL") as TenderStage,
            commitment: getValue("Compromisso"),
            coordinator: getValue("Coordenador"),
            requesterSector: getValue("Setor Requisitante"),
            dates: {
                cjuSendDeadline: getValue("Prazo CJU"),
                cjuReturnDate: getValue("Retorno CJU"),
                publicationAdjustmentsDeadline: getValue("Prazo Ajustes Pub"),
                publicationDate: getValue("Data Pub"),
                proposalOpeningDate: getValue("Abertura/Julgamento"),
                homologationForecast: getValue("Prev Homologação"),
                homologationDeadline: getValue("Prazo Homologação"),
                minutesSignatureDeadline: getValue("Assinatura Atas"),
                vigenciaAnterior: getValue("Vigência Ant"),
                prazoGCALC: getValue("Prazo GCALC"),
            },
            quickNotes: getValue("Notas Rápidas"),
            lastUpdatedAt: getValue("Última Atualização"),
            lastUpdatedBy: getValue("Atualizado Por"),
            observations: getValue("Observações") ? getValue("Observações").split(" | ").filter((obs: string) => obs.trim() !== "").map((obs: string, index: number) => {
                const match = obs.match(/\[(.*?)\] (.*?): (.*)/);
                if (match) {
                    return {
                        id: `imported-obs-${Date.now()}-${index}`,
                        date: match[1],
                        author: match[2],
                        content: match[3]
                    };
                }
                return {
                    id: `imported-obs-raw-${Date.now()}-${index}`,
                    date: new Date().toISOString().split('T')[0],
                    author: "Backup",
                    content: obs
                };
            }) : []
        };

        if (tender.number && tender.number !== "undefined") {
            results.push(tender);
        }
    }

    return results;
}

