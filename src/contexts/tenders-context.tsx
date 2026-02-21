"use client"

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Tender, Person, Pregoeiro, Supervisor } from '@/types';
import { tenders as initialTenders, DATA_VERSION } from '@/lib/data';
import { supabase } from '@/lib/supabase';

interface TendersContextType {
    tenders: Tender[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    statusFilter: string;
    setStatusFilter: (filter: string) => void;
    nupFilter: string;
    setNupFilter: (filter: string) => void;
    commitmentFilter: string;
    setCommitmentFilter: (filter: string) => void;
    coordinatorFilter: string;
    setCoordinatorFilter: (filter: string) => void;
    requesterSectorFilter: string;
    setRequesterSectorFilter: (filter: string) => void;
    objectFilter: string;
    setObjectFilter: (filter: string) => void;
    updateTender: (id: string, updates: Partial<Tender>, editorName?: string) => void;
    refreshTender: (id: string, editorName?: string) => void;
    // Novos campos para Conferência
    showConferenceColumn: boolean;
    toggleConferenceColumn: () => void;
    conferenceStatuses: Record<string, 'OK' | 'Pendente'>;
    setConferenceStatus: (id: string, status: 'OK' | 'Pendente') => void;
    bulkSetConferenceStatus: (status: 'OK' | 'Pendente') => void;
    // Checks individuais de datas
    dateChecks: Record<string, Record<string, boolean>>;
    toggleDateCheck: (tenderId: string, dateKey: string) => void;
    deleteTender: (id: string) => void;
    addTenderBelow: (id: string) => void;
    undo: () => void;
    canUndo: boolean;
    historyCount: number;
    resetToOriginalData: () => void;
    // Gestão de Pessoas (Vínculos)
    people: Person[];
    addPerson: (person: Omit<Person, 'id'>) => void;
    updatePerson: (id: string, updates: Partial<Person>) => void;
    deletePerson: (id: string) => void;
    pregoeiros: Pregoeiro[];
    addPregoeiro: (pregoeiro: Omit<Pregoeiro, 'id'>) => void;
    updatePregoeiro: (id: string, updates: Partial<Pregoeiro>) => void;
    deletePregoeiro: (id: string) => void;
    assignTenderToPregoeiro: (tenderId: string, pregoeiroId: string, phase: 'interna' | 'externa') => void;
    supervisors: Supervisor[];
    addSupervisor: (supervisor: Omit<Supervisor, 'id'>) => void;
    updateSupervisor: (id: string, updates: Partial<Supervisor>) => void;
    deleteSupervisor: (id: string) => void;
    highlightId: string | null;
    setHighlightId: (id: string | null) => void;
    // Monitoramento Cloud
    cloudStatus: {
        isConnected: boolean;
        lastSync: Date | null;
        totalRecords: number;
        status: 'online' | 'offline' | 'syncing' | 'error';
        message?: string;
    };
    forceCloudSync: () => Promise<void>;
}

const TendersContext = createContext<TendersContextType | undefined>(undefined);

export function TendersProvider({ children }: { children: ReactNode }) {
    const [tenders, setTenders] = useState<Tender[]>(initialTenders);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [nupFilter, setNupFilter] = useState("");
    const [commitmentFilter, setCommitmentFilter] = useState("all");
    const [coordinatorFilter, setCoordinatorFilter] = useState("all");
    const [requesterSectorFilter, setRequesterSectorFilter] = useState("all");
    const [objectFilter, setObjectFilter] = useState("");
    const [highlightId, setHighlightId] = useState<string | null>(null);

    // Estados de Conferência
    const [showConferenceColumn, setShowConferenceColumn] = useState(false);
    const [conferenceStatuses, setConferenceStatuses] = useState<Record<string, 'OK' | 'Pendente'>>({});
    const [dateChecks, setDateChecks] = useState<Record<string, Record<string, boolean>>>({});
    const [history, setHistory] = useState<Array<{
        tenders: Tender[],
        conferenceStatuses: Record<string, 'OK' | 'Pendente'>,
        dateChecks: Record<string, Record<string, boolean>>
    }>>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [people, setPeople] = useState<Person[]>([]);
    const [pregoeiros, setPregoeiros] = useState<Pregoeiro[]>([
        { id: 'pregoeiro-1', name: 'Cap Silva', role: 'Pregoeiro', whatsapp: '', email: '' },
        { id: 'pregoeiro-2', name: 'Ten Rocha', role: 'Pregoeiro', whatsapp: '', email: '' },
        { id: 'pregoeiro-3', name: 'Sgt Almeida', role: 'Pregoeiro', whatsapp: '', email: '' },
        { id: 'pregoeiro-4', name: 'Ten Costa', role: 'Pregoeiro', whatsapp: '', email: '' },
        { id: 'pregoeiro-5', name: 'Cap Fernandes', role: 'Pregoeiro', whatsapp: '', email: '' }
    ]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [cloudStatus, setCloudStatus] = useState<TendersContextType['cloudStatus']>({
        isConnected: false,
        lastSync: null,
        totalRecords: 0,
        status: 'offline'
    });

    // Carregar do LocalStorage (APENAS UMA VEZ NA MONTAGEM)
    useEffect(() => {
        const savedVersion = localStorage.getItem('radar_data_version');

        // MIGRATION 1.3.0: Estabilização de Identidade
        if (savedVersion !== DATA_VERSION) {
            // Apenas marca a nova versão, o merge abaixo cuidará de injetar os novos campos oficiais 
            // sem apagar o que o usuário já editou.
            localStorage.setItem('radar_data_version', DATA_VERSION);
        }

        // 1. Carregar Tenders (Prioridade para dados locais)
        const savedTenders = localStorage.getItem('radar_tenders_data');
        if (savedTenders) {
            try {
                const localTenders: Tender[] = JSON.parse(savedTenders);

                // MERGE INTELIGENTE v1.3.0: 
                // A ordem SEMPRE vem do initialTenders.
                // Mas os valores vêm do localTenders se existirem, exceto se o local for nulo.
                const mergedTenders = initialTenders.map(initial => {
                    const local = localTenders.find(t => t.id === initial.id);
                    if (!local) return initial;

                    // Preserva as edições do usuário, mas permite que novos campos do initialTenders
                    // (como UASG corrigido ou novos status) sejam mesclados se o local tiver valor padrão.
                    return {
                        ...initial,
                        ...local,
                        // UASG e Identidade vêm do Oficial para garantir 160136, 
                        // a menos que o usuário tenha mudado explicitamente (improvável para UASG)
                        uasg: initial.uasg || local.uasg
                    };
                });

                // Preserva itens que o usuário criou manualmente
                localTenders.forEach(local => {
                    const alreadyPresent = initialTenders.some(i => i.id === local.id);
                    if (!alreadyPresent) {
                        mergedTenders.push(local);
                    }
                });

                setTenders(mergedTenders);
            } catch (e) {
                console.error("Erro ao carregar tenders do localStorage", e);
            }
        }

        const savedShowCol = localStorage.getItem('radar_show_conference_column');
        if (savedShowCol !== null) setShowConferenceColumn(savedShowCol === 'true');

        const savedStatuses = localStorage.getItem('radar_conference_statuses');
        if (savedStatuses) {
            try {
                setConferenceStatuses(JSON.parse(savedStatuses));
            } catch (e) {
                console.error("Erro ao carregar status de conferência", e);
            }
        }

        const savedDateChecks = localStorage.getItem('radar_date_checks');
        if (savedDateChecks) {
            try {
                setDateChecks(JSON.parse(savedDateChecks));
            } catch (e) {
                console.error("Erro ao carregar checks de data", e);
            }
        }

        const savedPeople = localStorage.getItem('radar_people_data');
        if (savedPeople) {
            try {
                setPeople(JSON.parse(savedPeople));
            } catch (e) {
                console.error("Erro ao carregar pessoas do localStorage", e);
            }
        }

        const savedPregoeiros = localStorage.getItem('radar_pregoeiros_data');
        if (savedPregoeiros) {
            try {
                setPregoeiros(JSON.parse(savedPregoeiros));
            } catch (e) {
                console.error("Erro ao carregar pregoeiros do localStorage", e);
            }
        }

        const savedSupervisors = localStorage.getItem('radar_supervisors_data');
        if (savedSupervisors) {
            try {
                setSupervisors(JSON.parse(savedSupervisors));
            } catch (e) {
                console.error("Erro ao carregar supervisores do localStorage", e);
            }
        }

        setIsLoaded(true);
    }, []);

    // ---------------------------------------------------------
    // LOGICA CLOUD (SUPABASE) v3.0.0
    // ---------------------------------------------------------

    const forceCloudSync = useCallback(async () => {
        if (!supabase) return;

        setCloudStatus(prev => ({ ...prev, status: 'syncing' }));

        try {
            // 1. Puxar dados para contar registros (Verificar conexão)
            if (!supabase) {
                console.error("❌ Erro Crítico: Cliente Supabase não inicializado. Verifique .env.local");
                setCloudStatus(prev => ({ ...prev, status: 'error', message: 'Cliente Supabase não inicializado' }));
                return;
            }

            const { count, error: countError } = await supabase
                .from('tenders')
                .select('*', { count: 'exact', head: true });

            if (countError) throw countError;

            // 2. Preparar dados de membros da equipe para validação de FK
            const allTeamIds = new Set([
                ...pregoeiros.map(p => p.id),
                ...supervisors.map(s => s.id),
                ...people.map(p => p.id)
            ]);

            // 3. Preparar dados locais para Upload com Validação de FK
            const tendersToUpload = tenders.map(t => {
                // Função auxiliar para validar se um ID existe na equipe
                const getSafeId = (id: string | undefined | null) => {
                    if (!id || id.trim() === "" || !allTeamIds.has(id)) {
                        if (id && id.trim() !== "") {
                            console.warn(`⚠️ ID de Pregoeiro/Supervisor fantasma detectado: "${id}" no pregão ${t.number}. Limpando para evitar erro de banco.`);
                        }
                        return null;
                    }
                    return id;
                };

                return {
                    id: t.id,
                    uasg: t.uasg,
                    number: t.number,
                    nup: t.nup,
                    description: t.description,
                    department: t.department,
                    opening_date: t.openingDate,
                    estimated_value: t.estimatedValue,
                    status: t.status,
                    current_stage: t.currentStage,
                    has_issues: t.hasIssues,
                    is_gcalc: t.isGCALC,
                    commitment: t.commitment,
                    requester_sector: t.requesterSector,
                    coordinator: t.coordinator,
                    coord: t.coord,
                    section: t.section,
                    responsible_internal: t.responsibleInternal,
                    responsible_external: t.responsibleExternal,
                    bi_publication: t.biPublication,
                    optimization_notes: t.optimizationNotes,
                    next_deadline: t.nextDeadline,
                    next_activity: t.nextActivity,
                    intercurrences: t.intercurrences,
                    last_updated_by: t.lastUpdatedBy,
                    verification_status: t.verificationStatus,
                    assigned_pregoeiro_id: getSafeId(t.assignedPregoeiroId),
                    pregoeiro_fase_interna_id: getSafeId(t.pregoeiroFaseInternaId),
                    pregoeiro_fase_externa_id: getSafeId(t.pregoeiroFaseExternaId),
                    dates: t.dates || {},
                    updates: t.updates || [],
                    observations: t.observations || []
                };
            });

            // 4. Sincronizar Membros da Equipe PRIMEIRO (Evita erro de FK)
            const teamToUpload = [
                ...pregoeiros.map(p => ({
                    id: p.id, name: p.name, email: p.email, whatsapp: p.whatsapp, role: p.role,
                    type: 'pregoeiro', om: (p as any).om || ""
                })),
                ...supervisors.map(s => ({
                    id: s.id, name: s.name, email: s.email, whatsapp: s.whatsapp, role: s.role,
                    type: 'supervisor', om: s.organization || ""
                })),
                ...people.map(p => ({
                    id: p.id, name: p.name, email: p.email, whatsapp: p.whatsapp, role: p.role,
                    type: 'requisitante', om: p.sector || ""
                }))
            ];

            const { error: teamError } = await supabase.from('team_members').upsert(teamToUpload);
            if (teamError) throw teamError;

            // 4. Sincronizar Pregões (Agora que os pregoeiros existem no banco)
            const { error: upsertError } = await supabase
                .from('tenders')
                .upsert(tendersToUpload);

            if (upsertError) throw upsertError;

            setCloudStatus({
                isConnected: true,
                lastSync: new Date(),
                totalRecords: tenders.length,
                status: 'online'
            });

        } catch (err: any) {
            console.error("❌ Erro na sincronia cloud (BRUTO):", err);
            console.dir(err); // Tenta mostrar a estrutura interna

            // Extrai a mensagem da forma mais agressiva possível
            let errorMsg = "Erro desconhecido de conexão";
            if (err.message) errorMsg = err.message;
            else if (err.error_description) errorMsg = err.error_description;
            else if (err.statusText) errorMsg = err.statusText;
            else if (err.toString() !== "[object Object]") errorMsg = err.toString();

            // Adiciona código e dica se existirem
            if (err.code) errorMsg += ` (Cod: ${err.code})`;
            if (err.hint) errorMsg += ` - Dica: ${err.hint}`;

            // Tenta forçar a mensagem a aparecer no Red Overlay do Next.js
            const finalMessage = `ERRO CLOUD: ${errorMsg}`;
            console.error(finalMessage);

            setCloudStatus(prev => ({
                ...prev,
                status: 'error',
                isConnected: false,
                message: errorMsg
            }));
        }
    }, [tenders, pregoeiros, supervisors, people]);

    // Sincronia Automática ao carregar
    useEffect(() => {
        if (isLoaded && process.env.NEXT_PUBLIC_SUPABASE_URL) {
            forceCloudSync();
        }
    }, [isLoaded]);

    // Salvar Tenders no LocalStorage quando mudar (APENAS SE JÁ CARREGADO)
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('radar_tenders_data', JSON.stringify(tenders));
        }
    }, [tenders, isLoaded]);

    // Salvar outras preferências (APENAS SE JÁ CARREGADO)
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('radar_conference_statuses', JSON.stringify(conferenceStatuses));
            localStorage.setItem('radar_date_checks', JSON.stringify(dateChecks));
            localStorage.setItem('radar_people_data', JSON.stringify(people));
            localStorage.setItem('radar_pregoeiros_data', JSON.stringify(pregoeiros));
            localStorage.setItem('radar_supervisors_data', JSON.stringify(supervisors));
        }
    }, [showConferenceColumn, conferenceStatuses, dateChecks, people, pregoeiros, supervisors, isLoaded]);

    // Sistema de Histórico (Undo)
    const saveHistory = useCallback(() => {
        setHistory(prev => {
            const newHistory = [
                {
                    tenders: [...tenders],
                    conferenceStatuses: { ...conferenceStatuses },
                    dateChecks: { ...dateChecks }
                },
                ...prev
            ];
            // Limita a 50 estados para não estourar memória
            return newHistory.slice(0, 50);
        });
    }, [tenders, conferenceStatuses, dateChecks]);

    const undo = useCallback(() => {
        if (history.length === 0) return;

        const [previousState, ...remainingHistory] = history;

        // Bloqueia salvamento automático de histórico durante o undo
        // (Isso é controlado pelo fato de estarmos setando estados simultaneamente)
        setTenders(previousState.tenders);
        setConferenceStatuses(previousState.conferenceStatuses);
        setDateChecks(previousState.dateChecks);
        setHistory(remainingHistory);
    }, [history]);

    const toggleConferenceColumn = useCallback(() => {
        setShowConferenceColumn(prev => !prev);
    }, []);

    const setConferenceStatus = useCallback((id: string, status: 'OK' | 'Pendente') => {
        saveHistory();
        setConferenceStatuses(prev => ({
            ...prev,
            [id]: status
        }));
    }, [saveHistory]);

    const bulkSetConferenceStatus = useCallback((status: 'OK' | 'Pendente') => {
        saveHistory();
        const newStatuses: Record<string, 'OK' | 'Pendente'> = {};
        tenders.forEach(t => {
            newStatuses[t.id] = status;
        });
        setConferenceStatuses(newStatuses);
    }, [tenders, saveHistory]);

    const toggleDateCheck = useCallback((tenderId: string, dateKey: string) => {
        saveHistory();
        setDateChecks(prev => ({
            ...prev,
            [tenderId]: {
                ...(prev[tenderId] || {}),
                [dateKey]: !(prev[tenderId]?.[dateKey])
            }
        }));
    }, [saveHistory]);

    const deleteTender = useCallback((id: string) => {
        if (confirm("🚨 Tem certeza que deseja excluir este pregão? Esta ação removerá o item da sua visualização local.")) {
            saveHistory();
            setTenders(prev => prev.filter(t => t.id !== id));
        }
    }, [saveHistory]);

    const addTenderBelow = useCallback((id: string) => {
        saveHistory();
        setTenders(prev => {
            const index = prev.findIndex(t => t.id === id);
            if (index === -1) return prev;

            const newTender: Tender = {
                id: `tender-manual-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                uasg: "160136",
                number: "A definir",
                description: "Nova Licitação",
                department: "18º B Trnp",
                openingDate: new Date().toISOString(),
                status: "FASE INTERNA NA OMDS",
                currentStage: "1. Entrada do TR na SAL",
                hasIssues: false,
                isGCALC: false,
                coord: "CAF",
                coordinator: "CAF",
                nup: "",
                dates: {
                    protocoloSetorRequisitante: {}
                },
                updates: [],
                observations: []
            };

            const newList = [...prev];
            newList.splice(index + 1, 0, newTender);
            return newList;
        });
    }, [saveHistory]);

    // Funções de Gerenciamento de Pessoas
    const addPerson = useCallback((personData: Omit<Person, 'id'>) => {
        const newPerson: Person = {
            ...personData,
            id: `person-${Date.now()}`
        };
        setPeople(prev => [...prev, newPerson]);
    }, []);

    const updatePerson = useCallback((id: string, updates: Partial<Person>) => {
        setPeople(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }, []);

    const deletePerson = useCallback((id: string) => {
        if (confirm("Deseja remover este contato?")) {
            setPeople(prev => prev.filter(p => p.id !== id));
        }
    }, []);

    const assignTenderToPregoeiro = useCallback((tenderId: string, pregoeiroId: string, phase: 'interna' | 'externa') => {
        saveHistory();
        setTenders(prev => prev.map(t =>
            t.id === tenderId
                ? {
                    ...t,
                    [phase === 'interna' ? 'pregoeiroFaseInternaId' : 'pregoeiroFaseExternaId']: pregoeiroId === 'none' ? undefined : pregoeiroId
                }
                : t
        ));
    }, [saveHistory]);

    const addPregoeiro = useCallback((data: Omit<Pregoeiro, 'id'>) => {
        const newPregoeiro: Pregoeiro = {
            ...data,
            id: `pregoeiro-${Date.now()}`
        };
        setPregoeiros(prev => [...prev, newPregoeiro]);
    }, []);

    const updatePregoeiro = useCallback((id: string, updates: Partial<Pregoeiro>) => {
        setPregoeiros(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }, []);

    const deletePregoeiro = useCallback((id: string) => {
        if (confirm("Deseja remover este pregoeiro? Os pregões vinculados a ele ficarão 'Sem Pregoeiro'.")) {
            // Primeiro remove a atribuição nos tenders
            setTenders(prev => prev.map(t =>
                (t.assignedPregoeiroId === id || t.pregoeiroFaseInternaId === id || t.pregoeiroFaseExternaId === id)
                    ? {
                        ...t,
                        assignedPregoeiroId: t.assignedPregoeiroId === id ? undefined : t.assignedPregoeiroId,
                        pregoeiroFaseInternaId: t.pregoeiroFaseInternaId === id ? undefined : t.pregoeiroFaseInternaId,
                        pregoeiroFaseExternaId: t.pregoeiroFaseExternaId === id ? undefined : t.pregoeiroFaseExternaId
                    }
                    : t
            ));
            // Depois remove o pregoeiro
            setPregoeiros(prev => prev.filter(p => p.id !== id));
        }
    }, []);

    const addSupervisor = useCallback((data: Omit<Supervisor, 'id'>) => {
        const newSupervisor: Supervisor = {
            ...data,
            id: `supervisor-${Date.now()}`
        };
        setSupervisors(prev => [...prev, newSupervisor]);
    }, []);

    const updateSupervisor = useCallback((id: string, updates: Partial<Supervisor>) => {
        setSupervisors(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }, []);

    const deleteSupervisor = useCallback((id: string) => {
        if (confirm("Deseja remover este supervisor?")) {
            setSupervisors(prev => prev.filter(s => s.id !== id));
        }
    }, []);

    const resetToOriginalData = useCallback(() => {
        if (confirm("🚨 ATENÇÃO: Isso apagará TODAS as suas alterações manuais e voltará aos dados originais da planilha. Deseja continuar?")) {
            localStorage.removeItem('radar_tenders_data');
            localStorage.removeItem('radar_conference_statuses');
            localStorage.removeItem('radar_date_checks');
            window.location.reload();
        }
    }, []);

    const updateTender = useCallback((id: string, updates: Partial<Tender>, editorName?: string) => {
        // Para edições de texto, não vamos salvar no histórico canônico a cada tecla (onBlur salva)
        // O onBlur chama essa função, então o saveHistory deve ser cuidadoso
        setTenders(prevTenders => {
            const newTenders = prevTenders.map(tender =>
                tender.id === id
                    ? {
                        ...tender,
                        ...updates,
                        lastUpdatedAt: new Date().toISOString(),
                        lastUpdatedBy: editorName || tender.lastUpdatedBy,
                    }
                    : tender
            );
            return newTenders;
        });
    }, []);

    // Helper para salvar antes de edições críticas
    const saveAndUpdateTender = useCallback((id: string, updates: Partial<Tender>, editorName?: string) => {
        saveHistory();
        updateTender(id, updates, editorName);
    }, [saveHistory, updateTender]);

    const refreshTender = useCallback((id: string, editorName?: string) => {
        saveHistory();
        setTenders(prevTenders => {
            const newTenders = prevTenders.map(tender =>
                tender.id === id
                    ? {
                        ...tender,
                        lastUpdatedAt: new Date().toISOString(),
                        lastUpdatedBy: editorName || tender.lastUpdatedBy,
                    }
                    : tender
            );
            return newTenders;
        });
    }, []);

    return (
        <TendersContext.Provider value={{
            tenders,
            searchQuery,
            setSearchQuery,
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
            updateTender: saveAndUpdateTender, // Versão que salva histórico
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
            canUndo: history.length > 0,
            historyCount: history.length,
            resetToOriginalData,
            objectFilter,
            setObjectFilter,
            people,
            addPerson,
            updatePerson,
            deletePerson,
            pregoeiros,
            addPregoeiro,
            updatePregoeiro,
            deletePregoeiro,
            assignTenderToPregoeiro,
            supervisors,
            addSupervisor,
            updateSupervisor,
            deleteSupervisor,
            highlightId,
            setHighlightId,
            cloudStatus,
            forceCloudSync
        }}>
            {children}
        </TendersContext.Provider>
    );
}

export function useTenders() {
    const context = useContext(TendersContext);
    if (context === undefined) {
        throw new Error('useTenders must be used within a TendersProvider');
    }
    return context;
}
