"use client"

import { createContext, useContext, useState, ReactNode } from 'react';
import { Tender } from '@/types';
import { tenders as initialTenders } from '@/lib/data';

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
    updateTender: (id: string, updates: Partial<Tender>) => void;
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

    const updateTender = (id: string, updates: Partial<Tender>) => {
        setTenders(prevTenders =>
            prevTenders.map(tender =>
                tender.id === id ? { ...tender, ...updates } : tender
            )
        );
    };

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
            updateTender
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
