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

    return (
        <header className="flex h-24 w-full items-center gap-x-4 px-4 md:px-8 bg-transparent">
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 items-center">
                <button
                    type="button"
                    className="md:hidden -m-2.5 p-2.5 text-gray-400 hover:text-radar-gold transition-colors"
                    onClick={onMenuOpen}
                >
                    <span className="sr-only">Abrir menu</span>
                    <Menu className="h-6 w-6" aria-hidden="true" />
                </button>

                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-radar-dark dark:text-white">Olá, Gestor!</h2>
                    <p className="text-sm text-gray-500">Bem-vindo ao RADAR</p>
                </div>

                <div className="relative flex flex-1 ml-12 max-w-md">
                    <label htmlFor="search-field" className="sr-only">
                        Buscar licitações
                    </label>
                    <div className="relative w-full text-gray-400 focus-within:text-radar-gold">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            id="search-field"
                            className="block w-full rounded-2xl border-0 bg-white dark:bg-radar-dark/50 py-3 pl-10 pr-4 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-radar-gold shadow-sm sm:text-sm"
                            placeholder="Buscar pregão..."
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-x-3 ml-auto">
                    {/* Indicador de Status do Cloud — visível em todos os módulos */}
                    <div className={`hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full shadow-sm border ${cloudStatus.status === 'online' ? 'bg-white border-green-100 text-gray-500' :
                        cloudStatus.status === 'syncing' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                            'bg-red-50 border-red-100 text-red-500'
                        }`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cloudStatus.status === 'online' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.7)]' :
                            cloudStatus.status === 'syncing' ? 'bg-blue-500 animate-pulse' :
                                'bg-red-400'
                            }`} />
                        <span className="font-medium whitespace-nowrap">
                            {cloudStatus.status === 'online' ? 'Tempo Real' :
                                cloudStatus.status === 'syncing' ? 'Sincronizando...' : 'Offline'}
                        </span>
                        {cloudStatus.totalRecords > 0 && (
                            <span className="text-gray-400 font-normal">{cloudStatus.totalRecords} reg.</span>
                        )}
                    </div>

                    {/* Botão Atualizar */}
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        title="Atualizar dados do servidor agora"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-radar-dark text-radar-cream hover:bg-radar-gold hover:text-radar-dark transition-all shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Atualizar</span>
                    </button>

                    <ModeToggle />

                    <button type="button" className="-m-2.5 p-2.5 text-gray-500 hover:text-radar-gold transition-colors relative">
                        <span className="sr-only">Ver notificações</span>
                        <Bell className="h-6 w-6" aria-hidden="true" />
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-radar-gold ring-2 ring-white"></span>
                    </button>

                    <div className="flex items-center pl-4 border-l border-gray-200 ml-2">
                        <UserNav />
                    </div>
                </div>
            </div>
        </header>
    );
}

