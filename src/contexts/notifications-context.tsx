"use client"

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
    const { tenders, people, pregoeiros, supervisors } = useTenders();
    const [manualSubscribers, setManualSubscribers] = useState<Subscriber[]>([]);
    const [logs, setLogs] = useState<NotificationLog[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Carregar logs salvos (Logs podem continuar no localStorage ou ir pro DB no futuro)
    useEffect(() => {
        const savedLogs = localStorage.getItem('radar_logs');
        if (savedLogs) setLogs(JSON.parse(savedLogs));
        setIsLoaded(true);
    }, []);

    // DERIVAÇÃO UNIFICADA: Os subscritores são SEMPRE os membros da equipe + manuais
    const subscribers = useMemo(() => {
        const synced: Subscriber[] = [
            ...pregoeiros.map(p => ({
                id: `team-${p.id}`,
                name: p.name,
                email: p.email,
                phone: p.whatsapp,
                department: 'Pregoeiro',
                preferences: { email: true, whatsapp: true, sms: false },
                createdAt: new Date().toISOString()
            })),
            ...people.map(p => ({
                id: `team-${p.id}`,
                name: p.name,
                email: p.email,
                phone: p.whatsapp,
                department: p.sector || 'Requisitante',
                preferences: { email: true, whatsapp: true, sms: false },
                createdAt: new Date().toISOString()
            })),
            ...supervisors.map(s => ({
                id: `team-${s.id}`,
                name: s.name,
                email: s.email,
                phone: s.whatsapp,
                department: s.organization || 'Supervisor',
                preferences: { email: true, whatsapp: true, sms: false },
                createdAt: new Date().toISOString()
            }))
        ];
        return [...synced, ...manualSubscribers];
    }, [pregoeiros, people, supervisors, manualSubscribers]);

    const addSubscriber = (newSub: Omit<Subscriber, 'id' | 'createdAt'>) => {
        const subscriber: Subscriber = {
            ...newSub,
            id: `manual-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString()
        };
        setManualSubscribers(prev => [...prev, subscriber]);
    };

    const removeSubscriber = (id: string) => {
        setManualSubscribers(prev => prev.filter(s => s.id !== id));
    };

    const checkAndSendNotifications = async () => {
        const today = new Date();
        const newLogs: NotificationLog[] = [];

        for (const tender of tenders) {
            const openingDate = new Date(tender.openingDate);
            const diffDays = Math.ceil((openingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            // Alerta se faltar 30, 5 ou 0 dias
            if ([30, 5, 0].includes(diffDays)) {
                for (const sub of subscribers) {
                    const type = diffDays === 30 ? '30_days' : diffDays === 5 ? '5_days' : 'deadline';

                    if (sub.preferences.email && sub.email) {
                        try {
                            // Interface com API de disparo (Vercel/Node)
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
            localStorage.setItem('radar_logs', JSON.stringify([...newLogs, ...logs]));
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
