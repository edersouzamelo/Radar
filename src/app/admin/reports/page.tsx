"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, TrendingUp, Calendar, ShieldCheck } from "lucide-react"
import { useTenders } from "@/contexts/tenders-context"
import { generateSpedDocument, SpedDocumentData } from "@/lib/document-utils"

export default function ReportsPage() {
    const { tenders } = useTenders()

    const handleDownloadSped = () => {
        const data: SpedDocumentData[] = tenders.map(t => ({
            tenderNumber: t.number,
            uasg: t.uasg,
            openingDate: t.openingDate,
            responsible: t.responsibleSector || "SALC / PREGOEIRO",
            status: t.currentPhase || "Em Andamento"
        }))

        generateSpedDocument(data)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-radar-dark tracking-tighter uppercase italic">Módulo de Relatórios</h1>
                    <p className="text-sm text-gray-500">Documentos oficiais e auditoria de prazos.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card SPED - Controle de Prazos */}
                <Card className="border-none shadow-xl bg-white overflow-hidden group hover:ring-2 ring-radar-gold transition-all">
                    <div className="h-2 bg-radar-dark" />
                    <CardHeader>
                        <div className="flex items-center space-x-2 mb-2">
                            <ShieldCheck className="w-5 h-5 text-radar-gold" />
                            <Badge variant="outline" className="text-[9px] uppercase font-black border-radar-dark/20">Auditoria</Badge>
                        </div>
                        <CardTitle className="text-xl font-black text-radar-dark uppercase leading-tight">
                            Controle de Prazos <br /> (SPED)
                        </CardTitle>
                        <CardDescription className="text-xs font-medium uppercase font-sans">
                            Documento oficial para auditoria de cronogramas de pregões ativos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <p className="text-[10px] text-gray-500 font-bold uppercase italic">Conteúdo do Documento:</p>
                            <ul className="mt-2 text-[10px] space-y-1 text-gray-400 font-medium">
                                <li>• UASG e Nº do Pregão</li>
                                <li>• Prazos Críticos (30, 5, 0 dias)</li>
                                <li>• Responsáveis por Setor</li>
                                <li>• Status de abertura oficial</li>
                            </ul>
                        </div>
                        <Button
                            onClick={handleDownloadSped}
                            className="w-full bg-radar-dark text-white hover:bg-black font-black uppercase tracking-tighter shadow-lg group-hover:bg-radar-gold group-hover:text-radar-dark transition-colors"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Gerar Documento SPED
                        </Button>
                    </CardContent>
                </Card>

                {/* Placeholder para Documentos Futuros */}
                <Card className="border-none shadow-lg bg-gray-50/50 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 opacity-60">
                    <TrendingUp className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-[10px] uppercase font-black text-gray-400">Relatório Gerencial</p>
                    <p className="text-[9px] text-gray-400 text-center mt-1">Em desenvolvimento...</p>
                </Card>

                <Card className="border-none shadow-lg bg-gray-50/50 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 opacity-60">
                    <Calendar className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-[10px] uppercase font-black text-gray-400">Cronograma Consolidado</p>
                    <p className="text-[9px] text-gray-400 text-center mt-1">Em desenvolvimento...</p>
                </Card>
            </div>
        </div>
    )
}

function Badge({ children, variant, className }: any) {
    return (
        <span className={`px-2 py-0.5 rounded-full ${variant === 'outline' ? 'border' : 'bg-gray-100'} ${className}`}>
            {children}
        </span>
    )
}
