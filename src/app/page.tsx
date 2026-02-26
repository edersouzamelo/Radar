"use client"

import { useTenders } from "@/contexts/tenders-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatAssistant } from "@/components/chat-assistant";
import {
  Gavel,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";

export default function Dashboard() {
  const { tenders } = useTenders();

  // Cálculos de métricas dinâmicas
  const totalTenders = tenders.length;
  const cancelledCount = tenders.filter(t => t.status.startsWith('CANCELADO')).length;
  const completedCount = tenders.filter(t => t.status === 'HOMOLOGADO').length;
  const inProgressCount = totalTenders - cancelledCount - completedCount;
  const issuesCount = tenders.filter(t => t.status === 'FASE INTERNA - CORREÇÕES PARA PUBLICAÇÃO' || t.hasIssues).length;

  // Obter atualizações recentes
  const recentUpdates = [...tenders]
    .flatMap(t => (t.updates || []).map(u => ({ ...u, tender: t })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Categorias Detalhadas para a barra lateral
  const statusCategories = [
    { label: 'Interna: OMDS', match: (s: string) => s === 'FASE INTERNA NA OMDS' },
    { label: 'Interna: SAL', match: (s: string) => s === 'FASE INTERNA NA SAL' },
    { label: 'Interna: IRP', match: (s: string) => s === 'FASE INTERNA - IRP' },
    { label: 'Interna: CJU', match: (s: string) => s === 'FASE INTERNA NA CJU' },
    { label: 'Interna: Correções', match: (s: string) => s === 'FASE INTERNA - CORREÇÕES PARA PUBLICAÇÃO' },
    { label: 'Externa: Edital Publicado', match: (s: string) => s === 'FASE EXTERNA - EDITAL PUBLICADO' },
    { label: 'Externa: Sessão/Lances', match: (s: string) => s.includes('EXTERNA') && !s.includes('EDITAL') },
    { label: 'Homologados', match: (s: string) => s === 'HOMOLOGADO' },
    { label: 'Cancelados/Suspensos', match: (s: string) => s.startsWith('CANCELADO') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-radar-dark dark:text-radar-cream flex items-baseline gap-2">
          Dashboard
          <span className="text-xs font-normal text-muted-foreground opacity-50">v1.3.0</span>
        </h1>
      </div>

      {/* Main Grid: Chat on Left, Stats on Right */}
      <div className="grid gap-6 md:grid-cols-12 items-start">

        {/* Lado Esquerdo: Chat Assistant IA (ocupa toda a altura disponível e metade esquerda/mais larga) */}
        <div className="md:col-span-7 flex flex-col h-full">
          <ChatAssistant />
        </div>

        {/* Lado Direito: Cards de Métricas e Status dos Pregões */}
        <div className="md:col-span-5 flex flex-col gap-6">

          {/* Cards de Métricas em 2x2 */}
          <div className="grid gap-4 grid-cols-2">
            <Card className="bg-white dark:bg-slate-900 border-none shadow-sm border-l-4 border-l-radar-dark dark:border-l-radar-dark hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Total de Pregões
                </CardTitle>
                <Gavel className="h-4 w-4 text-radar-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalTenders}</div>
                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                  Catálogo completo na base
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-none shadow-sm border-l-4 border-l-radar-gold dark:border-l-radar-gold hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Em Andamento
                </CardTitle>
                <Clock className="h-4 w-4 text-radar-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{inProgressCount}</div>
                <p className="text-[10px] text-amber-600 font-medium mt-1">
                  Exclui homologados
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-none shadow-sm border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Homologados
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{completedCount}</div>
                <p className="text-[10px] text-green-600 font-medium mt-1">
                  Processos com sucesso
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-none shadow-sm border-l-4 border-l-slate-400 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Cancelados
                </CardTitle>
                <XCircle className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{cancelledCount}</div>
                <p className="text-[10px] text-slate-500 font-medium mt-1">
                  Suspensos ou revogados
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status dos Pregões */}
          <Card className="flex-1 rounded-[1.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-none shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-slate-900 dark:text-white">
              <Gavel className="w-32 h-32 -rotate-12" />
            </div>
            <CardHeader className="relative z-10 pb-4 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                Status dos Pregões
                <span className="text-[10px] bg-radar-gold/10 text-radar-gold px-2 py-0.5 rounded-full font-bold">Detalhado</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 pt-6">
              <div className="space-y-5">
                {statusCategories.map((cat) => {
                  const count = tenders.filter(t => cat.match(t.status)).length;
                  const percentage = totalTenders > 0 ? (count / totalTenders) * 100 : 0;

                  if (count === 0 && !cat.label.includes('Interna')) return null;

                  return (
                    <div key={cat.label} className="space-y-1.5 group">
                      <div className="flex items-center justify-between text-xs px-1">
                        <div className="font-semibold text-slate-600 dark:text-slate-300 group-hover:text-radar-gold transition-colors tracking-tight">{cat.label}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{Math.round(percentage)}%</span>
                          <div className="text-slate-900 dark:text-white font-black text-sm">{count}</div>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 border-none">
                        <div
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-1000",
                            cat.label.includes('Interna') ? "bg-rose-500" :
                              cat.label.includes('Externa') ? "bg-radar-gold" :
                                cat.label.includes('Homologados') ? "bg-green-500" : "bg-slate-400"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
                <span>Total Monitorado</span>
                <span className="font-bold text-slate-900 dark:text-white">{totalTenders} processos</span>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

// Helper local para evitar erro de classe condicional se não estiver importado o cn globalmente aqui
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
