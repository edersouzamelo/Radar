"use client"

import Link from "next/link";
import { useTenders } from "@/contexts/tenders-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Eye, Filter } from "lucide-react";

export default function TendersPage() {
    const { tenders } = useTenders();
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Pregões em Monitoramento</h1>
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-slate-900 text-white hover:bg-slate-900/90 h-10 py-2 px-4">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtrar
                </button>
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
                                {tenders.map((tender) => (
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
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/tenders/${tender.id}`}
                                                className="font-medium text-blue-600 hover:underline flex items-center"
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                Detalhes
                                            </Link>
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
