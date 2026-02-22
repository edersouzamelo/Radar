"use client";
import { Bell, Menu, RefreshCw } from "lucide-react";
import { UserNav } from "@/components/user-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { useTenders } from "@/contexts/tenders-context";
import { useState } from "react";

interface HeaderProps {
    onMenuOpen?: () => void;
}

export function Header({ onMenuOpen }: HeaderProps) {
    const { searchQuery, setSearchQuery, cloudStatus, pullDataFromCloud } = useTenders();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await pullDataFromCloud(true);
        setIsRefreshing(false);
    };

    const statusDot =
        cloudStatus.status === 'online' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.7)]' :
            cloudStatus.status === 'syncing' ? 'bg-blue-500 animate-pulse' :
                'bg-red-400';

    return (
        <header className="flex h-16 md:h-24 w-full items-center gap-x-2 md:gap-x-4 px-3 md:px-8 bg-transparent border-b border-slate-100 dark:border-slate-800">

            {/* Botão hamburger — só mobile */}
            <button
                type="button"
                className="md:hidden p-2 text-gray-400 hover:text-radar-gold transition-colors flex-shrink-0"
                onClick={onMenuOpen}
            >
                <span className="sr-only">Abrir menu</span>
                <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Saudação — só desktop */}
            <div className="hidden md:flex flex-col flex-shrink-0">
                <h2 className="text-lg font-semibold text-radar-dark dark:text-white">Olá, Gestor!</h2>
                <p className="text-sm text-gray-500">Bem-vindo ao RADAR</p>
            </div>

            {/* Busca — cresce para ocupar o espaço disponível */}
            <div className="flex flex-1 min-w-0 md:ml-8 md:max-w-md">
                <div className="relative w-full text-gray-400 focus-within:text-radar-gold">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        id="search-field"
                        className="block w-full rounded-xl border-0 bg-white dark:bg-slate-800 dark:text-gray-100 py-2 pl-9 pr-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-radar-gold shadow-sm text-sm"
                        placeholder="Buscar pregão..."
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Ações — direita */}
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0 ml-auto md:ml-2">

                {/* Indicador cloud — só desktop */}
                <div className={`hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${cloudStatus.status === 'online'
                        ? 'bg-white dark:bg-slate-800 border-green-100 dark:border-green-900 text-gray-500 dark:text-gray-400'
                        : cloudStatus.status === 'syncing'
                            ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 text-blue-600 dark:text-blue-400'
                            : 'bg-red-50 dark:bg-red-950 border-red-200 text-red-500 dark:text-red-400'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot}`} />
                    <span className="font-medium whitespace-nowrap">
                        {cloudStatus.status === 'online' ? 'Tempo Real' :
                            cloudStatus.status === 'syncing' ? 'Sincronizando…' : 'Offline'}
                    </span>
                    {cloudStatus.totalRecords > 0 && (
                        <span className="text-gray-400 dark:text-gray-500">{cloudStatus.totalRecords}</span>
                    )}
                </div>

                {/* Botão Atualizar */}
                <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    title="Atualizar dados do servidor"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-radar-dark dark:bg-slate-700 text-radar-cream hover:bg-radar-gold hover:text-radar-dark dark:hover:bg-radar-gold dark:hover:text-radar-dark transition-all shadow-sm disabled:opacity-50"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Atualizar</span>
                </button>

                {/* Dot de status — só mobile (compacto) */}
                <div className={`lg:hidden w-2 h-2 rounded-full flex-shrink-0 ${statusDot}`} title={cloudStatus.status} />

                <ModeToggle />

                <button type="button" className="p-2 text-gray-500 dark:text-gray-400 hover:text-radar-gold transition-colors relative flex-shrink-0">
                    <span className="sr-only">Ver notificações</span>
                    <Bell className="h-5 w-5" aria-hidden="true" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-radar-gold ring-2 ring-white dark:ring-slate-900"></span>
                </button>

                <div className="flex items-center pl-2 border-l border-gray-200 dark:border-slate-700">
                    <UserNav />
                </div>
            </div>
        </header>
    );
}
