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
    const { tenders } = useTenders();
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [logs, setLogs] = useState<NotificationLog[]>([]);

    // Carregar dados salvos
    useEffect(() => {
        const savedSubs = localStorage.getItem('radar_subscribers');
        const savedLogs = localStorage.getItem('radar_logs');

        if (savedSubs) {
            setSubscribers(JSON.parse(savedSubs));
        } else {
            // Mock inicial apenas se não houver nada
            setSubscribers([{
                id: '1',
                name: 'Maj Silva',
                email: 'silva@eb.mil.br',
                phone: '67999999999',
                department: 'Ordenador de Despesas',
                preferences: { email: true, whatsapp: true, sms: false },
                createdAt: new Date().toISOString()
            }]);
        }

        if (savedLogs) {
            setLogs(JSON.parse(savedLogs));
        }
    }, []);

    // Salvar mudanças
    useEffect(() => {
        if (subscribers.length > 0) {
            localStorage.setItem('radar_subscribers', JSON.stringify(subscribers));
        }
    }, [subscribers]);

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
