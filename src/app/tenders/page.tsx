"use client"

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTenders } from "@/contexts/tenders-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Eye, Filter, Search,
    AlertTriangle,
    Save,
    Trash2,
    Plus,
    Undo2,
    Upload,
    CloudDownload,
    Download,
    RefreshCw, Check,
    StickyNote,
    Truck,
    Clock,
    FileText,
    Gavel,
    Trophy,
    XCircle,
    Database,
    X,
    Info,
    LocateFixed
} from "lucide-react";
import { EditTenderModal } from "@/components/edit-tender-modal";
import { CreateTenderModal } from "@/components/create-tender-modal";
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useUser } from "@/contexts/user-context";
import { cn } from "@/lib/utils";
import { exportTendersToCSV, parseCSVToTenders } from "@/lib/export-utils";
import React, { memo, useState, useEffect } from "react";

// Componente de linha memoizado para performance
const TenderRow = memo(({
    tender,
    index,
    role,
    editorName,
    updateTender,
    refreshTender,
    showConferenceColumn,
    conferenceStatuses,
    setConferenceStatus,
    dateChecks,
    toggleDateCheck,
    deleteTender,
    addTenderBelow,
    isHighlighted,
    pregoeiros
}: {
    tender: any,
    index: number,
    role: string,
    editorName: string,
    updateTender: any,
    refreshTender: any,
    showConferenceColumn: boolean,
    conferenceStatuses: any,
    setConferenceStatus: any,
    dateChecks: Record<string, Record<string, boolean>>,
    toggleDateCheck: (tenderId: string, dateKey: string) => void,
    deleteTender: (id: string) => void,
    addTenderBelow: (id: string) => void,
    isHighlighted?: boolean,
    pregoeiros: any[]
}) => {
    // Estados locais para inputs para evitar re-renders globais ao digitar
    const [localNumber, setLocalNumber] = useState(tender.number ?? '');
    const [localUasg, setLocalUasg] = useState(tender.uasg ?? '');
    const [localDescription, setLocalDescription] = useState(tender.description ?? '');
    const [localNup, setLocalNup] = useState(tender.nup ?? '');
    const [localNote, setLocalNote] = useState(tender.quickNotes ?? '');

    // Sincronizar estados locais quando os dados externos mudarem (ex: refresh ou import)
    useEffect(() => {
        setLocalNumber(tender.number ?? '');
        setLocalUasg(tender.uasg ?? '');
        setLocalDescription(tender.description ?? '');
        setLocalNup(tender.nup ?? '');
        setLocalNote(tender.quickNotes ?? '');
    }, [tender.number, tender.uasg, tender.description, tender.nup, tender.quickNotes]);

    const handleBlur = (field: string, value: string) => {
        if (tender[field] !== value) {
            updateTender(tender.id, { [field]: value }, editorName);
        }
    };

    // Helper para cor do Status (Degradê solicitado)
    const getStatusStyles = (status: string) => {
        if (status.startsWith('CANCELADO')) return "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800/50 dark:text-slate-500";
        if (status === 'FASE INTERNA NA OMDS' || status === 'FASE INTERNA NA SAL') return "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400";
        if (status === 'FASE INTERNA - IRP' || status === 'FASE INTERNA NA CJU' || status === 'FASE INTERNA - CORREÇÕES PARA PUBLICAÇÃO') return "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400";
        if (status.startsWith('FASE EXTERNA')) return "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 font-bold";
        if (status === 'HOMOLOGADO') return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 font-extrabold shadow-sm";
        return "bg-white dark:bg-slate-900";
    };

    // Componente visual de Pista de Corrida / Tabuleiro
    const ProgressRaceTrack = ({ currentStatus }: { currentStatus: string }) => {
        const stages = [
            { id: 'interna', label: 'Interna', icon: Clock, color: 'text-rose-500', match: (s: string) => s.includes('INTERNA') },
            { id: 'pub', label: 'Publicado', icon: FileText, color: 'text-amber-500', match: (s: string) => s.includes('EDITAL PUBLICADO') },
            { id: 'externa', label: 'Sessão', icon: Gavel, color: 'text-blue-500', match: (s: string) => s.includes('EXTERNA') && !s.includes('EDITAL') },
            { id: 'final', label: 'Homologado', icon: Trophy, color: 'text-emerald-500', match: (s: string) => s === 'HOMOLOGADO' }
        ];

        const isCancelled = currentStatus.startsWith('CANCELADO') || currentStatus === 'ABANDONADO' || currentStatus.includes('Abandonado');

        return (
            <div className="flex items-center gap-1.5">
                {stages.map((stage, i) => {
                    const isActive = stage.match(currentStatus);
                    const isPast = stages.findIndex(s => s.match(currentStatus)) > i;

                    return (
                        <div key={stage.id} className="flex items-center">
                            <div
                                className={cn(
                                    "p-1 rounded-full border transition-all duration-300",
                                    isCancelled ? "bg-slate-200 border-slate-500 text-slate-800 opacity-60" :
                                        isActive ? `bg-white shadow-md scale-110 border-current ring-2 ring-offset-1 ${stage.color}` :
                                            isPast ? `${stage.color} opacity-40 border-current bg-current/10` :
                                                "bg-slate-50 border-slate-200 text-slate-300 opacity-20"
                                )}
                                title={stage.label}
                            >
                                <stage.icon className="w-3 h-3" />
                            </div>
                            {i < stages.length - 1 && (
                                <div className={cn(
                                    "w-2 h-[1px]",
                                    isCancelled ? "bg-slate-300" :
                                        isPast ? "bg-current opacity-30" : "bg-slate-100"
                                )} />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const handleDateChange = (field: string, subField: string | null, value: string) => {
        if (subField) {
            const currentVal = tender.dates?.[field]?.[subField];
            if (currentVal !== value) {
                updateTender(tender.id, {
                    dates: {
                        ...tender.dates,
                        [field]: {
                            ...tender.dates?.[field],
                            [subField]: value
                        }
                    }
                }, editorName);
            }
        } else {
            const currentVal = tender.dates?.[field];
            if (currentVal !== value) {
                updateTender(tender.id, {
                    dates: {
                        ...tender.dates,
                        [field]: value
                    }
                }, editorName);
            }
        }
    };

    // Helper para cor da data
    const getDateColor = (dateStr: string, isChecked: boolean, isCancelled: boolean) => {
        if (isCancelled) return "text-slate-400 font-normal";
        if (isChecked) return "text-slate-500 font-bold";
        if (!dateStr) return "";

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(dateStr);
        if (isNaN(targetDate.getTime())) return "";

        return targetDate < today
            ? "text-red-600 font-black dark:text-red-400"
            : "text-green-700 font-black dark:text-green-400";
    };

    // Helper para renderizar input de data com check
    const renderDateInput = (field: string, subField: string | null = null) => {
        const val = subField ? tender.dates?.[field]?.[subField] : tender.dates?.[field];
        const dateKey = subField ? `${field}.${subField}` : field;
        const isChecked = dateChecks[tender.id]?.[dateKey] || false;

        return (
            <div className="flex items-center gap-1 group relative">
                <input
                    type="date"
                    className={cn(
                        "bg-transparent border-none focus:ring-0 p-0 text-sm w-[110px] transition-colors font-bold",
                        getDateColor(val, isChecked, isCancelled)
                    )}
                    disabled={role !== 'Chefe da Seção de Licitações' && role !== 'Administrador'}
                    value={val || ''}
                    onChange={(e) => handleDateChange(field, subField, e.target.value)}
                />
                <button
                    disabled={role !== 'Chefe da Seção de Licitações' && role !== 'Administrador'}
                    onClick={() => toggleDateCheck(tender.id, dateKey)}
                    className={cn(
                        "p-0.5 rounded-full transition-all active:scale-95 flex-shrink-0 disabled:cursor-not-allowed",
                        isChecked
                            ? "bg-green-600 text-white shadow-md scale-110"
                            : "bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100"
                    )}
                    title={isChecked ? "Etapa concluída" : "Marcar como concluído"}
                >
                    <Check className={cn("w-3.5 h-3.5", isChecked && "stroke-[3px]")} />
                </button>
            </div>
        );
    };

    const isCancelled = tender.status.startsWith('CANCELADO') || tender.status === 'ABANDONADO' || tender.currentStage.includes('9. Abandonado');

    return (
        <tr
            id={`tender-row-${tender.id}`}
            className={cn(
                "border-b bg-white transition-colors group",
                isHighlighted && "bg-amber-50/50 ring-2 ring-radar-gold ring-inset animate-pulse-subtle",
                isCancelled && "line-through text-slate-400 bg-slate-50/30"
            )}
        >
            <td className="px-3 py-2 text-center font-medium text-muted-foreground w-8">
                {index + 1}
            </td>
            <td className="px-3 py-2 whitespace-nowrap">
                <div className="flex items-center gap-1">
                    <div className="flex flex-col">
                        {tender.lastUpdatedAt ? (
                            <span className="text-xs font-medium text-foreground">
                                {new Date(tender.lastUpdatedAt).toLocaleDateString('pt-BR')}
                            </span>
                        ) : (
                            <span className="text-[10px] text-muted-foreground italic">Sem registro</span>
                        )}
                        {tender.lastUpdatedBy && (
                            <span className="text-[10px] text-muted-foreground">{tender.lastUpdatedBy}</span>
                        )}
                    </div>
                    <button
                        title="Registrar atualização agora"
                        onClick={() => refreshTender(tender.id, editorName)}
                        className="ml-1 p-1 rounded hover:bg-radar-dark/10 text-radar-dark transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" />
                    </button>
                </div>
            </td>
            {showConferenceColumn && (
                <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center">
                        <button
                            disabled={role !== 'Chefe da Seção de Licitações' && role !== 'Administrador'}
                            onClick={() => setConferenceStatus(tender.id, conferenceStatuses[tender.id] === 'OK' ? 'Pendente' : 'OK')}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase transition-all shadow-sm active:scale-95 disabled:cursor-not-allowed ${conferenceStatuses[tender.id] === 'OK'
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                        >
                            {conferenceStatuses[tender.id] === 'OK' ? (
                                <>
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                    OK
                                </>
                            ) : (
                                'Pendente'
                            )}
                        </button>
                    </div>
                </td>
            )}
            <td className={cn("px-3 py-2 font-medium whitespace-nowrap", isCancelled ? "text-slate-400" : "text-foreground")}>
                <div className="flex flex-col gap-1">
                    {role === 'Chefe da Seção de Licitações' ? (
                        <>
                            <input
                                type="text"
                                className={cn(
                                    "bg-transparent border-none focus:ring-1 focus:ring-radar-dark/30 rounded p-0 text-xs font-bold w-[110px] dark:text-gray-200",
                                    isCancelled && "line-through"
                                )}
                                value={localNumber}
                                onChange={(e) => setLocalNumber(e.target.value)}
                                onBlur={(e) => handleBlur('number', e.target.value)}
                            />
                            <div className="flex items-center">
                                <span className="text-[9px] text-muted-foreground uppercase mr-1">UASG</span>
                                <input
                                    type="text"
                                    className={cn(
                                        "bg-transparent border-none focus:ring-1 focus:ring-radar-dark/30 rounded p-0 text-[10px] text-muted-foreground w-[60px]",
                                        isCancelled && "line-through"
                                    )}
                                    value={localUasg}
                                    onChange={(e) => setLocalUasg(e.target.value)}
                                    onBlur={(e) => handleBlur('uasg', e.target.value)}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <span className={cn("font-bold text-foreground dark:text-gray-100", isCancelled && "line-through text-slate-400")}>{tender.number}</span>
                            <span className="text-[10px] text-muted-foreground font-semibold">UASG {tender.uasg}</span>
                        </>
                    )}
                </div>
            </td>
            <td className="px-3 py-2 min-w-[320px] max-w-[500px]">
                {role === 'Chefe da Seção de Licitações' || role === 'Administrador' ? (
                    <textarea
                        className={cn(
                            "bg-transparent border-none focus:ring-1 focus:ring-radar-dark/30 rounded p-0 text-sm font-bold w-full text-foreground dark:text-gray-100 resize-none overflow-hidden min-h-[1.5rem]",
                            isCancelled && "line-through text-slate-400/70 font-normal italic"
                        )}
                        rows={tender.description.length > 50 ? 2 : 1}
                        value={localDescription}
                        onChange={(e) => {
                            setLocalDescription(e.target.value);
                            // Auto-ajuste de altura simples
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onBlur={(e) => handleBlur('description', e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.currentTarget.blur();
                            }
                        }}
                    />
                ) : (
                    <span className="text-sm font-bold text-radar-dark dark:text-gray-100 break-words whitespace-normal block">
                        {tender.description}
                    </span>
                )}
            </td>
            <td className="px-3 py-2 w-[50px] text-center">
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            disabled={role !== 'Chefe da Seção de Licitações'}
                            className={`p-1.5 rounded-full transition-all ${tender.quickNotes ? 'bg-amber-100 text-amber-600 border border-amber-200 shadow-sm' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}
                            title={tender.quickNotes || "Adicionar anotação rápida"}
                        >
                            <StickyNote className={`w-4 h-4 ${tender.quickNotes ? 'fill-amber-400' : ''}`} />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-3 bg-white dark:bg-slate-900 border-radar-gold shadow-xl z-[10000]">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <StickyNote className="w-4 h-4 text-amber-500" />
                                Anotações do Objeto
                            </h4>
                            <textarea
                                className="w-full h-32 p-2 text-sm bg-amber-50/30 dark:bg-amber-900/10 border-amber-200/50 rounded-md focus:ring-amber-500/30 resize-none placeholder:text-slate-400 placeholder:italic"
                                placeholder="Insira observações rápidas aqui..."
                                value={localNote}
                                onChange={(e) => setLocalNote(e.target.value)}
                            />
                            <div className="flex justify-between items-center pt-1">
                                <button
                                    onClick={() => {
                                        setLocalNote('');
                                        updateTender(tender.id, { quickNotes: '' }, editorName);
                                    }}
                                    className="text-[10px] text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                >
                                    Apagar Nota
                                </button>
                                <div className="flex gap-2">
                                    <p className="text-[9px] text-slate-400 italic self-center">SALC Only</p>
                                    <button
                                        onClick={() => {
                                            updateTender(tender.id, { quickNotes: localNote }, editorName);
                                        }}
                                        className="text-[10px] bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1 rounded shadow-sm transition-all"
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </td>
            <td className="px-3 py-2">
                <input
                    type="text"
                    className="bg-transparent border-none focus:ring-0 p-0 text-xs w-[130px] text-foreground dark:text-gray-100 font-semibold"
                    placeholder="NUP..."
                    disabled={role !== 'Chefe da Seção de Licitações' && role !== 'Administrador'}
                    value={localNup}
                    onChange={(e) => setLocalNup(e.target.value)}
                    onBlur={(e) => handleBlur('nup', e.target.value)}
                    maxLength={25}
                />
            </td>
            <td className="px-3 py-2">
                <Select
                    disabled={role !== 'Chefe da Seção de Licitações' && role !== 'Administrador'}
                    value={tender.commitment || 'Outros'}
                    onValueChange={(value) => updateTender(tender.id, { commitment: value as any }, editorName)}
                >
                    <SelectTrigger className="w-[140px] h-8 text-xs bg-white dark:bg-slate-900 border-radar-dark/20 text-left justify-start px-2 font-bold text-foreground">
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
                    disabled={role !== 'Chefe da Seção de Licitações' && role !== 'Administrador'}
                    value={tender.coordinator || 'A definir'}
                    onValueChange={(value) => updateTender(tender.id, { coordinator: value as any }, editorName)}
                >
                    <SelectTrigger className="w-[140px] h-8 text-xs bg-white dark:bg-slate-900 border-radar-dark/20 text-left justify-start px-2 font-bold text-foreground">
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
                    disabled={role !== 'Chefe da Seção de Licitações' && role !== 'Administrador'}
                    value={tender.requesterSector || 'A definir'}
                    onValueChange={(value) => updateTender(tender.id, { requesterSector: value as any }, editorName)}
                >
                    <SelectTrigger className="w-[140px] h-8 text-xs bg-white dark:bg-slate-900 border-radar-dark/20 text-left justify-start px-2 font-bold text-foreground">
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
                {renderDateInput('protocoloSetorRequisitante', 'defined')}
            </td>
            <td className="px-3 py-2">
                {renderDateInput('protocoloSetorRequisitante', 'executed')}
            </td>
            <td className="px-3 py-2">
                {renderDateInput('cjuSendDeadline')}
            </td>
            <td className="px-3 py-2">
                {renderDateInput('cjuReturnDate')}
            </td>
            <td className="px-3 py-2">
                {renderDateInput('publicationAdjustmentsDeadline')}
            </td>
            <td className="px-3 py-2">
                {renderDateInput('publicationDate')}
            </td>
            <td className="px-3 py-2">
                {renderDateInput('proposalOpeningDate')}
            </td>
            <td className="px-3 py-2">
                {renderDateInput('homologationForecast')}
            </td>
            <td className="px-3 py-2">
                {renderDateInput('homologationDeadline')}
            </td>
            <td className="px-3 py-2">
                {renderDateInput('minutesSignatureDeadline')}
            </td>
            <td className="px-3 py-2">
                {renderDateInput('vigenciaAnterior')}
            </td>
            <td className="px-3 py-2">
                {renderDateInput('prazoGCALC')}
            </td>
            <td className="px-3 py-2">
                <Select
                    disabled={role !== 'Chefe da Seção de Licitações' && role !== 'Administrador'}
                    value={tender.pregoeiroFaseInternaId || 'none'}
                    onValueChange={(value) => updateTender(tender.id, { pregoeiroFaseInternaId: value === 'none' ? undefined : value }, editorName)}
                >
                    <SelectTrigger className="w-[150px] h-8 text-xs bg-white dark:bg-slate-900 border-radar-dark/20 font-bold text-foreground">
                        <SelectValue placeholder="A definir" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-950 border-radar-dark/20 z-[9999]">
                        <SelectItem value="none">A definir</SelectItem>
                        {pregoeiros.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </td>
            <td className="px-3 py-2">
                <Select
                    disabled={role !== 'Chefe da Seção de Licitações' && role !== 'Administrador'}
                    value={tender.pregoeiroFaseExternaId || 'none'}
                    onValueChange={(value) => updateTender(tender.id, { pregoeiroFaseExternaId: value === 'none' ? undefined : value }, editorName)}
                >
                    <SelectTrigger className="w-[150px] h-8 text-xs bg-white dark:bg-slate-900 border-radar-dark/20 font-bold text-foreground">
                        <SelectValue placeholder="A definir" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-950 border-radar-dark/20 z-[9999]">
                        <SelectItem value="none">A definir</SelectItem>
                        {pregoeiros.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </td>
            <td className="px-3 py-2">
                <div className="flex items-center gap-3">
                    <Select
                        disabled={role !== 'Chefe da Seção de Licitações' && role !== 'Administrador'}
                        value={tender.status}
                        onValueChange={(value) => updateTender(tender.id, { status: value as any }, editorName)}
                    >
                        <SelectTrigger className={cn(
                            "w-[240px] h-auto min-h-[2.2rem] text-[10px] leading-tight border transition-all shadow-sm text-left justify-start px-3 py-1.5 rounded-lg font-bold",
                            getStatusStyles(tender.status)
                        )}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-950 border-radar-dark/20 z-[9999]">
                            <SelectItem value="CANCELADO">CANCELADO</SelectItem>
                            <SelectItem value="ABANDONADO">ABANDONADO</SelectItem>
                            <SelectItem value="CANCELADO POR ABANDONO">CANCELADO POR ABANDONO</SelectItem>
                            <SelectItem value="CANCELADO POR REVOGAÇÃO">CANCELADO POR REVOGAÇÃO</SelectItem>
                            <SelectItem value="CANCELADO POR DUPLICIDADE DE OBJETO">CANCELADO POR DUPLICIDADE DE OBJETO</SelectItem>
                            <SelectItem value="FASE INTERNA NA OMDS">FASE INTERNA NA OMDS</SelectItem>
                            <SelectItem value="FASE INTERNA NA SAL">FASE INTERNA NA SAL</SelectItem>
                            <SelectItem value="FASE INTERNA - IRP">FASE INTERNA - IRP</SelectItem>
                            <SelectItem value="FASE INTERNA NA CJU">FASE INTERNA NA CJU</SelectItem>
                            <SelectItem value="FASE INTERNA - CORREÇÕES PARA PUBLICAÇÃO">FASE INTERNA - CORREÇÕES PARA PUBLICAÇÃO</SelectItem>
                            <SelectItem value="FASE EXTERNA - EDITAL PUBLICADO">FASE EXTERNA - EDITAL PUBLICADO</SelectItem>
                            <SelectItem value="FASE EXTERNA - ABERTURA E JULGAMENTO DAS PROPOSTAS">FASE EXTERNA - ABERTURA E JULGAMENTO DAS PROPOSTAS</SelectItem>
                            <SelectItem value="FASE EXTERNA - LANCES">FASE EXTERNA - LANCES</SelectItem>
                            <SelectItem value="FASE EXTERNA - RECURSOS E JULGAMENTO DE ADMISSIBILIDADE">FASE EXTERNA - RECURSOS E JULGAMENTO DE ADMISSIBILIDADE</SelectItem>
                            <SelectItem value="FASE EXTERNA - PARCIALMENTE HOMOLOGADO">FASE EXTERNA - PARCIALMENTE HOMOLOGADO</SelectItem>
                            <SelectItem value="HOMOLOGADO">HOMOLOGADO</SelectItem>
                        </SelectContent>
                    </Select>
                    <ProgressRaceTrack currentStatus={tender.status} />
                </div>
            </td>
            <td className="px-3 py-2 flex items-center space-x-3">
                <Link
                    href={`/tenders/${tender.id}`}
                    className="font-medium text-blue-600 hover:underline flex items-center"
                >
                    <Eye className="w-4 h-4 mr-1" />
                    Detalhes
                </Link>
                {role === 'Chefe da Seção de Licitações' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => addTenderBelow(tender.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Inserir licitação abaixo"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => deleteTender(tender.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Excluir Pregão"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
});

// Nome para depuração no React DevTools
TenderRow.displayName = "TenderRow";

export default function TendersPage() {
    const {
        tenders,
        searchQuery,
        setSearchQuery, // Added setSearchQuery
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
        updateTender,
        refreshTender,
        showConferenceColumn,
        toggleConferenceColumn,
        conferenceStatuses,
        setConferenceStatus,
        bulkSetConferenceStatus,
        dateChecks,
        toggleDateCheck,
        deleteTender,
        addTenderBelow,
        undo,
        canUndo,
        resetToOriginalData,
        historyCount,
        objectFilter,
        setObjectFilter,
        highlightId,
        setHighlightId,
        pregoeiros,
        forceCloudSync,
        pullDataFromCloud,
        importTendersFromCSV
    } = useTenders();
    const { role, user } = useUser();
    const editorName = user?.name || role || 'Usuário';

    const searchParams = useSearchParams();
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    // Sincronizar highlightId da URL com o contexto
    useEffect(() => {
        const urlHighlightId = searchParams.get('highlightId');
        if (urlHighlightId) {
            setHighlightId(urlHighlightId);
        }
    }, [searchParams, setHighlightId]);

    // Rolar até o item destacado
    useEffect(() => {
        if (highlightId && tableContainerRef.current) {
            const element = document.getElementById(`tender-row-${highlightId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [highlightId]);

    const syncWithDatabase = async () => {
        const tendersWithNup = tenders.filter(t => t.nup && t.nup.trim().length > 5).length;

        const confirmMsg = tendersWithNup > 0
            ? `📊 SINCRONIZAR COM O BANCO:\n\n${tenders.length} pregões serão salvos no servidor.\n\nDeseja continuar?`
            : `⚠️ Nenhum pregão tem NUP preenchido.\n\nDeseja salvar mesmo assim?`;

        if (confirm(confirmMsg)) {
            await forceCloudSync();
            alert("✅ Dados salvos na nuvem com sucesso!");
            // NÃO recarregar: reload sobrescreveria dados locais com versão antiga do banco
        }
    };

    const pullFromDatabase = async () => {
        if (confirm("🚨 ATENÇÃO: Deseja SUBSTITUIR tudo o que está na tela pelo que está salvo na nuvem?\n\nUse isso para recuperar os dados que você sincronizou às 17h. O que você está vendo agora será PERDIDO e trocado pela versão do servidor.")) {
            await pullDataFromCloud(true); // Forçar bypass da trava Gold
            alert("✅ Dados recuperados da nuvem com sucesso!");
            window.location.reload();
        }
    };

    const handleExport = () => {
        const headers = [
            'ID', 'Número', 'UASG', 'NUP', 'Descrição', 'Status',
            'Compromisso', 'Coordenador', 'Requisitante', 'Quick Notes',
            'Conferência Geral',
            'SAL (Prazo)', 'SAL (OK)',
            'Envio CJU', 'Regresso CJU',
            'Publicação (Prazo)', 'Publicação (Efetiva)', 'Publicação (OK)',
            'Sessão Pública', 'Sessão Pública (OK)',
            'Homologação (Prev)', 'Homologação (Prazo)', 'Homologação (OK)',
            'Assinatura Atas', 'Vigência Anterior', 'Prazo GCALC',
            'Última Atualização', 'Atualizado Por'
        ];

        const csvContent = [
            headers.join(','),
            ...tenders.map(t => {
                const confStatus = conferenceStatuses[t.id] || 'Pendente';
                const checks = dateChecks[t.id] || {};

                return [
                    t.id,
                    t.number,
                    t.uasg,
                    t.nup || '',
                    `"${(t.description || '').replace(/"/g, '""')}"`,
                    t.status,
                    t.commitment || '',
                    t.coordinator || '',
                    t.requesterSector || '',
                    `"${(t.quickNotes || '').replace(/"/g, '""')}"`,
                    confStatus,
                    // Datas e seus respectivos Checks (OK/Pendente)
                    t.dates?.protocoloSetorRequisitante?.defined || '',
                    checks['protocoloSetorRequisitante'] ? 'OK' : 'Pendente',
                    t.dates?.cjuSendDeadline || '',
                    t.dates?.cjuReturnDate || '',
                    t.dates?.publicationAdjustmentsDeadline || '',
                    t.dates?.publicationDate || '',
                    checks['publicationDate'] ? 'OK' : 'Pendente',
                    t.dates?.proposalOpeningDate || '',
                    checks['proposalOpeningDate'] ? 'OK' : 'Pendente',
                    t.dates?.homologationForecast || '',
                    t.dates?.homologationDeadline || '',
                    checks['homologationDeadline'] ? 'OK' : 'Pendente',
                    t.dates?.minutesSignatureDeadline || '',
                    t.dates?.vigenciaAnterior || '',
                    t.dates?.prazoGCALC || '',
                    t.lastUpdatedAt || '',
                    t.lastUpdatedBy || ''
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `radar_backup_${new Date().toISOString().split('T')[0]}.csv`);
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
        const matchesObject = objectFilter === "" || (tender.description && tender.description.toLowerCase().includes(objectFilter.toLowerCase()));
        const matchesCommitment = commitmentFilter === "all" || tender.commitment === commitmentFilter;
        const matchesCoordinator = coordinatorFilter === "all" || tender.coordinator === coordinatorFilter;
        const matchesRequesterSector = requesterSectorFilter === "all" || tender.requesterSector === requesterSectorFilter;

        return matchesSearch && matchesStatus && matchesNup && matchesObject && matchesCommitment && matchesCoordinator && matchesRequesterSector;
    });

    return (
        <div className="flex flex-col flex-1 w-full h-full gap-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground mr-4">Pregões em Monitoramento</h1>

                    <div className="flex items-center gap-1.5">
                        {/* Botão Novo Pregão */}
                        {role === 'Chefe da Seção de Licitações' && (
                            <CreateTenderModal />
                        )}
                        <div className="h-5 w-px bg-slate-200 mx-0.5" />
                        {/* Grupo: Ações do documento */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200"
                            onClick={handleExport}
                            title="Exportar tabela atual como planilha"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Extrair Planilha
                        </Button>

                        <Button
                            onClick={undo}
                            variant="outline"
                            size="sm"
                            disabled={!canUndo}
                            className={cn(
                                "h-8 text-xs gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200",
                                !canUndo && "opacity-40 cursor-not-allowed"
                            )}
                            title={canUndo ? `Desfazer última ação (${historyCount} disponível)` : "Nada para desfazer"}
                        >
                            <Undo2 className="w-3.5 h-3.5" />
                            Desfazer
                        </Button>

                        <div className="h-5 w-px bg-slate-200 mx-0.5" />

                        {/* Grupo: Conferência */}
                        <Button
                            variant={showConferenceColumn ? "secondary" : "outline"}
                            size="sm"
                            className={cn(
                                "h-8 text-xs gap-1.5 border-slate-200",
                                showConferenceColumn
                                    ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            )}
                            onClick={toggleConferenceColumn}
                        >
                            {showConferenceColumn ? "Ocultar Conferência" : "Conferência"}
                        </Button>

                        {showConferenceColumn && (role === 'Chefe da Seção de Licitações' || role === 'Administrador') && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs gap-1.5 text-slate-800 font-bold hover:text-slate-900 hover:bg-slate-50 border-slate-300"
                                    onClick={() => bulkSetConferenceStatus('OK')}
                                >
                                    Todos OK
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs gap-1.5 text-slate-800 font-bold hover:text-slate-900 hover:bg-slate-50 border-slate-300"
                                    onClick={() => bulkSetConferenceStatus('Pendente')}
                                >
                                    Todos Pendente
                                </Button>
                            </>
                        )}

                        <div className="h-5 w-px bg-slate-200 mx-0.5" />

                        {/* Grupo: Backup / Restore */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200"
                            onClick={() => exportTendersToCSV(tenders, user?.name || "Usuário", dateChecks)}
                            title="Gera um backup completo de todos os campos (NUP, Datas, Obs)"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Exportar Backup
                        </Button>

                        {role === 'Chefe da Seção de Licitações' && (
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                            const text = await file.text();
                                            const imported = await parseCSVToTenders(text);
                                            if (imported.length > 0) {
                                                if (confirm(`🚨 RESTAURAÇÃO DE EMERGÊNCIA:\n\nDetectamos ${imported.length} registros no arquivo.\n\nDeseja substituir TUDO o que está na tela por este backup de sábado?`)) {
                                                    importTendersFromCSV(imported);
                                                }
                                            } else {
                                                alert("❌ O arquivo parece estar vazio ou em formato inválido.");
                                            }
                                        } catch (err) {
                                            alert("❌ Erro ao processar o arquivo CSV.");
                                        }
                                        e.target.value = "";
                                    }}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200"
                                    title="Restaura dados a partir de um arquivo CSV de backup"
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    Restaurar via CSV
                                </Button>
                            </div>
                        )}

                        <div className="h-5 w-px bg-slate-200 mx-0.5" />

                        {/* Grupo: Nuvem — botões destaque */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                            onClick={pullFromDatabase}
                            title="Recupera os dados salvos no servidor (Pull)"
                        >
                            <CloudDownload className="w-3.5 h-3.5" />
                            Baixar da Nuvem
                        </Button>

                        <Button
                            size="sm"
                            className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            onClick={syncWithDatabase}
                            title="Envia seus dados locais para o servidor (Push)"
                        >
                            <Save className="w-3.5 h-3.5" />
                            Sincronizar Oficial
                        </Button>
                    </div>
                </div>
            </div>

            {highlightId && (
                <div className="flex items-center justify-between p-3 bg-radar-gold/10 border border-radar-gold rounded-lg animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-radar-gold rounded-full">
                            <LocateFixed className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-radar-dark">Visão de Foco Ativa</p>
                            <p className="text-xs text-slate-600">Localizamos o processo vindo da sua Agenda. O item está destacado abaixo.</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHighlightId(null)}
                        className="bg-white hover:bg-radar-gold hover:text-white border-radar-gold text-radar-gold transition-all"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Ver Todos os Processos (Limpar Destaque)
                    </Button>
                </div>
            )}

            <Card className="flex flex-col flex-1 overflow-hidden border-none shadow-sm dark:bg-slate-900/50">
                <CardHeader className="shrink-0">
                    <CardTitle>Todos os Processos</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 relative min-h-0">
                    <div
                        ref={tableContainerRef}
                        className="absolute inset-0 overflow-auto force-scrollbar border rounded-lg"
                    >
                        <table className="w-full text-xs text-left text-gray-500 min-w-[2000px]">
                            <thead className="text-[10px] text-muted-foreground uppercase bg-white dark:bg-gray-950 border-b sticky top-0 z-50 shadow-sm">
                                <tr>
                                    <th scope="col" className="px-3 py-2 text-center w-8">Nº</th>
                                    <th scope="col" className="px-3 py-2 whitespace-nowrap">Atualização</th>
                                    {showConferenceColumn && (
                                        <th scope="col" className="px-3 py-2 text-center w-24">Conferência</th>
                                    )}
                                    <th scope="col" className="px-3 py-2 min-w-[200px]">
                                        <div className="flex flex-col gap-1">
                                            <span>Pregão / UASG</span>
                                            <div className="relative">
                                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Buscar nº ou UASG..."
                                                    className="w-full pl-6 pr-2 py-1 text-[9px] font-normal border rounded bg-white/50 focus:bg-white outline-none"
                                                />
                                            </div>
                                        </div>
                                    </th>
                                    <th scope="col" className="px-3 py-2 min-w-[320px]">
                                        <div className="flex flex-col gap-1">
                                            <span>Objeto</span>
                                            <div className="relative">
                                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                                <input
                                                    type="text"
                                                    value={objectFilter}
                                                    onChange={(e) => setObjectFilter(e.target.value)}
                                                    placeholder="Filtrar objeto..."
                                                    className="w-full pl-6 pr-2 py-1 text-[9px] font-normal border rounded bg-white/50 focus:bg-white outline-none"
                                                />
                                            </div>
                                        </div>
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-center w-8">OBS</th>
                                    <th scope="col" className="px-3 py-2 min-w-[150px]">
                                        <div className="flex flex-col gap-1">
                                            <span>NUP</span>
                                            <div className="relative">
                                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                                <input
                                                    type="text"
                                                    value={nupFilter}
                                                    onChange={(e) => setNupFilter(e.target.value)}
                                                    placeholder="Filtrar NUP..."
                                                    className="w-full pl-6 pr-2 py-1 text-[9px] font-normal border rounded bg-white/50 focus:bg-white outline-none"
                                                />
                                            </div>
                                        </div>
                                    </th>
                                    <th scope="col" className="px-3 py-2 min-w-[140px]">
                                        <div className="flex flex-col gap-1">
                                            <span>Compromisso</span>
                                            <Select value={commitmentFilter} onValueChange={setCommitmentFilter}>
                                                <SelectTrigger className="h-7 text-[9px] font-normal bg-white/50 border-dashed">
                                                    <SelectValue placeholder="Todos" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-950">
                                                    <SelectItem value="all">Todos</SelectItem>
                                                    <SelectItem value="GCALC">GCALC</SelectItem>
                                                    <SelectItem value="PCA da OM">PCA da OM</SelectItem>
                                                    <SelectItem value="Operação Perseu">Operação Perseu</SelectItem>
                                                    <SelectItem value="Outros">Outros</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </th>
                                    <th scope="col" className="px-3 py-2 min-w-[140px]">
                                        <div className="flex flex-col gap-1">
                                            <span>Coordenador</span>
                                            <Select value={coordinatorFilter} onValueChange={setCoordinatorFilter}>
                                                <SelectTrigger className="h-7 text-[9px] font-normal bg-white/50 border-dashed text-left">
                                                    <SelectValue placeholder="Todos" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-950">
                                                    <SelectItem value="all">Todos</SelectItem>
                                                    <SelectItem value="CAF">CAF</SelectItem>
                                                    <SelectItem value="CCOL">CCOL</SelectItem>
                                                    <SelectItem value="9º B Sup">9º B Sup</SelectItem>
                                                    <SelectItem value="A definir">A definir</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </th>
                                    <th scope="col" className="px-3 py-2 min-w-[140px]">
                                        <div className="flex flex-col gap-1">
                                            <span>Requisitante</span>
                                            <Select value={requesterSectorFilter} onValueChange={setRequesterSectorFilter}>
                                                <SelectTrigger className="h-7 text-[9px] font-normal bg-white/50 border-dashed">
                                                    <SelectValue placeholder="Todos" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-950">
                                                    <SelectItem value="all">Todos</SelectItem>
                                                    <SelectItem value="9º B Mnt">9º B Mnt</SelectItem>
                                                    <SelectItem value="9º B Sup">9º B Sup</SelectItem>
                                                    <SelectItem value="18º B Trnp">18º B Trnp</SelectItem>
                                                    <SelectItem value="Cia Cmdo">Cia Cmdo</SelectItem>
                                                    <SelectItem value="9º B Sau">9º B Sau</SelectItem>
                                                    <SelectItem value="Cmdo 9º Gpt">Cmdo 9º Gpt</SelectItem>
                                                    <SelectItem value="A definir">A definir</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </th>
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
                                    <th scope="col" className="px-3 py-2 text-radar-gold font-bold bg-radar-gold/5 min-w-[170px]">PREGOEIRO (FASE INTERNA)</th>
                                    <th scope="col" className="px-3 py-2 text-radar-gold font-bold bg-radar-gold/5 min-w-[170px]">PREGOEIRO (FASE EXTERNA)</th>
                                    <th scope="col" className="px-3 py-2 min-w-[250px]">
                                        <div className="flex flex-col gap-1">
                                            <span>Status</span>
                                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                                <SelectTrigger className="h-7 text-[9px] font-normal bg-white text-radar-dark border-radar-dark/30">
                                                    <div className="flex items-center">
                                                        <Filter className="mr-1 h-2 w-2" />
                                                        <SelectValue placeholder="Status" />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-950 border-radar-gold w-[260px]">
                                                    <DropdownMenuLabel className="text-[10px]">Filtrar por Status</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <SelectItem value="all">Todos</SelectItem>
                                                    <SelectItem value="CANCELADO POR ABANDONO">CANCELADO POR ABANDONO</SelectItem>
                                                    <SelectItem value="CANCELADO POR REVOGAÇÃO">CANCELADO POR REVOGAÇÃO</SelectItem>
                                                    <SelectItem value="CANCELADO POR DUPLICIDADE DE OBJETO">CANCELADO POR DUPLICIDADE DE OBJETO</SelectItem>
                                                    <SelectItem value="FASE INTERNA NA OMDS">FASE INTERNA NA OMDS</SelectItem>
                                                    <SelectItem value="FASE INTERNA NA SAL">FASE INTERNA NA SAL</SelectItem>
                                                    <SelectItem value="FASE INTERNA - IRP">FASE INTERNA - IRP</SelectItem>
                                                    <SelectItem value="FASE INTERNA NA CJU">FASE INTERNA NA CJU</SelectItem>
                                                    <SelectItem value="FASE INTERNA - CORREÇÕES PARA PUBLICAÇÃO">FASE INTERNA - CORREÇÕES PARA PUBLICAÇÃO</SelectItem>
                                                    <SelectItem value="FASE EXTERNA - EDITAL PUBLICADO">FASE EXTERNA - EDITAL PUBLICADO</SelectItem>
                                                    <SelectItem value="FASE EXTERNA - ABERTURA E JULGAMENTO DAS PROPOSTAS">FASE EXTERNA - ABERTURA E JULGAMENTO DAS PROPOSTAS</SelectItem>
                                                    <SelectItem value="FASE EXTERNA - LANCES">FASE EXTERNA - LANCES</SelectItem>
                                                    <SelectItem value="FASE EXTERNA - RECURSOS E JULGAMENTO DE ADMISSIBILIDADE">FASE EXTERNA - RECURSOS E JULGAMENTO DE ADMISSIBILIDADE</SelectItem>
                                                    <SelectItem value="FASE EXTERNA - PARCIALMENTE HOMOLOGADO">FASE EXTERNA - PARCIALMENTE HOMOLOGADO</SelectItem>
                                                    <SelectItem value="HOMOLOGADO">HOMOLOGADO</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </th>

                                    <th scope="col" className="px-3 py-2">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTenders.map((tender, index) => (
                                    <TenderRow
                                        key={tender.id}
                                        tender={tender}
                                        index={index}
                                        role={role}
                                        editorName={editorName}
                                        updateTender={updateTender}
                                        refreshTender={refreshTender}
                                        showConferenceColumn={showConferenceColumn}
                                        conferenceStatuses={conferenceStatuses}
                                        setConferenceStatus={setConferenceStatus}
                                        dateChecks={dateChecks}
                                        toggleDateCheck={toggleDateCheck}
                                        deleteTender={deleteTender}
                                        addTenderBelow={addTenderBelow}
                                        isHighlighted={highlightId === tender.id}
                                        pregoeiros={pregoeiros}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
