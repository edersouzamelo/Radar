"use client"

import Link from "next/link";
import { useTenders } from "@/contexts/tenders-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Eye, Filter, Search } from "lucide-react";
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

export default function TendersPage() {
    const { tenders, searchQuery, statusFilter, setStatusFilter } = useTenders();

    const filteredTenders = tenders.filter(tender => {
        const matchesSearch =
            tender.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tender.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tender.uasg.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || tender.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Pregões em Monitoramento</h1>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="border-radar-dark text-radar-dark hover:bg-radar-dark/5">
                            <Filter className="mr-2 h-4 w-4" />
                            Status: {statusFilter === "all" ? "Todos" :
                                statusFilter === "active" ? "Ativo" :
                                    statusFilter === "completed" ? "Concluído" : "Suspenso"}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white dark:bg-slate-950 border-radar-gold w-48">
                        <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setStatusFilter("all")}>Todos</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("active")}>Ativo</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("completed")}>Concluído</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("suspended")}>Suspenso</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Todos os Processos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Pregão / UASG</th>
                                    <th scope="col" className="px-6 py-3">Objeto</th>
                                    <th scope="col" className="px-6 py-3">Departamento</th>
                                    <th scope="col" className="px-6 py-3">Data Abertura</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3">Fase Atual</th>
                                    <th scope="col" className="px-6 py-3">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTenders.map((tender) => (
                                    <tr key={tender.id} className="bg-card border-b hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                                            {tender.number}
                                            <br />
                                            <span className="text-xs text-muted-foreground">UASG {tender.uasg}</span>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate" title={tender.description}>
                                            {tender.description}
                                        </td>
                                        <td className="px-6 py-4">
                                            {tender.department}
                                        </td>
                                        <td className="px-6 py-4">
                                            {new Date(tender.openingDate).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={
                                                tender.status === 'active' ? 'info' :
                                                    tender.status === 'completed' ? 'success' :
                                                        tender.status === 'suspended' ? 'destructive' :
                                                            'secondary'
                                            }>
                                                {tender.status === 'active' ? 'Ativo' :
                                                    tender.status === 'completed' ? 'Concluído' :
                                                        tender.status === 'suspended' ? 'Suspenso' : 'Pendente'}
                                            </Badge>
                                            {tender.hasIssues && (
                                                <Badge variant="warning" className="ml-2">!</Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {tender.currentStage}
                                        </td>
                                        <td className="px-6 py-4 flex items-center space-x-3">
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
