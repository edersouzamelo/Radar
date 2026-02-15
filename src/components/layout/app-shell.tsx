"use client"

import { useUser } from "@/contexts/user-context"
import { usePathname } from "next/navigation"
import LoginPage from "@/app/login/page"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export function AppShell({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useUser()
    const pathname = usePathname()

    // Se estiver na página de login explicitly (opcional se usarmos só o wrapper)
    if (pathname === '/login') {
        return <LoginPage />
    }

    if (!isAuthenticated) {
        return <LoginPage />
    }

    return (
        <div className="flex h-full">
            {/* Sidebar */}
            <div className="hidden md:flex md:w-[20rem] md:flex-col md:fixed md:inset-y-0 z-50">
                <Sidebar />
            </div>

            {/* Área principal */}
            <div className="flex flex-col flex-1 md:pl-[20rem] h-full">
                <Header />
                <main className="flex-1 overflow-y-auto px-8 pb-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
