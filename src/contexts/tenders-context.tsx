"use client"

import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
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
    showConferenceColumn: boolean;
    toggleConferenceColumn: () => void;
    conferenceStatuses: Record<string, 'OK' | 'Pendente'>;
    setConferenceStatus: (id: string, status: 'OK' | 'Pendente') => void;
    bulkSetConferenceStatus: (status: 'OK' | 'Pendente') => void;
    dateChecks: Record<string, Record<string, boolean>>;
    toggleDateCheck: (tenderId: string, dateKey: string) => void;
    deleteTender: (id: string) => void;
    addTenderBelow: (id: string) => void;
    undo: () => void;
    canUndo: boolean;
    historyCount: number;
    resetToOriginalData: () => void;
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
    cloudStatus: {
        isConnected: boolean;
        lastSync: Date | null;
        totalRecords: number;
        status: 'online' | 'offline' | 'syncing' | 'error';
        message?: string;
    };
    forceCloudSync: () => Promise<void>;
    pullDataFromCloud: (skipGoldCheck?: boolean) => Promise<void>;
    importTendersFromCSV: (tenders: Partial<Tender>[]) => void;
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

    const [showConferenceColumn, setShowConferenceColumn] = useState(true); // Default TRUE conforme pedido
    const [conferenceStatuses, setConferenceStatuses] = useState<Record<string, 'OK' | 'Pendente'>>({});
    const [dateChecks, setDateChecks] = useState<Record<string, Record<string, boolean>>>({});
    const [history, setHistory] = useState<Array<{
        tenders: Tender[],
        conferenceStatuses: Record<string, 'OK' | 'Pendente'>,
        dateChecks: Record<string, Record<string, boolean>>
    }>>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [people, setPeople] = useState<Person[]>([]);
    const [pregoeiros, setPregoeiros] = useState<Pregoeiro[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [cloudStatus, setCloudStatus] = useState<TendersContextType['cloudStatus']>({
        isConnected: false,
        lastSync: null,
        totalRecords: 0,
        status: 'offline'
    });

    const hasPulledRef = useRef(false);
    const autoSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Lógica Cloud (Supabase)
    const loadDataFromCloud = useCallback(async (skipGoldCheck: boolean = false) => {
        if (!supabase) return;
        setCloudStatus(prev => ({ ...prev, status: 'syncing' }));
        try {
            const { data: cloudTeam, error: teamError } = await supabase.from('team_members').select('*');
            if (teamError) throw teamError;

            let cloudPregoeiros: Pregoeiro[] = [];
            let cloudSupervisors: Supervisor[] = [];
            let cloudPeople: Person[] = [];

            if (cloudTeam) {
                cloudPregoeiros = cloudTeam.filter(m => m.type === 'pregoeiro').map(m => ({ id: m.id, name: m.name, email: m.email, whatsapp: m.whatsapp, role: m.role }));
                cloudSupervisors = cloudTeam.filter(m => m.type === 'supervisor').map(m => ({ id: m.id, name: m.name, email: m.email, whatsapp: m.whatsapp, role: m.role, organization: m.om }));
                cloudPeople = cloudTeam.filter(m => m.type === 'requisitante').map(m => ({ id: m.id, name: m.name, email: m.email, whatsapp: m.whatsapp, role: m.role, sector: m.om }));
            }

            const { data: cloudTenders, error: tendersError } = await supabase.from('tenders').select('*');
            if (tendersError) throw tendersError;

            if (cloudTenders && cloudTenders.length > 0) {
                const mappedTenders: Tender[] = cloudTenders.map(t => {
                    // RESGATE CORE: Backup duplo no blob dates
                    const backupChecks = t.dates?._audit_trail_checks || {};
                    const finalChecks = (t.date_checks && Object.keys(t.date_checks).length > 0)
                        ? t.date_checks
                        : backupChecks;

                    return {
                        id: t.id,
                        uasg: t.uasg,
                        number: t.number,
                        nup: t.nup,
                        description: t.description,
                        department: t.department,
                        openingDate: t.opening_date,
                        estimatedValue: t.estimated_value,
                        status: t.status,
                        currentStage: t.current_stage,
                        hasIssues: t.has_issues,
                        isGCALC: t.is_gcalc,
                        commitment: t.commitment,
                        requesterSector: t.requester_sector,
                        coordinator: t.coordinator,
                        coord: t.coord,
                        section: t.section,
                        responsibleInternal: t.responsible_internal,
                        responsibleExternal: t.responsible_external,
                        biPublication: t.bi_publication,
                        optimizationNotes: t.optimization_notes,
                        nextDeadline: t.next_deadline,
                        nextActivity: t.next_activity,
                        intercurrences: t.intercurrences,
                        lastUpdatedBy: t.last_updated_by,
                        lastUpdatedAt: t.updated_at,
                        verificationStatus: t.verification_status,
                        assignedPregoeiroId: t.assigned_pregoeiro_id,
                        pregoeiroFaseInternaId: t.pregoeiro_fase_interna_id,
                        pregoeiroFaseExternaId: t.pregoeiro_fase_externa_id,
                        quickNotes: t.quick_notes,
                        dates: t.dates || {},
                        updates: t.updates || [],
                        observations: t.observations || []
                    } as Tender;
                });

                // ORDENAÇÃO CIRÚRGICA: Prioriza os itens do initialTenders para manter "Ração" no topo
                const coreIds = initialTenders.map(it => it.id);
                const sortedTenders = [...mappedTenders].sort((a, b) => {
                    const idxA = coreIds.indexOf(a.id);
                    const idxB = coreIds.indexOf(b.id);

                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    if (idxA !== -1) return -1;
                    if (idxB !== -1) return 1;
                    return 0;
                });

                const newConfStatuses: Record<string, 'OK' | 'Pendente'> = {};
                const newDateChecks: Record<string, Record<string, boolean>> = {};
                cloudTenders.forEach(t => {
                    if (t.verification_status) newConfStatuses[t.id] = t.verification_status as 'OK' | 'Pendente';
                    const backupChecks = t.dates?._audit_trail_checks || {};
                    const finalChecks = (t.date_checks && Object.keys(t.date_checks).length > 0)
                        ? t.date_checks
                        : backupChecks;
                    if (Object.keys(finalChecks).length > 0) {
                        newDateChecks[t.id] = finalChecks;
                    }
                });

                if (skipGoldCheck || sortedTenders.some(t => t.nup && t.nup.length > 5)) {
                    setTenders(sortedTenders);
                    setConferenceStatuses(newConfStatuses);
                    setDateChecks(newDateChecks);
                    if (cloudPregoeiros.length > 0) setPregoeiros(cloudPregoeiros);
                    if (cloudSupervisors.length > 0) setSupervisors(cloudSupervisors);
                    if (cloudPeople.length > 0) setPeople(cloudPeople);
                }
            }
            setCloudStatus(prev => ({ ...prev, isConnected: true, lastSync: new Date(), status: 'online', message: 'Sincronizado' }));
        } catch (err: any) {
            setCloudStatus(prev => ({ ...prev, status: 'error', isConnected: false, message: err.message }));
        }
    }, []); // Estabilizado

    // Carregamento Inicial (Tenta sincronizar com o Cloud se disponível)
    useEffect(() => {
        if (supabase) {
            loadDataFromCloud(true);
        }
        setIsLoaded(true);
    }, [loadDataFromCloud]);

    // Persistência Local
    useEffect(() => { if (isLoaded) localStorage.setItem('radar_tenders_data', JSON.stringify(tenders)); }, [tenders, isLoaded]);
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('radar_conference_statuses', JSON.stringify(conferenceStatuses));
            localStorage.setItem('radar_date_checks', JSON.stringify(dateChecks));
            localStorage.setItem('radar_people_data', JSON.stringify(people));
            localStorage.setItem('radar_pregoeiros_data', JSON.stringify(pregoeiros));
            localStorage.setItem('radar_supervisors_data', JSON.stringify(supervisors));
        }
    }, [conferenceStatuses, dateChecks, people, pregoeiros, supervisors, isLoaded]);

    // ====== AUTO-SYNC: qualquer edição (tenders, conferências, datas) dispara salvar no Supabase ======
    // Debounce de 1.5s para não sobrecarregar o banco com cada tecla pressionada
    useEffect(() => {
        if (!isLoaded || !supabase || tenders.length === 0) return;
        if (autoSyncTimeoutRef.current) clearTimeout(autoSyncTimeoutRef.current);
        autoSyncTimeoutRef.current = setTimeout(async () => {
            try {
                const allTeamIds = new Set([...pregoeiros.map(p => p.id), ...supervisors.map(s => s.id), ...people.map(p => p.id)]);
                const getSafeId = (id: string | undefined | null) => (id && allTeamIds.has(id)) ? id : null;
                const tendersToUpload = tenders.map(t => ({
                    id: t.id, uasg: t.uasg, number: t.number, nup: t.nup, description: t.description, department: t.department,
                    opening_date: t.openingDate, estimated_value: t.estimatedValue, status: t.status, current_stage: t.currentStage,
                    has_issues: t.hasIssues, is_gcalc: t.isGCALC, commitment: t.commitment, requester_sector: t.requesterSector,
                    coordinator: t.coordinator, coord: t.coord, section: t.section, responsible_internal: t.responsibleInternal,
                    responsible_external: t.responsibleExternal, bi_publication: t.biPublication, optimization_notes: t.optimizationNotes,
                    next_deadline: t.nextDeadline, next_activity: t.nextActivity, intercurrences: t.intercurrences,
                    last_updated_by: t.lastUpdatedBy, quick_notes: t.quickNotes,
                    verification_status: conferenceStatuses[t.id] || t.verificationStatus || 'Pendente',
                    assigned_pregoeiro_id: getSafeId(t.assignedPregoeiroId),
                    pregoeiro_fase_interna_id: getSafeId(t.pregoeiroFaseInternaId),
                    pregoeiro_fase_externa_id: getSafeId(t.pregoeiroFaseExternaId),
                    dates: t.dates || {},
                    updates: t.updates || [], observations: t.observations || []
                }));
                await supabase.from('tenders').upsert(tendersToUpload, { onConflict: 'id' });
                // Salvar date_checks separadamente na tabela própria
                for (const t of tenders) {
                    const checks = dateChecks[t.id];
                    if (checks && Object.keys(checks).length > 0) {
                        for (const [dateKey, isChecked] of Object.entries(checks)) {
                            await supabase.from('date_checks').upsert(
                                { tender_id: t.id, date_key: dateKey, is_checked: isChecked },
                                { onConflict: 'tender_id,date_key' }
                            );
                        }
                    }
                }
                setCloudStatus(prev => ({ ...prev, isConnected: true, lastSync: new Date(), status: 'online', totalRecords: tenders.length }));
            } catch (err: any) {
                console.error('[AutoSync] Erro ao sincronizar com Supabase:', err.message);
            }
        }, 1500);
        return () => { if (autoSyncTimeoutRef.current) clearTimeout(autoSyncTimeoutRef.current); };
    }, [tenders, conferenceStatuses, dateChecks, isLoaded, pregoeiros, supervisors, people]);

    const forceCloudSync = useCallback(async () => {
        if (!supabase) return;
        setCloudStatus(prev => ({ ...prev, status: 'syncing' }));
        try {
            const allTeamIds = new Set([...pregoeiros.map(p => p.id), ...supervisors.map(s => s.id), ...people.map(p => p.id)]);
            const getSafeId = (id: string | undefined | null) => (id && allTeamIds.has(id)) ? id : null;

            const tendersToUpload = tenders.map(t => ({
                id: t.id, uasg: t.uasg, number: t.number, nup: t.nup, description: t.description, department: t.department, opening_date: t.openingDate, estimated_value: t.estimatedValue, status: t.status, current_stage: t.currentStage, has_issues: t.hasIssues, is_gcalc: t.isGCALC, commitment: t.commitment, requester_sector: t.requesterSector, coordinator: t.coordinator, coord: t.coord, section: t.section, responsible_internal: t.responsibleInternal, responsible_external: t.responsibleExternal, bi_publication: t.biPublication, optimization_notes: t.optimizationNotes, next_deadline: t.nextDeadline, next_activity: t.nextActivity, intercurrences: t.intercurrences, last_updated_by: t.lastUpdatedBy, quick_notes: t.quickNotes, verification_status: conferenceStatuses[t.id] || t.verificationStatus || 'Pendente', assigned_pregoeiro_id: getSafeId(t.assignedPregoeiroId), pregoeiro_fase_interna_id: getSafeId(t.pregoeiroFaseInternaId), pregoeiro_fase_externa_id: getSafeId(t.pregoeiroFaseExternaId), dates: t.dates || {}, updates: t.updates || [], observations: t.observations || []
            }));

            const teamToUpload = [
                ...pregoeiros.map(p => ({ id: p.id, name: p.name, email: p.email, whatsapp: p.whatsapp, role: p.role, type: 'pregoeiro', om: (p as any).om || "" })),
                ...supervisors.map(s => ({ id: s.id, name: s.name, email: s.email, whatsapp: s.whatsapp, role: s.role, type: 'supervisor', om: s.organization || "" })),
                ...people.map(p => ({ id: p.id, name: p.name, email: p.email, whatsapp: p.whatsapp, role: p.role, type: 'requisitante', om: p.sector || "" }))
            ];
            await supabase.from('team_members').upsert(teamToUpload);
            await supabase.from('tenders').upsert(tendersToUpload, { onConflict: 'id' });
            setCloudStatus({ isConnected: true, lastSync: new Date(), totalRecords: tenders.length, status: 'online' });
        } catch (err: any) {
            setCloudStatus(prev => ({ ...prev, status: 'error', isConnected: false, message: err.message }));
        }
    }, [tenders, pregoeiros, supervisors, people, conferenceStatuses, dateChecks]);

    const saveHistory = useCallback(() => {
        setHistory(prev => [{ tenders: [...tenders], conferenceStatuses: { ...conferenceStatuses }, dateChecks: { ...dateChecks } }, ...prev].slice(0, 50));
    }, [tenders, conferenceStatuses, dateChecks]);

    const undo = useCallback(() => {
        if (history.length === 0) return;
        const [prev, ...rest] = history;
        setTenders(prev.tenders);
        setConferenceStatuses(prev.conferenceStatuses);
        setDateChecks(prev.dateChecks);
        setHistory(rest);
    }, [history]);

    const toggleConferenceColumn = useCallback(() => setShowConferenceColumn(prev => !prev), []);
    const setConferenceStatus = useCallback((id: string, status: 'OK' | 'Pendente') => {
        saveHistory();
        setConferenceStatuses(prev => ({ ...prev, [id]: status }));
    }, [saveHistory]);

    const bulkSetConferenceStatus = useCallback((status: 'OK' | 'Pendente') => {
        saveHistory();
        const next: Record<string, 'OK' | 'Pendente'> = {};
        tenders.forEach(t => next[t.id] = status);
        setConferenceStatuses(next);
    }, [tenders, saveHistory]);

    const toggleDateCheck = useCallback((tenderId: string, dateKey: string) => {
        saveHistory();
        setDateChecks(prev => ({ ...prev, [tenderId]: { ...(prev[tenderId] || {}), [dateKey]: !(prev[tenderId]?.[dateKey]) } }));
    }, [saveHistory]);

    const deleteTender = useCallback((id: string) => {
        if (confirm("🚨 Excluir pregão?")) {
            saveHistory();
            setTenders(prev => prev.filter(t => t.id !== id));
            // Deletar do Supabase imediatamente
            if (supabase) supabase.from('tenders').delete().eq('id', id).then(({ error }) => {
                if (error) console.error('[Delete] Erro ao deletar do Supabase:', error.message);
            });
        }
    }, [saveHistory]);

    const addTenderBelow = useCallback((id: string) => {
        saveHistory();
        setTenders(prev => {
            const idx = prev.findIndex(t => t.id === id);
            if (idx === -1) return prev;
            const nt: Tender = { id: `tender-manual-${Date.now()}`, uasg: "160136", number: "A definir", description: "Nova Licitação", department: "18º B Trnp", openingDate: new Date().toISOString(), status: "FASE INTERNA NA OMDS", currentStage: "1. Entrada do TR na SAL", hasIssues: false, isGCALC: false, coord: "CAF", coordinator: "CAF", nup: "", dates: {}, updates: [], observations: [] };
            const list = [...prev];
            list.splice(idx + 1, 0, nt);
            return list;
        });
    }, [saveHistory]);

    const addPerson = useCallback((d: Omit<Person, 'id'>) => setPeople(prev => [...prev, { ...d, id: `person-${Date.now()}` }]), []);
    const updatePerson = useCallback((id: string, u: Partial<Person>) => setPeople(prev => prev.map(p => p.id === id ? { ...p, ...u } : p)), []);
    const deletePerson = useCallback((id: string) => confirm("Remover contato?") && setPeople(prev => prev.filter(p => p.id !== id)), []);

    const addPregoeiro = useCallback((d: Omit<Pregoeiro, 'id'>) => setPregoeiros(prev => [...prev, { ...d, id: `pregoeiro-${Date.now()}` }]), []);
    const updatePregoeiro = useCallback((id: string, u: Partial<Pregoeiro>) => setPregoeiros(prev => prev.map(p => p.id === id ? { ...p, ...u } : p)), []);
    const deletePregoeiro = useCallback((id: string) => {
        if (confirm("Remover pregoeiro?")) {
            setTenders(prev => prev.map(t => (t.assignedPregoeiroId === id || t.pregoeiroFaseInternaId === id || t.pregoeiroFaseExternaId === id) ? { ...t, assignedPregoeiroId: t.assignedPregoeiroId === id ? undefined : t.assignedPregoeiroId, pregoeiroFaseInternaId: t.pregoeiroFaseInternaId === id ? undefined : t.pregoeiroFaseInternaId, pregoeiroFaseExternaId: t.pregoeiroFaseExternaId === id ? undefined : t.pregoeiroFaseExternaId } : t));
            setPregoeiros(prev => prev.filter(p => p.id !== id));
        }
    }, []);

    const addSupervisor = useCallback((d: Omit<Supervisor, 'id'>) => setSupervisors(prev => [...prev, { ...d, id: `supervisor-${Date.now()}` }]), []);
    const updateSupervisor = useCallback((id: string, u: Partial<Supervisor>) => setSupervisors(prev => prev.map(s => s.id === id ? { ...s, ...u } : s)), []);
    const deleteSupervisor = useCallback((id: string) => confirm("Remover supervisor?") && setSupervisors(prev => prev.filter(s => s.id !== id)), []);

    const assignTenderToPregoeiro = useCallback((tid: string, pid: string, ph: 'interna' | 'externa') => {
        saveHistory();
        setTenders(prev => prev.map(t => t.id === tid ? { ...t, [ph === 'interna' ? 'pregoeiroFaseInternaId' : 'pregoeiroFaseExternaId']: pid === 'none' ? undefined : pid } : t));
    }, [saveHistory]);

    const updateTender = useCallback((id: string, updates: Partial<Tender>, editorName?: string) => {
        setTenders(prev => prev.map(t => t.id === id ? { ...t, ...updates, lastUpdatedAt: new Date().toISOString(), lastUpdatedBy: editorName || t.lastUpdatedBy } : t));
    }, []);

    const saveAndUpdateTender = useCallback((id: string, updates: Partial<Tender>, editorName?: string) => {
        saveHistory();
        updateTender(id, updates, editorName);
    }, [saveHistory, updateTender]);

    const refreshTender = useCallback((id: string, editorName?: string) => {
        saveHistory();
        setTenders(prev => prev.map(t => t.id === id ? { ...t, lastUpdatedAt: new Date().toISOString(), lastUpdatedBy: editorName || t.lastUpdatedBy } : t));
    }, [saveHistory]);

    const importTendersFromCSV = useCallback((imported: Partial<Tender>[]) => {
        saveHistory();
        setTenders(() => imported.map((it, idx) => ({
            id: `tender-imported-${Date.now()}-${idx}`, uasg: it.uasg || "160136", number: it.number || "00/0000", description: it.description || "Sem descrição", status: it.status || "FASE INTERNA NA OMDS", currentStage: it.currentStage || "1. Entrada do TR na SAL", hasIssues: false, department: it.department || "18º B Trnp", openingDate: it.openingDate || new Date().toISOString(), nup: it.nup || "", commitment: it.commitment, coordinator: it.coordinator, requesterSector: it.requesterSector, dates: it.dates || {}, quickNotes: it.quickNotes, updates: [], observations: []
        })) as Tender[]);
        alert(`✅ Importação concluída! ${imported.length} processos carregados.`);
    }, [saveHistory]);

    const resetToOriginalData = useCallback(() => {
        if (confirm("🚨 Resetar tudo?")) {
            localStorage.clear();
            window.location.reload();
        }
    }, []);

    return (
        <TendersContext.Provider value={{
            tenders, searchQuery, setSearchQuery, statusFilter, setStatusFilter, nupFilter, setNupFilter, commitmentFilter, setCommitmentFilter, coordinatorFilter, setCoordinatorFilter, requesterSectorFilter, setRequesterSectorFilter, updateTender: saveAndUpdateTender, refreshTender, showConferenceColumn, toggleConferenceColumn, conferenceStatuses, setConferenceStatus, bulkSetConferenceStatus, dateChecks, toggleDateCheck, deleteTender, addTenderBelow, undo, canUndo: history.length > 0, historyCount: history.length, resetToOriginalData, objectFilter, setObjectFilter, people, addPerson, updatePerson, deletePerson, pregoeiros, addPregoeiro, updatePregoeiro, deletePregoeiro, assignTenderToPregoeiro, supervisors, addSupervisor, updateSupervisor, deleteSupervisor, highlightId, setHighlightId, cloudStatus, forceCloudSync, pullDataFromCloud: loadDataFromCloud, importTendersFromCSV
        }}>
            {children}
        </TendersContext.Provider>
    );
}

export function useTenders() {
    const context = useContext(TendersContext);
    if (context === undefined) throw new Error('useTenders must be used within a TendersProvider');
    return context;
}
