import { Bell, Search } from "lucide-react";
import { UserNav } from "@/components/user-nav";
import { ModeToggle } from "@/components/mode-toggle";

export function Header() {
    return (
        <header className="flex h-24 w-full items-center gap-x-4 px-8 bg-transparent">
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 items-center">
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-radar-dark dark:text-white">Olá, Gestor!</h2>
                    <p className="text-sm text-gray-500">Bem-vindo ao RADAR</p>
                </div>

                <form className="relative flex flex-1 ml-12 max-w-md" action="#" method="GET">
                    <label htmlFor="search-field" className="sr-only">
                        Buscar licitações
                    </label>
                    <div className="relative w-full text-gray-400 focus-within:text-radar-gold">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <input
                            id="search-field"
                            className="block w-full rounded-2xl border-0 bg-white dark:bg-radar-dark/50 py-3 pl-10 pr-4 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-radar-gold shadow-sm sm:text-sm"
                            placeholder="Buscar pregão..."
                            type="search"
                            name="search"
                        />
                    </div>
                </form>

                <div className="flex items-center gap-x-4 ml-auto">
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
