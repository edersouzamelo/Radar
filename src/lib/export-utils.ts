import { Tender } from "@/types";

export function exportTendersToCSV(tenders: Tender[], userName: string) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');

    // Headers
    const headers = [
        "ID", "Número", "UASG", "Objeto", "Departamento", "Seção", "Status", "Fase Atual", "Responsável Interno", "Abertura", "GCALC"
    ];

    // Data rows
    const rows = tenders.map(t => [
        t.id,
        t.number,
        t.uasg,
        `"${t.description.replace(/"/g, '""')}"`,
        t.department,
        t.section || "",
        t.status,
        t.currentStage,
        t.responsibleInternal || "",
        t.openingDate,
        t.isGCALC ? "SIM" : "NÃO"
    ]);

    // Metadata
    const metadata = [
        [],
        ["RELATÓRIO DE EXPORTAÇÃO DO SISTEMA RADAR"],
        [`Exportado por: ${userName}`],
        [`Data da Exportação: ${dateStr}`],
        [`Hora da Exportação: ${timeStr}`],
        [`Total de Registros: ${tenders.length}`]
    ];

    const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(",")),
        ...metadata.map(m => m.join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `radar_export_${now.getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
