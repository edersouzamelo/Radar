"use client"
import { createContext, useContext, useState, ReactNode } from 'react';

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
    user: { name: string; email: string } | null;
    login: (role: UserRole, name: string, email: string) => void;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<UserRole>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('radar-role');
            return (saved as UserRole) || 'Agente Diretor';
        }
        return 'Agente Diretor';
    });

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('radar-auth') === 'true';
        }
        return false;
    });

    const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('radar-user');
            return saved ? JSON.parse(saved) : null;
        }
        return null;
    });

    const login = (role: UserRole, name: string, email: string) => {
        setIsAuthenticated(true);
        setRole(role);
        setUser({ name, email });
        localStorage.setItem('radar-auth', 'true');
        localStorage.setItem('radar-role', role);
        localStorage.setItem('radar-user', JSON.stringify({ name, email }));
    };

    const logout = () => {
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
