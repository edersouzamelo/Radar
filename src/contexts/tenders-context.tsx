"use client"

import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { Tender, Person, Pregoeiro, Supervisor, UserRole } from '@/types';
import { tenders as initialTenders } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { useUser } from './user-context';

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
        totalTenders: number;
        totalDates: number;
        totalPeople: number;
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

    const [showConferenceColumn, setShowConferenceColumn] = useState(true);
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
        totalTenders: 0,
        totalDates: 0,
        totalPeople: 0,
        status: 'offline'
    });

    const hasUserInteracted = useRef(false);
    const autoSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
                const mappedTenders: Tender[] = cloudTenders.map(t => ({
                    id: t.id, uasg: t.uasg, number: t.number, nup: t.nup, description: t.description, department: t.department,
                    openingDate: t.opening_date, estimatedValue: t.estimated_value, status: t.status, currentStage: t.current_stage,
                    hasIssues: t.has_issues, isGCALC: t.is_gcalc, commitment: t.commitment, requesterSector: t.requester_sector,
                    coordinator: t.coordinator, coord: t.coord, section: t.section, responsibleInternal: t.responsible_internal,
                    responsibleExternal: t.responsible_external, biPublication: t.bi_publication, optimizationNotes: t.optimization_notes,
                    nextDeadline: t.next_deadline, nextActivity: t.next_activity, intercurrences: t.intercurrences,
                    lastUpdatedBy: t.last_updated_by, lastUpdatedAt: t.updated_at, verificationStatus: t.verification_status,
                    assignedPregoeiroId: t.assigned_pregoeiro_id, pregoeiroFaseInternaId: t.pregoeiro_fase_interna_id,
                    pregoeiroFaseExternaId: t.pregoeiro_fase_externa_id, quickNotes: t.quick_notes,
                    dates: t.dates || {}, updates: t.updates || [], observations: t.observations || []
                } as Tender));

                // Resgate de checks legados
                const { data: legacyChecks } = await supabase.from('date_checks').select('*');
                const newConfStatuses: Record<string, 'OK' | 'Pendente'> = {};
                const newDateChecks: Record<string, Record<string, boolean>> = {};

                cloudTenders.forEach(t => {
                    if (t.verification_status) newConfStatuses[t.id] = t.verification_status as 'OK' | 'Pendente';
                    const jsonbChecks = t.dates?._date_checks || t.dates?._audit_trail_checks || {};
                    const tenderLegacyChecks: Record<string, boolean> = {};
                    legacyChecks?.filter(lc => lc.tender_id === t.id).forEach(lc => {
                        tenderLegacyChecks[lc.date_key] = lc.is_checked;
                    });
                    newDateChecks[t.id] = { ...tenderLegacyChecks, ...jsonbChecks };
                });

                setTenders(mappedTenders);
                setConferenceStatuses(newConfStatuses);
                setDateChecks(newDateChecks);
                if (cloudPregoeiros.length > 0) setPregoeiros(cloudPregoeiros);
                if (cloudSupervisors.length > 0) setSupervisors(cloudSupervisors);
                if (cloudPeople.length > 0) setPeople(cloudPeople);

                setCloudStatus({
                    isConnected: true, status: 'online', lastSync: new Date(),
                    totalTenders: mappedTenders.length,
                    totalDates: Object.values(newDateChecks).reduce((acc, curr) => acc + Object.keys(curr).length, 0),
                    totalPeople: cloudPregoeiros.length + cloudSupervisors.length + cloudPeople.length,
                    totalRecords: mappedTenders.length + cloudPregoeiros.length + cloudSupervisors.length + cloudPeople.length
                });
            }
        } catch (err: any) {
            setCloudStatus(prev => ({ ...prev, status: 'error', isConnected: false, message: err.message }));
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        async function init() {
            if (supabase) {
                console.log("[Radar] Carga inicial profunda...");
                await loadDataFromCloud(true);
            }
            if (isMounted) setIsLoaded(true);
        }
        init();
        return () => { isMounted = false; };
    }, [loadDataFromCloud]);

    useEffect(() => {
        if (!isLoaded || !supabase || !hasUserInteracted.current) return;
        if (autoSyncTimeoutRef.current) clearTimeout(autoSyncTimeoutRef.current);
        autoSyncTimeoutRef.current = setTimeout(async () => {
            try {
                const teamToUpload = [
                    ...pregoeiros.map(p => ({ id: p.id, name: p.name, email: p.email, whatsapp: p.whatsapp, role: p.role, type: 'pregoeiro', om: (p as any).om || "" })),
                    ...supervisors.map(s => ({ id: s.id, name: s.name, email: s.email, whatsapp: s.whatsapp, role: s.role, type: 'supervisor', om: s.organization || "" })),
                    ...people.map(p => ({ id: p.id, name: p.name, email: p.email, whatsapp: p.whatsapp, role: p.role, type: 'requisitante', om: p.sector || "" }))
                ];
                if (teamToUpload.length > 0) await supabase.from('team_members').upsert(teamToUpload);

                const tendersToUpload = tenders.map(t => ({
                    id: t.id, uasg: t.uasg, number: t.number, nup: t.nup, description: t.description, department: t.department,
                    opening_date: t.openingDate, estimated_value: t.estimatedValue, status: t.status, current_stage: t.currentStage,
                    has_issues: t.hasIssues, is_gcalc: t.isGCALC, commitment: t.commitment, requester_sector: t.requesterSector,
                    coordinator: t.coordinator, coord: t.coord, section: t.section, responsible_internal: t.responsibleInternal,
                    responsible_external: t.responsibleExternal, bi_publication: t.biPublication, optimization_notes: t.optimizationNotes,
                    next_deadline: t.nextDeadline, next_activity: t.nextActivity, intercurrences: t.intercurrences,
                    last_updated_by: t.lastUpdatedBy, quick_notes: t.quickNotes,
                    verification_status: conferenceStatuses[t.id] || 'Pendente',
                    assigned_pregoeiro_id: t.assignedPregoeiroId, pregoeiro_fase_interna_id: t.pregoeiroFaseInternaId,
                    pregoeiro_fase_externa_id: t.pregoeiroFaseExternaId,
                    dates: { ...(t.dates || {}), _date_checks: dateChecks[t.id] || {} },
                    updates: t.updates || [], observations: t.observations || []
                }));
                await supabase.from('tenders').upsert(tendersToUpload, { onConflict: 'id' });

                setCloudStatus(prev => ({ ...prev, lastSync: new Date(), status: 'online' }));
            } catch (err: any) {
                console.error('[AutoSync] Erro:', err.message);
            }
        }, 1500);
    }, [tenders, conferenceStatuses, dateChecks, isLoaded, pregoeiros, supervisors, people]);

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
    const { role: userRole, hasPermission } = useUser();

    const updateTender = useCallback((id: string, updates: Partial<Tender>, editorName?: string) => {
        if (!hasPermission('edit_tenders') && userRole !== 'Administrador') return;
        hasUserInteracted.current = true;
        setTenders(prev => prev.map(t => t.id === id ? { ...t, ...updates, lastUpdatedAt: new Date().toISOString(), lastUpdatedBy: editorName || t.lastUpdatedBy } : t));
    }, [hasPermission, userRole]);

    const setConferenceStatus = useCallback((id: string, status: 'OK' | 'Pendente') => {
        if (!hasPermission('bulk_check') && userRole !== 'Administrador') return;
        hasUserInteracted.current = true;
        setConferenceStatuses(prev => ({ ...prev, [id]: status }));
    }, [hasPermission, userRole]);

    const bulkSetConferenceStatus = useCallback((status: 'OK' | 'Pendente') => {
        if (!hasPermission('bulk_check') && userRole !== 'Administrador') return;
        hasUserInteracted.current = true;
        const next: Record<string, 'OK' | 'Pendente'> = {};
        tenders.forEach(t => next[t.id] = status);
        setConferenceStatuses(next);
    }, [tenders, hasPermission, userRole]);

    const toggleDateCheck = useCallback((tenderId: string, dateKey: string) => {
        hasUserInteracted.current = true;
        setDateChecks(prev => ({ ...prev, [tenderId]: { ...(prev[tenderId] || {}), [dateKey]: !(prev[tenderId]?.[dateKey]) } }));
    }, []);

    const deleteTender = useCallback((id: string) => {
        if (userRole !== 'Administrador') return;
        if (confirm("🚨 Excluir?")) {
            hasUserInteracted.current = true;
            setTenders(prev => prev.filter(t => t.id !== id));
            if (supabase) supabase.from('tenders').delete().eq('id', id);
        }
    }, [userRole]);

    const addTenderBelow = useCallback((id: string) => {
        hasUserInteracted.current = true;
        setTenders(prev => {
            const idx = prev.findIndex(t => t.id === id);
            if (idx === -1) return prev;
            const nt: Tender = { id: `tender-manual-${Date.now()}`, uasg: "160136", number: "A definir", description: "Nova Licitação", department: "18º B Trnp", openingDate: new Date().toISOString(), status: "FASE INTERNA NA OMDS", currentStage: "1. Entrada do TR na SAL", hasIssues: false, isGCALC: false, coord: "CAF", coordinator: "CAF", nup: "", dates: {}, updates: [], observations: [] };
            const list = [...prev];
            list.splice(idx + 1, 0, nt);
            return list;
        });
    }, []);

    const addPerson = useCallback((d: Omit<Person, 'id'>) => { hasUserInteracted.current = true; setPeople(prev => [...prev, { ...d, id: `person-${Date.now()}` }]); }, []);
    const updatePerson = useCallback((id: string, u: Partial<Person>) => { hasUserInteracted.current = true; setPeople(prev => prev.map(p => p.id === id ? { ...p, ...u } : p)); }, []);
    const deletePerson = useCallback((id: string) => { hasUserInteracted.current = true; setPeople(prev => prev.filter(p => p.id !== id)); }, []);

    const addPregoeiro = useCallback((d: Omit<Pregoeiro, 'id'>) => { hasUserInteracted.current = true; setPregoeiros(prev => [...prev, { ...d, id: `pregoeiro-${Date.now()}` }]); }, []);
    const updatePregoeiro = useCallback((id: string, u: Partial<Pregoeiro>) => { hasUserInteracted.current = true; setPregoeiros(prev => prev.map(p => p.id === id ? { ...p, ...u } : p)); }, []);
    const deletePregoeiro = useCallback((id: string) => { hasUserInteracted.current = true; setPregoeiros(prev => prev.filter(p => p.id !== id)); }, []);

    const addSupervisor = useCallback((d: Omit<Supervisor, 'id'>) => { hasUserInteracted.current = true; setSupervisors(prev => [...prev, { ...d, id: `supervisor-${Date.now()}` }]); }, []);
    const updateSupervisor = useCallback((id: string, u: Partial<Supervisor>) => { hasUserInteracted.current = true; setSupervisors(prev => prev.map(s => s.id === id ? { ...s, ...u } : s)); }, []);
    const deleteSupervisor = useCallback((id: string) => { hasUserInteracted.current = true; setSupervisors(prev => prev.filter(s => s.id !== id)); }, []);

    const assignTenderToPregoeiro = useCallback((tid: string, pid: string, ph: 'interna' | 'externa') => {
        hasUserInteracted.current = true;
        setTenders(prev => prev.map(t => t.id === tid ? { ...t, [ph === 'interna' ? 'pregoeiroFaseInternaId' : 'pregoeiroFaseExternaId']: pid === 'none' ? undefined : pid } : t));
    }, []);

    const importTendersFromCSV = useCallback((imported: Partial<Tender>[]) => {
        hasUserInteracted.current = true;
        setTenders(() => imported.map((it, idx) => ({ ...it, id: `imported-${Date.now()}-${idx}` } as Tender)));
    }, []);

    const resetToOriginalData = useCallback(() => { if (confirm("🚨 Resetar tudo?")) { localStorage.clear(); window.location.reload(); } }, []);

    return (
        <TendersContext.Provider value={{
            tenders, searchQuery, setSearchQuery, statusFilter, setStatusFilter, nupFilter, setNupFilter, commitmentFilter, setCommitmentFilter, coordinatorFilter, setCoordinatorFilter, requesterSectorFilter, setRequesterSectorFilter, updateTender, refreshTender: () => { }, showConferenceColumn, toggleConferenceColumn, conferenceStatuses, setConferenceStatus, bulkSetConferenceStatus, dateChecks, toggleDateCheck, deleteTender, addTenderBelow, undo, canUndo: history.length > 0, historyCount: history.length, resetToOriginalData, objectFilter, setObjectFilter, people, addPerson, updatePerson, deletePerson, pregoeiros, addPregoeiro, updatePregoeiro, deletePregoeiro, assignTenderToPregoeiro, supervisors, addSupervisor, updateSupervisor, deleteSupervisor, highlightId, setHighlightId, cloudStatus, forceCloudSync: async () => { }, pullDataFromCloud: loadDataFromCloud, importTendersFromCSV
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
