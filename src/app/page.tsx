import { tenders } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateTenderModal } from "@/components/create-tender-modal";
import {
  Gavel,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight
} from "lucide-react";

export default function Dashboard() {
  // Cálculos de métricas
  const totalTenders = tenders.length;
  const activeTenders = tenders.filter(t => t.status !== 'HOMOLOGADO').length;
  const issuesCount = tenders.filter(t => t.hasIssues || t.status === 'CORREÇÕES PARA PUBLICAÇÃO').length;
  const completedTenders = tenders.filter(t => t.status === 'HOMOLOGADO').length;

  // Obter atualizações recentes
  const recentUpdates = tenders
    .flatMap(t => t.updates.map(u => ({ ...u, tender: t })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-radar-dark dark:text-radar-cream">
          Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <CreateTenderModal />
          <div className="flex items-center space-x-2 text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span>Atualizado agora</span>
          </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-radar-dark">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Total de Pregões
            </CardTitle>
            <Gavel className="h-5 w-5 text-radar-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalTenders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +2 novos esta semana
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-radar-gold">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Em Andamento
            </CardTitle>
            <Clock className="h-5 w-5 text-radar-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{activeTenders}</div>
            <p className="text-xs text-gray-400 mt-1">
              Aguardando ações
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Intercorrências
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{issuesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requerem atenção
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Concluídos
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{completedTenders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Neste exercício
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção Principal: Tabela Recente e Atividades */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">

        {/* Atividades Recentes */}
        <Card className="col-span-4 rounded-[2rem]">
          <CardHeader>
            <CardTitle>Atualizações em Tempo Real</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentUpdates.map((update, idx) => (
                <div key={idx} className="flex items-start group">
                  <div className={`mt-1 h-3 w-3 rounded-full ring-2 ring-offset-2 ${update.type === 'alert' ? 'bg-red-500 ring-red-100 dark:ring-red-900' :
                    update.type === 'warning' ? 'bg-radar-gold ring-radar-beige dark:ring-yellow-900' :
                      update.type === 'success' ? 'bg-green-500 ring-green-100 dark:ring-green-900' :
                        'bg-radar-dark ring-gray-100 dark:ring-gray-800'
                    }`} />
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-bold text-foreground leading-none">
                      {update.tender.number} - {update.tender.department}
                    </p>
                    <p className="text-sm text-muted-foreground group-hover:text-radar-gold transition-colors">
                      {update.description}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {new Date(update.date).toLocaleDateString('pt-BR')} às {new Date(update.date).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status dos Pregões */}
        <Card className="col-span-3 rounded-[2rem] bg-radar-dark text-radar-cream">
          <CardHeader>
            <CardTitle className="text-radar-cream">Status dos Pregões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {['Edital Publicado', 'Disputa', 'Julgamento', 'Homologação'].map((stage) => {
                const count = tenders.filter(t => t.currentStage === stage).length;
                const percentage = (count / totalTenders) * 100;
                return (
                  <div key={stage} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-medium text-radar-cream">{stage}</div>
                      <div className="text-radar-gold font-bold">{count}</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-radar-gold"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
