"use client"

import { createContext, useContext, useState, ReactNode } from 'react';
import { Tender } from '@/types';
import { tenders as initialTenders } from '@/lib/data';

interface TendersContextType {
    tenders: Tender[];
    updateTender: (id: string, updates: Partial<Tender>) => void;
}

const TendersContext = createContext<TendersContextType | undefined>(undefined);

export function TendersProvider({ children }: { children: ReactNode }) {
    const [tenders, setTenders] = useState<Tender[]>(initialTenders);

    const updateTender = (id: string, updates: Partial<Tender>) => {
        setTenders(prevTenders =>
            prevTenders.map(tender =>
                tender.id === id ? { ...tender, ...updates } : tender
            )
        );
    };

    return (
        <TendersContext.Provider value={{ tenders, updateTender }}>
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
