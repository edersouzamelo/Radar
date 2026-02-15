"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { tenders } from "@/lib/data"
import { format, isSameDay, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"

export default function AgendaPage() {
    const [date, setDate] = useState<Date | undefined>(new Date())

    // Encontrar dias com eventos
    const eventDays = tenders.map(t => parseISO(t.openingDate))

    // Pregões no dia selecionado
    const selectedTenders = date
        ? tenders.filter(t => isSameDay(parseISO(t.openingDate), date))
        : []

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground border-b pb-4 border-border">
                Agenda de Licitações
            </h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle>Calendário</CardTitle>
                        <CardDescription>
                            Visualize as datas de abertura dos pregões.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            locale={ptBR}
                            className="rounded-md border shadow"
                            modifiers={{
                                event: eventDays
                            }}
                            modifiersStyles={{
                                event: { fontWeight: 'bold', textDecoration: 'underline', color: 'var(--primary)' }
                            }}
                        />
                    </CardContent>
                </Card>

                <Card className="md:col-span-4">
                    <CardHeader>
                        <CardTitle>
                            Eventos para {date ? format(date, "d 'de' MMMM", { locale: ptBR }) : "selecione uma data"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedTenders.length > 0 ? (
                            <div className="space-y-4">
                                {selectedTenders.map(tender => (
                                    <div key={tender.id} className="flex flex-col space-y-2 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-foreground">{tender.number}</span>
                                            <Badge variant={
                                                tender.hasIssues ? 'alert' :
                                                    tender.status === 'active' ? 'warning' :
                                                        tender.status === 'completed' ? 'success' : 'default'
                                            }>
                                                {tender.currentStage}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">{tender.description}</p>
                                        <div className="flex justify-between text-xs text-gray-500 pt-2 border-t mt-2">
                                            <span>{tender.department}</span>
                                            <span>R$ {(tender.estimatedValue ?? 0).toLocaleString('pt-BR')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                                <p>Nenhum pregão agendado para esta data.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
