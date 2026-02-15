/**
 * Utilitário para geração de documentos oficiais (SPED, Relatórios, etc.)
 */

export interface SpedDocumentData {
    tenderNumber: string;
    uasg: string;
    openingDate: string;
    responsible: string;
    status: string;
}

/**
 * Gera um arquivo de texto formatado conforme o template SPED (Placeholder)
 */
export const generateSpedDocument = (data: SpedDocumentData[]) => {
    let content = "REGISTRO DE AUDITORIA DAS DESPESAS E AQUISIÇÕES REALIZADAS (RADAR)\n";
    content += "DOCUMENTO SPED - CONTROLE DE PRAZOS DOS PREGÕES\n";
    content += "------------------------------------------------------------------\n";
    content += `Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n\n`;

    data.forEach(item => {
        content += `PREGÃO Nº: ${item.tenderNumber} (UASG: ${item.uasg})\n`;
        content += `RESPONSÁVEL: ${item.responsible}\n`;
        content += `ABERTURA: ${new Date(item.openingDate).toLocaleDateString('pt-BR')}\n`;
        content += `STATUS ATUAL: ${item.status}\n`;
        content += `PRAZOS CRÍTICOS (30/5/0 dias): \n`;
        // Adicionar lógica de cálculo de prazos aqui futuramente
        content += `------------------------------------------------------------------\n`;
    });

    content += "\n\nAssinatura do Chefe da SALC: ___________________________\n";

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SPED_Controle_Prazos_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
