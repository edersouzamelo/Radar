"use client"

import Link from "next/link";
import { useTenders } from "@/contexts/tenders-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Eye, Filter, Search, Download } from "lucide-react";
import { EditTenderModal } from "@/components/edit-tender-modal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/contexts/user-context";
export default function TendersPage() {
    const {
        tenders,
        searchQuery,
        statusFilter,
        setStatusFilter,
        nupFilter,
        setNupFilter,
        commitmentFilter,
        setCommitmentFilter,
        coordinatorFilter,
        setCoordinatorFilter,
        requesterSectorFilter,
        setRequesterSectorFilter,
        updateTender
    } = useTenders();
    const { role } = useUser();

    const handleExport = () => {
        const headers = [
            'ID', 'Número', 'UASG', 'Descrição', 'Status', 'NUP',
            'Compromisso', 'Coordenador', 'Setor Requisitante',
            'Abertura', 'Valor Estimado'
        ];

        const csvContent = [
            headers.join(','),
            ...tenders.map(t => [
                t.id,
                t.number,
                t.uasg,
                `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
                t.status,
                t.nup || '',
                t.commitment || '',
                t.coordinator || '',
                t.requesterSector || '',
                t.openingDate,
                t.estimatedValue || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'pregoes_radar.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredTenders = tenders.filter(tender => {
        const matchesSearch =
            tender.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tender.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tender.uasg.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || tender.status === statusFilter;
        const matchesNup = nupFilter === "" || (tender.nup && tender.nup.includes(nupFilter));
        const matchesCommitment = commitmentFilter === "all" || tender.commitment === commitmentFilter;
        const matchesCoordinator = coordinatorFilter === "all" || tender.coordinator === coordinatorFilter;
        const matchesRequesterSector = requesterSectorFilter === "all" || tender.requesterSector === requesterSectorFilter;

        return matchesSearch && matchesStatus && matchesNup && matchesCommitment && matchesCoordinator && matchesRequesterSector;
    });

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground mr-4">Pregões em Monitoramento</h1>

                    {/* NUP Filter */}
                    <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Filtrar NUP..."
                            className="h-8 text-xs border rounded px-2 bg-background"
                            value={nupFilter}
                            onChange={(e) => setNupFilter(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Export Button */}
                    <Button
                        variant="outline"
                        className="h-8 text-xs border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        onClick={handleExport}
                    >
                        <Download className="mr-2 h-3 w-3" />
                        Extrair Planilha
                    </Button>

                    {/* Commitment Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-8 text-xs border-dashed">
                                Compromisso: {commitmentFilter === "all" ? "Todos" : commitmentFilter}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white dark:bg-slate-950">
                            <DropdownMenuItem onClick={() => setCommitmentFilter("all")}>Todos</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCommitmentFilter("GCALC")}>GCALC</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCommitmentFilter("PCA da OM")}>PCA da OM</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCommitmentFilter("Operação Perseu")}>Operação Perseu</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCommitmentFilter("Outros")}>Outros</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Coordinator Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-8 text-xs border-dashed">
                                Coord: {coordinatorFilter === "all" ? "Todos" : coordinatorFilter}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white dark:bg-slate-950">
                            <DropdownMenuItem onClick={() => setCoordinatorFilter("all")}>Todos</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCoordinatorFilter("CAF")}>CAF</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCoordinatorFilter("CCOL")}>CCOL</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCoordinatorFilter("9º B Sup")}>9º B Sup</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCoordinatorFilter("A definir")}>A definir</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Requester Sector Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-8 text-xs border-dashed">
                                Setor: {requesterSectorFilter === "all" ? "Todos" : requesterSectorFilter}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white dark:bg-slate-950">
                            <DropdownMenuItem onClick={() => setRequesterSectorFilter("all")}>Todos</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRequesterSectorFilter("9º B Mnt")}>9º B Mnt</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRequesterSectorFilter("9º B Sup")}>9º B Sup</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRequesterSectorFilter("18º B Trnp")}>18º B Trnp</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRequesterSectorFilter("Cia Cmdo")}>Cia Cmdo</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRequesterSectorFilter("9º B Sau")}>9º B Sau</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRequesterSectorFilter("Cmdo 9º Gpt")}>Cmdo 9º Gpt</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRequesterSectorFilter("A definir")}>A definir</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Status Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-8 text-xs border-radar-dark text-radar-dark hover:bg-radar-dark/5">
                                <Filter className="mr-2 h-3 w-3" />
                                Status: {statusFilter === "all" ? "Todos" : statusFilter}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white dark:bg-slate-950 border-radar-gold w-56">
                            <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setStatusFilter("all")}>Todos</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("FASE INTERNA NA OMDS")}>FASE INTERNA NA OMDS</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("FASE INTERNA NA SAL")}>FASE INTERNA NA SAL</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("FASE INTERNA NA CJU")}>FASE INTERNA NA CJU</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("CORREÇÕES PARA PUBLICAÇÃO")}>CORREÇÕES PARA PUBLICAÇÃO</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("EDITAL PUBLICADO")}>EDITAL PUBLICADO</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("FASE EXTERNA")}>FASE EXTERNA</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("HOMOLOGADO")}>HOMOLOGADO</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Card className="flex flex-col flex-1 overflow-hidden">
                <CardHeader className="shrink-0">
                    <CardTitle>Todos os Processos</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 relative min-h-0">
                    <div className="absolute inset-0 overflow-auto force-scrollbar border rounded-lg">
                        <table className="w-full text-xs text-left text-gray-500 min-w-[2000px]">
                            <thead className="text-[10px] text-muted-foreground uppercase bg-white dark:bg-gray-950 border-b sticky top-0 z-50 shadow-sm">
                                <tr>
                                    <th scope="col" className="px-3 py-2">Pregão / UASG</th>
                                    <th scope="col" className="px-3 py-2">Objeto</th>
                                    <th scope="col" className="px-3 py-2">NUP</th>
                                    <th scope="col" className="px-3 py-2">Compromisso</th>
                                    <th scope="col" className="px-3 py-2">Coordenador</th>
                                    <th scope="col" className="px-3 py-2">Setor Requisitante</th>
                                    <th scope="col" className="px-3 py-2">Prazo de envio à SAL</th>
                                    <th scope="col" className="px-3 py-2">Data de entrega efetiva na SAL</th>
                                    <th scope="col" className="px-3 py-2">Prazo de envio à CJU</th>
                                    <th scope="col" className="px-3 py-2">Data de regresso da CJU</th>
                                    <th scope="col" className="px-3 py-2">Prazo de ajustes para publicação</th>
                                    <th scope="col" className="px-3 py-2">Data de publicação</th>
                                    <th scope="col" className="px-3 py-2">Data de abertura e julgamento das propostas</th>
                                    <th scope="col" className="px-3 py-2">Previsão interna de homologação</th>
                                    <th scope="col" className="px-3 py-2">Prazo de homologação</th>
                                    <th scope="col" className="px-3 py-2">Prazo de assinatura das atas</th>
                                    <th scope="col" className="px-3 py-2">Vigência do último certame</th>
                                    <th scope="col" className="px-3 py-2">Prazo do GCALC</th>
                                    <th scope="col" className="px-3 py-2">Status</th>

                                    <th scope="col" className="px-3 py-2">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTenders.map((tender) => (
                                    <tr key={tender.id} className="bg-card border-b hover:bg-muted/50 transition-colors">
                                        <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">
                                            {tender.number}
                                            <br />
                                            <span className="text-[10px] text-muted-foreground">UASG {tender.uasg}</span>
                                        </td>
                                        <td className="px-3 py-2 max-w-xs truncate" title={tender.description}>
                                            {tender.description}
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                className="bg-transparent border-none focus:ring-0 p-0 text-xs w-[130px] dark:text-gray-300 disabled:opacity-50"
                                                placeholder="NUP..."
                                                disabled={role !== 'Chefe da Seção de Licitações'}
                                                value={tender.nup || ''}
                                                onChange={(e) => {
                                                    // Allow only numbers and typical NUP characters if desired, but user said "editá-los" freely.
                                                    // Let's keep it open text for now or simple restriction if needed.
                                                    // User said "17 algarismos", let's suggest max length but not strict mask yet unless requested.
                                                    updateTender(tender.id, { nup: e.target.value })
                                                }}
                                                maxLength={25} // Enough for formatting
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <Select
                                                disabled={role !== 'Chefe da Seção de Licitações'}
                                                value={tender.commitment || 'Outros'}
                                                onValueChange={(value) => updateTender(tender.id, { commitment: value as any })}
                                            >
                                                <SelectTrigger className="w-[160px] h-8 text-xs bg-white dark:bg-slate-900 border-radar-dark/20 text-left justify-start px-2">
                                                    <SelectValue placeholder="Selecione" className="text-left" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-950 border-radar-dark/20 z-[9999]">
                                                    <SelectItem value="GCALC">GCALC</SelectItem>
                                                    <SelectItem value="PCA da OM">PCA da OM</SelectItem>
                                                    <SelectItem value="Operação Perseu">Operação Perseu</SelectItem>
                                                    <SelectItem value="Outros">Outros</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="px-3 py-2">
                                            <Select
                                                disabled={role !== 'Chefe da Seção de Licitações'}
                                                value={tender.coordinator || 'A definir'}
                                                onValueChange={(value) => updateTender(tender.id, { coordinator: value as any })}
                                            >
                                                <SelectTrigger className="w-[120px] h-8 text-xs bg-white dark:bg-slate-900 border-radar-dark/20 text-left justify-start px-2">
                                                    <SelectValue placeholder="Selecione" className="text-left" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-950 border-radar-dark/20 z-[9999]">
                                                    <SelectItem value="CAF">CAF</SelectItem>
                                                    <SelectItem value="CCOL">CCOL</SelectItem>
                                                    <SelectItem value="9º B Sup">9º B Sup</SelectItem>
                                                    <SelectItem value="A definir">A definir</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="px-3 py-2">
                                            <Select
                                                disabled={role !== 'Chefe da Seção de Licitações'}
                                                value={tender.requesterSector || 'A definir'}
                                                onValueChange={(value) => updateTender(tender.id, { requesterSector: value as any })}
                                            >
                                                <SelectTrigger className="w-[120px] h-8 text-xs bg-white dark:bg-slate-900 border-radar-dark/20 text-left justify-start px-2">
                                                    <SelectValue placeholder="Selecione" className="text-left" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-950 border-radar-dark/20 z-[9999]">
                                                    <SelectItem value="9º B Mnt">9º B Mnt</SelectItem>
                                                    <SelectItem value="9º B Sup">9º B Sup</SelectItem>
                                                    <SelectItem value="18º B Trnp">18º B Trnp</SelectItem>
                                                    <SelectItem value="Cia Cmdo">Cia Cmdo</SelectItem>
                                                    <SelectItem value="9º B Sau">9º B Sau</SelectItem>
                                                    <SelectItem value="Cmdo 9º Gpt">Cmdo 9º Gpt</SelectItem>
                                                    <SelectItem value="A definir">A definir</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>

                                        <td className="px-3 py-2">
                                            <input
                                                type="date"
                                                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full dark:text-gray-300 disabled:opacity-50"
                                                disabled={role !== 'Chefe da Seção de Licitações'}
                                                value={tender.dates?.protocoloSetorRequisitante?.defined || ''}
                                                onChange={(e) => updateTender(tender.id, {
                                                    dates: {
                                                        ...tender.dates,
                                                        protocoloSetorRequisitante: {
                                                            ...tender.dates?.protocoloSetorRequisitante,
                                                            defined: e.target.value
                                                        }
                                                    }
                                                })}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="date"
                                                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full dark:text-gray-300 disabled:opacity-50"
                                                disabled={role !== 'Chefe da Seção de Licitações'}
                                                value={tender.dates?.protocoloSetorRequisitante?.executed || ''}
                                                onChange={(e) => updateTender(tender.id, {
                                                    dates: {
                                                        ...tender.dates,
                                                        protocoloSetorRequisitante: {
                                                            ...tender.dates?.protocoloSetorRequisitante,
                                                            executed: e.target.value
                                                        }
                                                    }
                                                })}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="date"
                                                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full dark:text-gray-300 disabled:opacity-50"
                                                disabled={role !== 'Chefe da Seção de Licitações'}
                                                value={tender.dates?.cjuSendDeadline || ''}
                                                onChange={(e) => updateTender(tender.id, { dates: { ...tender.dates, cjuSendDeadline: e.target.value } })}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="date"
                                                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full dark:text-gray-300 disabled:opacity-50"
                                                disabled={role !== 'Chefe da Seção de Licitações'}
                                                value={tender.dates?.cjuReturnDate || ''}
                                                onChange={(e) => updateTender(tender.id, { dates: { ...tender.dates, cjuReturnDate: e.target.value } })}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="date"
                                                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full dark:text-gray-300 disabled:opacity-50"
                                                disabled={role !== 'Chefe da Seção de Licitações'}
                                                value={tender.dates?.publicationAdjustmentsDeadline || ''}
                                                onChange={(e) => updateTender(tender.id, { dates: { ...tender.dates, publicationAdjustmentsDeadline: e.target.value } })}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="date"
                                                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full dark:text-gray-300 disabled:opacity-50"
                                                disabled={role !== 'Chefe da Seção de Licitações'}
                                                value={tender.dates?.publicationDate || ''}
                                                onChange={(e) => updateTender(tender.id, { dates: { ...tender.dates, publicationDate: e.target.value } })}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="date"
                                                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full dark:text-gray-300 disabled:opacity-50"
                                                disabled={role !== 'Chefe da Seção de Licitações'}
                                                value={tender.dates?.proposalOpeningDate || ''}
                                                onChange={(e) => updateTender(tender.id, { dates: { ...tender.dates, proposalOpeningDate: e.target.value } })}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="date"
                                                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full dark:text-gray-300 disabled:opacity-50"
                                                disabled={role !== 'Chefe da Seção de Licitações'}
                                                value={tender.dates?.homologationForecast || ''}
                                                onChange={(e) => updateTender(tender.id, { dates: { ...tender.dates, homologationForecast: e.target.value } })}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="date"
                                                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full dark:text-gray-300 disabled:opacity-50"
                                                disabled={role !== 'Chefe da Seção de Licitações'}
                                                value={tender.dates?.homologationDeadline || ''}
                                                onChange={(e) => updateTender(tender.id, { dates: { ...tender.dates, homologationDeadline: e.target.value } })}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="date"
                                                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full dark:text-gray-300 disabled:opacity-50"
                                                disabled={role !== 'Chefe da Seção de Licitações'}
                                                value={tender.dates?.minutesSignatureDeadline || ''}
                                                onChange={(e) => updateTender(tender.id, { dates: { ...tender.dates, minutesSignatureDeadline: e.target.value } })}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="date"
                                                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full dark:text-gray-300 disabled:opacity-50"
                                                disabled={role !== 'Chefe da Seção de Licitações'}
                                                value={tender.dates?.vigenciaAnterior || ''}
                                                onChange={(e) => updateTender(tender.id, { dates: { ...tender.dates, vigenciaAnterior: e.target.value } })}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="date"
                                                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full dark:text-gray-300 disabled:opacity-50"
                                                disabled={role !== 'Chefe da Seção de Licitações'}
                                                value={tender.dates?.prazoGCALC || ''}
                                                onChange={(e) => updateTender(tender.id, { dates: { ...tender.dates, prazoGCALC: e.target.value } })}
                                            />
                                        </td>
                                        <td className="px-3 py-2">

                                            <Select
                                                disabled={role !== 'Chefe da Seção de Licitações'}
                                                value={tender.status}
                                                onValueChange={(value) => updateTender(tender.id, { status: value as any })}
                                            >
                                                <SelectTrigger className={`w-[180px] h-8 text-xs border-radar-dark/20 text-left justify-start px-2 ${tender.status === 'HOMOLOGADO' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    tender.status === 'FASE EXTERNA' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        tender.status === 'CORREÇÕES PARA PUBLICAÇÃO' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                            'bg-white dark:bg-slate-900'
                                                    }`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-950 border-radar-dark/20 z-[9999]">
                                                    <SelectItem value="FASE INTERNA NA OMDS">FASE INTERNA NA OMDS</SelectItem>
                                                    <SelectItem value="FASE INTERNA NA SAL">FASE INTERNA NA SAL</SelectItem>
                                                    <SelectItem value="FASE INTERNA NA CJU">FASE INTERNA NA CJU</SelectItem>
                                                    <SelectItem value="CORREÇÕES PARA PUBLICAÇÃO">CORREÇÕES PARA PUBLICAÇÃO</SelectItem>
                                                    <SelectItem value="EDITAL PUBLICADO">EDITAL PUBLICADO</SelectItem>
                                                    <SelectItem value="FASE EXTERNA">FASE EXTERNA</SelectItem>
                                                    <SelectItem value="HOMOLOGADO">HOMOLOGADO</SelectItem>
                                                </SelectContent>
                                            </Select>

                                        </td>

                                        <td className="px-3 py-2 flex items-center space-x-3">
                                            <Link
                                                href={`/tenders/${tender.id}`}
                                                className="font-medium text-blue-600 hover:underline flex items-center"
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                Detalhes
                                            </Link>
                                            <EditTenderModal tender={tender} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
