"use client"

import { useTenders } from "@/contexts/tenders-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateTenderModal } from "@/components/create-tender-modal";
import {
  Gavel,
  AlertTriangle,
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
        <div className="flex items-center gap-4">
          <CreateTenderModal />
          <div className="flex items-center space-x-2 text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span>Dados em Tempo Real</span>
          </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-radar-dark hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Total de Pregões
            </CardTitle>
            <Gavel className="h-4 w-4 text-radar-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalTenders}</div>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              Catálogo completo na base
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-radar-gold hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Em Andamento
            </CardTitle>
            <Clock className="h-4 w-4 text-radar-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{inProgressCount}</div>
            <p className="text-[10px] text-amber-600 font-medium mt-1">
              Exclui homologados e cancelados
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Homologados
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{completedCount}</div>
            <p className="text-[10px] text-green-600 font-medium mt-1">
              Processos com sucesso
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-400 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Cancelados
            </CardTitle>
            <XCircle className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{cancelledCount}</div>
            <p className="text-[10px] text-slate-500 font-medium mt-1">
              Suspensos ou revogados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Atividades Recentes */}
        <Card className="col-span-4 rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-radar-gold" />
              Atualizações em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentUpdates.length > 0 ? recentUpdates.map((update, idx) => (
                <div key={idx} className="flex items-start group relative pl-4 border-l-2 border-slate-100 dark:border-slate-800 ml-2">
                  <div className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ring-4 ring-white dark:ring-slate-900 ${update.type === 'alert' ? 'bg-red-500' :
                    update.type === 'warning' ? 'bg-radar-gold' :
                      update.type === 'success' ? 'bg-green-500' :
                        'bg-blue-500'
                    }`} />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground leading-none flex items-center gap-2">
                      {update.tender.number}
                      <span className="text-[10px] font-normal text-muted-foreground px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded">
                        {update.tender.requesterSector || update.tender.department}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground group-hover:text-radar-gold transition-colors pr-4">
                      {update.description}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tighter">
                      {new Date(update.date).toLocaleDateString('pt-BR')} • {new Date(update.date).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-muted-foreground italic text-sm">
                  Nenhuma atualização recente registrada.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status dos Pregões (O CORAÇÃO DO DASHBOARD) */}
        <Card className="col-span-3 rounded-[1.5rem] bg-radar-dark text-radar-cream border-none shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Gavel className="w-32 h-32 -rotate-12" />
          </div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-radar-cream flex items-center gap-2">
              Status dos Pregões
              <span className="text-[10px] bg-radar-gold/20 text-radar-gold px-2 py-0.5 rounded-full">Detalhado</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-5">
              {statusCategories.map((cat) => {
                const count = tenders.filter(t => cat.match(t.status)).length;
                const percentage = totalTenders > 0 ? (count / totalTenders) * 100 : 0;

                if (count === 0 && !cat.label.includes('Interna')) return null; // Ocultar se zero, exceto fase interna

                return (
                  <div key={cat.label} className="space-y-1.5 group">
                    <div className="flex items-center justify-between text-xs px-1">
                      <div className="font-semibold text-radar-cream/90 group-hover:text-radar-gold transition-colors tracking-tight">{cat.label}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-radar-cream/40 font-mono">{Math.round(percentage)}%</span>
                        <div className="text-radar-gold font-black text-sm">{count}</div>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/5 border border-white/5">
                      <div
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-1000",
                          cat.label.includes('Interna') ? "bg-rose-500" :
                            cat.label.includes('Externa') ? "bg-radar-gold" :
                              cat.label.includes('Homologados') ? "bg-green-500" : "bg-slate-500"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center text-[11px] text-radar-cream/50">
              <span>Total Monitorado</span>
              <span className="font-bold text-radar-cream">{totalTenders} processos</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper local para evitar erro de classe condicional se não estiver importado o cn globalmente aqui
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
