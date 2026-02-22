"use client"

import Link from "next/link";
import { notFound } from "next/navigation";
import { useTenders } from "@/contexts/tenders-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditTenderModal } from "@/components/edit-tender-modal";
import { ObservationModal } from "@/components/observation-modal";
import { ArrowLeft, Calendar, DollarSign, Building2, AlertCircle, CheckCircle2, User, Users, ClipboardCheck, Info, Lightbulb, History, Zap } from "lucide-react";
import { use } from "react";

export default function TenderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { tenders } = useTenders();
    const tender = tenders.find((t) => t.id === id);

    if (!tender) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <h1 className="text-2xl font-bold">Pregão não encontrado</h1>
                <Link href="/tenders" className="text-blue-500 hover:underline">
                    Voltar para a lista
                </Link>
            </div>
        );
    }

    // Ordenar atualizações da mais recente para a mais antiga
    const sortedUpdates = [...tender.updates].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-6">
            {/* Cabeçalho e Navegação */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/tenders" className="p-2 hover:bg-muted rounded-full">
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            Pregão {tender.number}
                            <Badge variant={
                                tender.status === 'HOMOLOGADO' ? 'secondary' :
                                    tender.status.startsWith('CANCELADO') || tender.status === 'ABANDONADO' ? 'destructive' :
                                        'outline'
                            }>
                                {tender.status === 'HOMOLOGADO' ? 'Homologado' :
                                    tender.status.startsWith('CANCELADO') || tender.status === 'ABANDONADO' ? 'Encerrado' : 'Em Andamento'}
                            </Badge>
                            {tender.isGCALC && (
                                <Badge variant="warning" className="bg-radar-gold text-radar-dark">
                                    GCALC
                                </Badge>
                            )}
                        </h1>
                        <p className="text-sm text-muted-foreground">UASG: {tender.uasg} • {tender.department}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <EditTenderModal tender={tender} />
                    <ObservationModal tender={tender} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Coluna Principal: Detalhes e Linha do Tempo */}
                <div className="md:col-span-2 space-y-6">
                    {/* Tabela de Prazos */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Controle de Prazos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs uppercase bg-muted">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Etapa</th>
                                            <th className="px-4 py-3 text-left">Prazo Definido</th>
                                            <th className="px-4 py-3 text-left">Prazo Executado</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        <tr className="hover:bg-muted/50">
                                            <td className="px-4 py-3 font-medium">Protocolo Setor Requisitante</td>
                                            <td className="px-4 py-3">{tender.dates?.protocoloSetorRequisitante?.defined ? new Date(tender.dates.protocoloSetorRequisitante.defined).toLocaleDateString('pt-BR') : '-'}</td>
                                            <td className="px-4 py-3">{tender.dates?.protocoloSetorRequisitante?.executed ? new Date(tender.dates.protocoloSetorRequisitante.executed).toLocaleDateString('pt-BR') : '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                {tender.dates?.protocoloSetorRequisitante?.executed ?
                                                    <CheckCircle2 className="h-5 w-5 text-green-500 inline" /> :
                                                    <AlertCircle className="h-5 w-5 text-gray-400 inline" />
                                                }
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-muted/50">
                                            <td className="px-4 py-3 font-medium">Fase Interna SALC → CJU</td>
                                            <td className="px-4 py-3">{tender.dates?.faseInternaSALC?.defined ? new Date(tender.dates.faseInternaSALC.defined).toLocaleDateString('pt-BR') : '-'}</td>
                                            <td className="px-4 py-3">{tender.dates?.faseInternaSALC?.executed ? new Date(tender.dates.faseInternaSALC.executed).toLocaleDateString('pt-BR') : '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                {tender.dates?.faseInternaSALC?.executed ?
                                                    <CheckCircle2 className="h-5 w-5 text-green-500 inline" /> :
                                                    <AlertCircle className="h-5 w-5 text-gray-400 inline" />
                                                }
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-muted/50">
                                            <td className="px-4 py-3 font-medium">Retorno da CJU</td>
                                            <td className="px-4 py-3">{tender.dates?.retornoCJU?.estimated ? new Date(tender.dates.retornoCJU.estimated).toLocaleDateString('pt-BR') : '-'}</td>
                                            <td className="px-4 py-3">{tender.dates?.retornoCJU?.occurred ? new Date(tender.dates.retornoCJU.occurred).toLocaleDateString('pt-BR') : '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                {tender.dates?.retornoCJU?.occurred ?
                                                    <CheckCircle2 className="h-5 w-5 text-green-500 inline" /> :
                                                    <AlertCircle className="h-5 w-5 text-gray-400 inline" />
                                                }
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-muted/50">
                                            <td className="px-4 py-3 font-medium">Ajustes até Publicação</td>
                                            <td className="px-4 py-3">{tender.dates?.ajustesPublicacao?.defined ? new Date(tender.dates.ajustesPublicacao.defined).toLocaleDateString('pt-BR') : '-'}</td>
                                            <td className="px-4 py-3">{tender.dates?.ajustesPublicacao?.executed ? new Date(tender.dates.ajustesPublicacao.executed).toLocaleDateString('pt-BR') : '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                {tender.dates?.ajustesPublicacao?.executed ?
                                                    <CheckCircle2 className="h-5 w-5 text-green-500 inline" /> :
                                                    <AlertCircle className="h-5 w-5 text-gray-400 inline" />
                                                }
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-muted/50">
                                            <td className="px-4 py-3 font-medium">Início Sessão Pública</td>
                                            <td className="px-4 py-3">{tender.dates?.inicioSessaoPublica?.defined ? new Date(tender.dates.inicioSessaoPublica.defined).toLocaleDateString('pt-BR') : '-'}</td>
                                            <td className="px-4 py-3">{tender.dates?.inicioSessaoPublica?.executed ? new Date(tender.dates.inicioSessaoPublica.executed).toLocaleDateString('pt-BR') : '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                {tender.dates?.inicioSessaoPublica?.executed ?
                                                    <CheckCircle2 className="h-5 w-5 text-green-500 inline" /> :
                                                    <AlertCircle className="h-5 w-5 text-gray-400 inline" />
                                                }
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-muted/50">
                                            <td className="px-4 py-3 font-medium">Homologação</td>
                                            <td className="px-4 py-3">{tender.dates?.homologacao?.defined ? new Date(tender.dates.homologacao.defined).toLocaleDateString('pt-BR') : '-'}</td>
                                            <td className="px-4 py-3">{tender.dates?.homologacao?.executed ? new Date(tender.dates.homologacao.executed).toLocaleDateString('pt-BR') : '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                {tender.dates?.homologacao?.executed ?
                                                    <CheckCircle2 className="h-5 w-5 text-green-500 inline" /> :
                                                    <AlertCircle className="h-5 w-5 text-gray-400 inline" />
                                                }
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            {(tender.dates?.vigenciaAnterior || tender.dates?.prazoGCALC) && (
                                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                                    {tender.dates?.vigenciaAnterior && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Vigência Pregão Anterior</p>
                                            <p className="text-sm font-bold">{new Date(tender.dates.vigenciaAnterior).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    )}
                                    {tender.dates?.prazoGCALC && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Prazo GCALC</p>
                                            <p className="text-sm font-bold text-radar-gold">{new Date(tender.dates.prazoGCALC).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Otimização e Intercorrências */}
                    {(tender.optimizationNotes || tender.intercurrences) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {tender.optimizationNotes && (
                                <Card className="border-radar-gold/30 bg-radar-gold/5">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <Lightbulb className="h-4 w-4 text-radar-gold" />
                                            O que pode ser otimizado?
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm italic text-muted-foreground whitespace-pre-wrap">
                                            {tender.optimizationNotes}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                            {tender.intercurrences && (
                                <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-700 dark:text-red-400">
                                            <Zap className="h-4 w-4" />
                                            Intercorrências / Notas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-red-600 dark:text-red-300 whitespace-pre-wrap font-medium">
                                            {tender.intercurrences}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* Observações */}
                    {tender.observations && tender.observations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Observações</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {tender.observations.map((obs) => (
                                        <div key={obs.id} className="border-l-4 border-radar-gold pl-4 py-2">
                                            <p className="text-sm text-foreground">{obs.content}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Por <span className="font-medium">{obs.author}</span> em {new Date(obs.date).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Histórico de Eventos */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Eventos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative border-l border-border ml-3 space-y-8 pb-4">
                                {sortedUpdates.map((update) => (
                                    <div key={update.id} className="mb-8 ml-6 relative">
                                        <span className={`absolute -left-[37px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${update.type === 'alert' ? 'bg-red-500' :
                                            update.type === 'warning' ? 'bg-amber-500' :
                                                update.type === 'success' ? 'bg-green-500' :
                                                    'bg-blue-500'
                                            }`}>
                                        </span>
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
                                            <h3 className="text-base font-semibold text-foreground">{update.description}</h3>
                                            <time className="block mb-1 text-sm font-normal leading-none text-muted-foreground sm:order-last sm:mb-0">
                                                {new Date(update.date).toLocaleDateString('pt-BR')} às {new Date(update.date).toLocaleTimeString('pt-BR')}
                                            </time>
                                        </div>
                                        <p className="mb-4 text-sm font-normal text-muted-foreground">
                                            Registrado por: <span className="font-medium text-foreground">{update.author}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Coluna Lateral: Metadados */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalhes do Processo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start">
                                <Building2 className="w-5 h-5 text-muted-foreground mr-3 mt-1" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Objeto</p>
                                    <p className="text-sm text-foreground">{tender.description}</p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <Calendar className="w-5 h-5 text-muted-foreground mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Data de Abertura</p>
                                    <p className="text-sm text-foreground">
                                        {new Date(tender.openingDate).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <DollarSign className="w-5 h-5 text-muted-foreground mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Valor Estimado</p>
                                    <p className="text-sm text-foreground">
                                        {tender.estimatedValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <AlertCircle className={`w-5 h-5 mr-3 ${tender.hasIssues ? 'text-red-500' : 'text-muted-foreground'}`} />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Intercorrências</p>
                                    <p className={`text-sm ${tender.hasIssues ? 'text-red-600 font-bold' : 'text-foreground'}`}>
                                        {tender.hasIssues ? 'Sim - Requer Atenção' : 'Nenhuma pendente'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-radar-gold/50 shadow-md">
                        <CardHeader className="bg-radar-gold/10">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <ClipboardCheck className="h-4 w-4" />
                                Gestão e Próximos Passos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="flex items-start">
                                <User className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Resp. Fase Interna</p>
                                    <p className="text-sm font-bold">{tender.responsibleInternal || "Não definido"}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <Users className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Pregoeiro / Fase Externa</p>
                                    <p className="text-sm font-bold text-radar-gold">{tender.responsibleExternal || "Não definido"}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <History className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Publicação em BI</p>
                                    <p className="text-sm font-bold">{tender.biPublication || "Aguardando"}</p>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-radar-dark text-radar-cream rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Info className="h-4 w-4 text-radar-gold" />
                                    <p className="text-xs font-bold uppercase tracking-wider">Próxima Atividade</p>
                                </div>
                                <p className="text-sm font-medium">{tender.nextActivity || "Aguardando"}</p>
                                {tender.nextDeadline && (
                                    <div className="mt-2 text-xs border-t border-radar-gold/30 pt-1">
                                        Prazo Limite: <span className="text-radar-gold font-bold">{
                                            tender.nextDeadline.includes('-')
                                                ? new Date(tender.nextDeadline).toLocaleDateString('pt-BR')
                                                : tender.nextDeadline
                                        }</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
