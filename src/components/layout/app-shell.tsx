"use client"

import { useUser } from "@/contexts/user-context"
import { usePathname } from "next/navigation"
import LoginPage from "@/app/login/page"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

export function AppShell({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useUser()
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Fechar menu mobile ao mudar de página
    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [pathname])

    // Se estiver na página de login explicitly (opcional se usarmos só o wrapper)
    if (pathname === '/login') {
        return <LoginPage />
    }

    if (!isAuthenticated) {
        return <LoginPage />
    }

    return (
        <div className="flex h-full">
            {/* Mobile Drawer */}
            <Dialog open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <DialogContent className="p-0 border-none bg-transparent shadow-none w-fit h-fit left-0 translate-x-0 !top-0 !translate-y-0 sm:max-w-none">
                    <VisuallyHidden>
                        <DialogTitle>Menu de Navegação</DialogTitle>
                    </VisuallyHidden>
                    <div className="h-screen w-[15rem]">
                        <Sidebar />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Sidebar Desktop */}
            <div className="hidden md:flex md:w-[15rem] md:flex-col md:fixed md:inset-y-0 z-50">
                <Sidebar />
            </div>

            {/* Área principal */}
            <div className="flex flex-col flex-1 md:pl-[15rem] h-full">
                <Header onMenuOpen={() => setIsMobileMenuOpen(true)} />
                <main className="flex-1 overflow-y-auto px-4 md:px-8 pb-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
