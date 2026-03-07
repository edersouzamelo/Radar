import { Tender, Pregoeiro } from "@/types";

export function generateVisualReport(tenders: Tender[], pregoeiros: Pregoeiro[]) {
    const now = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const getPregoeiroName = (id?: string) => {
        if (!id || id === 'none') return 'A definir';
        return pregoeiros.find(p => p.id === id)?.name || 'Desconhecido';
    };

    const getStatusColor = (status: string) => {
        if (status === 'PLANEJADO') return '#64748b'; // Slate gray
        if (status.includes('HOMOLOGADO')) return '#10b981';
        if (status.includes('CANCELADO') || status.includes('ABANDONADO')) return '#ef4444';
        if (status.includes('FASE EXTERNA')) return '#3b82f6';
        return '#f59e0b';
    };

    const dateDisplayNames: Record<string, string> = {
        'protocoloSetorRequisitante.defined': 'Prazo SAL',
        'protocoloSetorRequisitante.executed': 'Entrega SAL',
        'cjuSendDeadline': 'Envio CJU',
        'cjuReturnDate': 'Regresso CJU',
        'publicationAdjustmentsDeadline': 'Ajustes Pub.',
        'publicationDate': 'Publicação',
        'proposalOpeningDate': 'Sessão Pública',
        'homologationForecast': 'Prev. Homol.',
        'homologationDeadline': 'Prazo Homol.',
        'minutesSignatureDeadline': 'Assin. Atas',
        'vigenciaAnterior': 'Vigência Ant.',
        'prazoGCALC': 'Prazo GCALC'
    };

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Pregões - Dev Radar</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                
                body {
                    font-family: 'Inter', sans-serif;
                    color: #1e293b;
                    margin: 0;
                    padding: 40px;
                    background: #fff;
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }

                .logo-section h1 {
                    margin: 0;
                    color: #1e293b;
                    font-size: 24px;
                    letter-spacing: -0.025em;
                }

                .logo-section p {
                    margin: 5px 0 0;
                    color: #64748b;
                    font-size: 14px;
                }

                .date {
                    text-align: right;
                    font-size: 12px;
                    color: #94a3b8;
                }

                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    margin-bottom: 40px;
                }

                .summary-card {
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                }

                .summary-card h3 {
                    margin: 0;
                    font-size: 12px;
                    text-transform: uppercase;
                    color: #64748b;
                    letter-spacing: 0.05em;
                }

                .summary-card p {
                    margin: 10px 0 0;
                    font-size: 24px;
                    font-weight: 700;
                    color: #0f172a;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11px;
                }

                th {
                    text-align: left;
                    background: #f1f5f9;
                    padding: 12px;
                    font-weight: 600;
                    color: #475569;
                    border-bottom: 2px solid #e2e8f0;
                }

                td {
                    padding: 12px;
                    border-bottom: 1px solid #f1f5f9;
                    vertical-align: top;
                }

                .status-badge {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 10px;
                    color: #fff;
                }

                .nup {
                    font-family: monospace;
                    font-size: 10px;
                    color: #64748b;
                }

                .pregoeiro {
                    font-weight: 600;
                    color: #334155;
                }

                @media print {
                    body { padding: 0; }
                    .summary-card { background: #fff !important; }
                    button { display: none; }
                }

                .print-btn {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    background: #1e293b;
                    color: #fff;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 99px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo-section">
                    <h1>Sitema Radar - Relatório Executivo</h1>
                    <p>Monitoramento de Processos de Licitação</p>
                </div>
                <div class="date">
                    Gerado em<br><strong>${now}</strong>
                </div>
            </div>

            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Total de Processos</h3>
                    <p>${tenders.length}</p>
                </div>
                <div class="summary-card">
                    <h3>Em Fase Externa</h3>
                    <p>${tenders.filter(t => t.status.includes('FASE EXTERNA')).length}</p>
                </div>
                <div class="summary-card">
                    <h3>Homologados</h3>
                    <p>${tenders.filter(t => t.status === 'HOMOLOGADO').length}</p>
                </div>
                <div class="summary-card">
                    <h3>Planejados/Cancelados</h3>
                    <p>${tenders.filter(t => t.status === 'PLANEJADO' || t.status.includes('CANCELADO') || t.status === 'ABANDONADO').length}</p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 80px">Pregão</th>
                        <th style="width: 250px">Objeto / NUP</th>
                        <th style="width: 150px">Status</th>
                        <th>Compromisso</th>
                        <th>Coordenador</th>
                        <th>Requisitante</th>
                        <th>Datas Registradas</th>
                    </tr>
                </thead>
                <tbody>
                    ${tenders.map(t => {
        const checks = t.dates?._date_checks || {};
        const dateFields = [
            { label: 'Publicação', date: t.dates?.publicationDate, ok: !!checks['publicationDate'] },
            { label: 'Sessão', date: t.dates?.proposalOpeningDate, ok: !!checks['proposalOpeningDate'] },
            { label: 'Homologação', date: t.dates?.homologationDeadline, ok: !!checks['homologationDeadline'] }
        ];

        return `
                            <tr>
                                <td><strong>${t.number}</strong><br><small style="color:#94a3b8">${t.uasg}</small></td>
                                <td>
                                    <div style="font-weight: 600">${t.description}</div>
                                    <div class="nup">${t.nup || 'N/A'}</div>
                                </td>
                                <td>
                                    <span class="status-badge" style="background: ${getStatusColor(t.status)}">
                                        ${t.status}
                                    </span>
                                </td>
                                <td>${t.commitment || 'N/A'}</td>
                                <td>${t.coordinator || 'N/A'}</td>
                                <td>${t.requesterSector || 'N/A'}</td>
                                <td style="font-size: 9px">
                                    ${(() => {
                const checks = t.dates?._date_checks || {};
                const allDates: { label: string, date: string, key: string }[] = [];
                if (t.dates) {
                    Object.entries(t.dates).forEach(([key, value]) => {
                        if (typeof value === 'string' && value && key !== '_date_checks') {
                            allDates.push({ label: dateDisplayNames[key] || key, date: value, key });
                        } else if (typeof value === 'object' && value !== null) {
                            Object.entries(value).forEach(([subKey, subValue]) => {
                                if (typeof subValue === 'string' && subValue) {
                                    const fullKey = `${key}.${subKey}`;
                                    allDates.push({ label: dateDisplayNames[fullKey] || fullKey, date: subValue, key: fullKey });
                                }
                            });
                        }
                    });
                }
                return allDates.length > 0 ? allDates.map(df => {
                    const isOk = !!checks[df.key];
                    return `
                                            <div style="margin-bottom: 2px">
                                                <strong>${df.label}:</strong> ${new Date(df.date).toLocaleDateString('pt-BR')} 
                                                <span style="color: ${isOk ? '#10b981' : '#f59e0b'}; font-weight: bold">
                                                    [${isOk ? 'OK' : 'PENDENTE'}]
                                                </span>
                                            </div>
                                        `;
                }).join('') : '<span style="color:#94a3b8; font-style: italic">Sem datas</span>';
            })()}
                                </td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>

            <button class="print-btn" onclick="window.print()">Imprimir PDF</button>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    }
}
