"use client"
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type UserRole =
    | 'Administrador'
    | 'Ordenador de Despesas'
    | 'Agente Diretor'
    | 'Chefe da Seção de Licitações'
    | 'Pregoeiro'
    | 'Auxiliar'
    | 'Visitante'
    | 'Setor Requisitante';

export interface UserPermissions {
    edit_tenders?: boolean;
    edit_dates?: boolean;
    edit_users?: boolean;
    view_all?: boolean;
    bulk_check?: boolean;
}

interface UserContextType {
    role: UserRole;
    permissions: UserPermissions;
    setRole: (role: UserRole) => void;
    isAuthenticated: boolean;
    user: { id: string; name: string; email: string; avatar?: string } | null;
    onlineUsers: Array<{ id: string; name: string; email: string; avatar?: string; lastSeen: string }>;
    dailyUsers: Array<{ id: string; name: string; email: string; avatar?: string; lastSeen: string }>;
    loginWithGoogle: () => Promise<void>;
    login: (role: UserRole, name: string, email: string) => void;
    logout: () => Promise<void>;
    hasPermission: (permission: keyof UserPermissions) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<UserRole>('Setor Requisitante');
    const [permissions, setPermissions] = useState<UserPermissions>({});
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<{ id: string; name: string; email: string; avatar?: string } | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<UserContextType['onlineUsers']>([]);
    const [dailyUsers, setDailyUsers] = useState<UserContextType['onlineUsers']>([]);

    // Rastreamento de Presença (Presence)
    useEffect(() => {
        if (!isAuthenticated || !user || !supabase) return;

        const channel = supabase.channel('radar-presence', {
            config: { presence: { key: user.id } }
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const users: any[] = [];
                Object.values(state).forEach((presence: any) => {
                    presence.forEach((p: any) => {
                        users.push({
                            id: p.id,
                            name: p.name,
                            email: p.email,
                            avatar: p.avatar,
                            lastSeen: new Date().toISOString()
                        });
                    });
                });
                setOnlineUsers(users);

                // Atualiza last_seen no banco (opcional, mas bom para histórico)
                supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        avatar: user.avatar
                    });
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [isAuthenticated, user]);

    // Carregar dados de autenticação e monitorar mudanças de sessão
    useEffect(() => {
        // 1. Checar sessão atual na montagem
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                updateUserFromSession(session);
            }
        });

        // 2. Ouvir mudanças na autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                updateUserFromSession(session);
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role, permissions, is_admin')
                .eq('id', userId)
                .single();

            if (data) {
                // FAILSAFE: Respeita o Major independente do que vier do banco
                if (user?.email === 'edersouzamelo@gmail.com') {
                    setRole('Administrador');
                    setPermissions({
                        edit_tenders: true,
                        edit_dates: true,
                        edit_users: true,
                        view_all: true,
                        bulk_check: true
                    });
                } else {
                    setRole((data.role || 'Visitante') as UserRole);
                    setPermissions(data.permissions || {});
                    // Se for admin no banco, garante todas as permissões
                    if (data.is_admin) {
                        setPermissions({
                            edit_tenders: true,
                            edit_dates: true,
                            edit_users: true,
                            view_all: true,
                            bulk_check: true
                        });
                    }
                }
            } else {
                // CRIAÇÃO AUTOMÁTICA DE PERFIL VISITANTE PARA NOVOS ACESSOS
                const userId = user?.id;
                const email = user?.email;
                if (userId && email) {
                    const { error: createError } = await supabase
                        .from('profiles')
                        .insert([{
                            id: userId,
                            email: email,
                            full_name: user?.name || email.split('@')[0],
                            role: 'Visitante',
                            permissions: { view_all: true }
                        }]);

                    if (!createError) {
                        setRole('Visitante');
                        setPermissions({ view_all: true });
                    }
                }
            }
        } catch (err) {
            console.error("Erro ao carregar perfil:", err);
        }
    };

    // Buscar usuários que acessaram hoje
    useEffect(() => {
        const fetchDailyUsers = async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .gte('last_seen', today.toISOString());

            if (data) {
                setDailyUsers(data.map(p => ({
                    id: p.id,
                    name: p.full_name || p.email.split('@')[0],
                    email: p.email,
                    avatar: p.avatar_url,
                    lastSeen: p.last_seen
                })));
            }
        };

        fetchDailyUsers();
        const interval = setInterval(fetchDailyUsers, 300000); // 5 min
        return () => clearInterval(interval);
    }, []);

    const updateUserFromSession = (session: any) => {
        setIsAuthenticated(true);
        const email = session.user.email || '';
        const userData = {
            id: session.user.id,
            name: session.user.user_metadata.full_name || email.split('@')[0] || 'Usuário',
            email: email,
            avatar: session.user.user_metadata.avatar_url
        };
        setUser(userData);

        // FAILSAFE: Se for o Major, força Admin independente do banco
        if (email === 'edersouzamelo@gmail.com') {
            setRole('Administrador');
            setPermissions({
                edit_tenders: true,
                edit_dates: true,
                edit_users: true,
                view_all: true,
                bulk_check: true
            });
        }

        fetchUserProfile(session.user.id);
    };

    const loginWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) {
            console.error("Erro no login com Google:", error.message);
            throw error;
        }
    };

    // Função de login legado removida para evitar simulações
    const login = (role: UserRole, name: string, email: string) => {
        console.warn("Acesso via login legado desativado. Use autenticação Google.");
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('radar-auth');
        localStorage.removeItem('radar-user');
    };

    const updateRole = (newRole: UserRole) => {
        setRole(newRole);
    };

    const hasPermission = (permission: keyof UserPermissions): boolean => {
        if (role === 'Administrador') return true;
        return !!permissions[permission];
    };

    return (
        <UserContext.Provider value={{
            role,
            permissions,
            setRole: updateRole,
            isAuthenticated,
            user,
            onlineUsers,
            dailyUsers,
            loginWithGoogle,
            login,
            logout,
            hasPermission
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
