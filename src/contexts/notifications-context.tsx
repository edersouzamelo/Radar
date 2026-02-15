"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Subscriber, NotificationLog } from '@/types';
import { useTenders } from './tenders-context';

interface NotificationsContextType {
    subscribers: Subscriber[];
    logs: NotificationLog[];
    addSubscriber: (subscriber: Omit<Subscriber, 'id' | 'createdAt'>) => void;
    removeSubscriber: (id: string) => void;
    checkAndSendNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const { tenders } = useTenders();
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [logs, setLogs] = useState<NotificationLog[]>([]);

    // Carregar dados iniciais (Mock)
    useEffect(() => {
        const mockSubscribers: Subscriber[] = [
            {
                id: '1',
                name: 'Maj Silva',
                email: 'silva@eb.mil.br',
                phone: '67999999999',
                department: 'Ordenador de Despesas',
                preferences: { email: true, whatsapp: true, sms: false },
                createdAt: new Date().toISOString()
            }
        ];
        setSubscribers(mockSubscribers);
    }, []);

    const addSubscriber = (newSub: Omit<Subscriber, 'id' | 'createdAt'>) => {
        const subscriber: Subscriber = {
            ...newSub,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString()
        };
        setSubscribers(prev => [...prev, subscriber]);
    };

    const removeSubscriber = (id: string) => {
        setSubscribers(prev => prev.filter(s => s.id !== id));
    };

    const checkAndSendNotifications = () => {
        const today = new Date();
        const newLogs: NotificationLog[] = [];

        tenders.forEach(tender => {
            const openingDate = new Date(tender.openingDate);
            const diffDays = Math.ceil((openingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if ([30, 5, 0].includes(diffDays)) {
                subscribers.forEach(sub => {
                    const type = diffDays === 30 ? '30_days' : diffDays === 5 ? '5_days' : 'deadline';

                    // Simular envio e log
                    if (sub.preferences.email) {
                        newLogs.push({
                            id: Math.random().toString(36).substr(2, 9),
                            subscriberId: sub.id,
                            subscriberName: sub.name,
                            tenderNumber: tender.number,
                            channel: 'email',
                            type,
                            sentAt: new Date().toISOString(),
                            status: 'sent'
                        });
                    }
                });
            }
        });

        if (newLogs.length > 0) {
            setLogs(prev => [...newLogs, ...prev]);
        }
    };

    return (
        <NotificationsContext.Provider value={{
            subscribers,
            logs,
            addSubscriber,
            removeSubscriber,
            checkAndSendNotifications
        }}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationsContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationsProvider');
    }
    return context;
}
