import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type UserRole =
    | 'Ordenador de Despesas'
    | 'Agente Diretor'
    | 'Chefe da Seção de Licitações'
    | 'Pregoeiro'
    | 'Auxiliar'
    | 'Setor Requisitante';

interface UserContextType {
    role: UserRole;
    setRole: (role: UserRole) => void;
    isAuthenticated: boolean;
    user: { name: string; email: string; avatar?: string } | null;
    loginWithGoogle: () => Promise<void>;
    login: (role: UserRole, name: string, email: string) => void; // Mantido para compatibilidade legado
    logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<UserRole>('Agente Diretor');
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);

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

        // 3. Carregar Roles salvas (Persistência de Role independente do Auth)
        const savedRole = localStorage.getItem('radar-role') as UserRole;
        if (savedRole) setRole(savedRole);

        return () => subscription.unsubscribe();
    }, []);

    const updateUserFromSession = (session: any) => {
        setIsAuthenticated(true);
        setUser({
            name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Usuário',
            email: session.user.email || '',
            avatar: session.user.user_metadata.avatar_url
        });
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

    // Função de login legado (localStorage) – será gradualmente substituída
    const login = (role: UserRole, name: string, email: string) => {
        setIsAuthenticated(true);
        setRole(role);
        setUser({ name, email });
        localStorage.setItem('radar-auth', 'true');
        localStorage.setItem('radar-role', role);
        localStorage.setItem('radar-user', JSON.stringify({ name, email }));
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
        localStorage.setItem('radar-role', newRole);
    };

    return (
        <UserContext.Provider value={{
            role,
            setRole: updateRole,
            isAuthenticated,
            user,
            loginWithGoogle,
            login,
            logout
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
