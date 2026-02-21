"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Subscriber, NotificationLog } from '@/types';
import { useTenders } from './tenders-context';

interface NotificationsContextType {
    subscribers: Subscriber[];
    logs: NotificationLog[];
    addSubscriber: (subscriber: Omit<Subscriber, 'id' | 'createdAt'>) => void;
    removeSubscriber: (id: string) => void;
    checkAndSendNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const { tenders, people, pregoeiros } = useTenders();
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [logs, setLogs] = useState<NotificationLog[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Carregar dados salvos
    useEffect(() => {
        const savedSubs = localStorage.getItem('radar_subscribers');
        const savedLogs = localStorage.getItem('radar_logs');

        if (savedSubs) {
            setSubscribers(JSON.parse(savedSubs));
        } else {
            // Mock inicial removido em favor da sincronização automática
            setSubscribers([]);
        }

        if (savedLogs) {
            setLogs(JSON.parse(savedLogs));
        }
        setIsLoaded(true);
    }, []);

    // SINCRONIZAÇÃO AUTOMÁTICA: Vínculos -> Alertas
    useEffect(() => {
        if (!isLoaded) return;

        setSubscribers(prev => {
            // 1. Filtrar inscritos manuais (os que NÃO começam com 'sync-')
            const manualSubscribers = prev.filter(s => !s.id.startsWith('sync-'));

            // 2. Criar lista de inscritos sincronizados a partir de people e pregoeiros
            const syncedSubscribers: Subscriber[] = [
                ...people.map(p => {
                    const id = `sync-person-${p.id}`;
                    const existing = prev.find(s => s.id === id);
                    return {
                        id,
                        name: p.name,
                        email: p.email,
                        phone: p.whatsapp,
                        department: p.sector || 'Integrante',
                        // Preserva preferências se já existirem, senão usa padrão
                        preferences: existing?.preferences || { email: true, whatsapp: true, sms: false },
                        createdAt: existing?.createdAt || new Date().toISOString()
                    };
                }),
                ...pregoeiros.map(p => {
                    const id = `sync-pregoeiro-${p.id}`;
                    const existing = prev.find(s => s.id === id);
                    return {
                        id,
                        name: p.name,
                        email: p.email,
                        phone: p.whatsapp,
                        department: 'Pregoeiro',
                        preferences: existing?.preferences || { email: true, whatsapp: true, sms: false },
                        createdAt: existing?.createdAt || new Date().toISOString()
                    };
                })
            ];

            // Reconciliação: preservamos os manuais e injetamos a lista atual de synced (com prefs preservadas)
            return [...manualSubscribers, ...syncedSubscribers];
        });
    }, [people, pregoeiros, isLoaded]);

    // Salvar mudanças
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('radar_subscribers', JSON.stringify(subscribers));
        }
    }, [subscribers, isLoaded]);

    useEffect(() => {
        if (logs.length > 0) {
            localStorage.setItem('radar_logs', JSON.stringify(logs));
        }
    }, [logs]);

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

    const checkAndSendNotifications = async () => {
        const today = new Date();
        const newLogs: NotificationLog[] = [];

        for (const tender of tenders) {
            const openingDate = new Date(tender.openingDate);
            const diffDays = Math.ceil((openingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if ([30, 5, 0].includes(diffDays)) {
                for (const sub of subscribers) {
                    const type = diffDays === 30 ? '30_days' : diffDays === 5 ? '5_days' : 'deadline';

                    if (sub.preferences.email) {
                        try {
                            const response = await fetch('/api/notifications/email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    to: sub.email,
                                    subject: `ALERTA RADAR: Pregão ${tender.number} - Faltam ${diffDays} dias`,
                                    html: `
                                        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
                                            <h2 style="color: #1A1A1A;">Olá, ${sub.name}!</h2>
                                            <p>Este é um alerta automático do sistema <strong>RADAR</strong>.</p>
                                            <p>O <strong>Pregão nº ${tender.number}</strong> (UASG ${tender.uasg}) possui abertura prevista para <strong>${new Date(tender.openingDate).toLocaleDateString('pt-BR')}</strong>.</p>
                                            <hr />
                                            <p><strong>Status:</strong> Faltam ${diffDays} dias.</p>
                                            <p>Por favor, verifique se toda a documentação está protocolada na SALC.</p>
                                        </div>
                                    `
                                })
                            });

                            const result = await response.json();

                            newLogs.push({
                                id: Math.random().toString(36).substr(2, 9),
                                subscriberId: sub.id,
                                subscriberName: sub.name,
                                tenderNumber: tender.number,
                                channel: 'email',
                                type,
                                sentAt: new Date().toISOString(),
                                status: result.success ? 'sent' : 'failed'
                            });
                        } catch (error) {
                            console.error('Error sending email:', error);
                        }
                    }
                }
            }
        }

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
