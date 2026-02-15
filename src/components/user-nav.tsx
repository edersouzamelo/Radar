"use client"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser, UserRole } from "@/contexts/user-context"
import { User, Shield, Briefcase, FileText, Gavel, Users } from "lucide-react"

export function UserNav() {
    const { role, setRole } = useUser()

    const roles: { label: UserRole, icon: any }[] = [
        { label: 'Ordenador de Despesas', icon: Shield },
        { label: 'Agente Diretor', icon: Briefcase },
        { label: 'Chefe da Seção de Licitações', icon: FileText },
        { label: 'Pregoeiro', icon: Gavel },
        { label: 'Auxiliar', icon: Users },
        { label: 'Setor Requisitante', icon: User },
    ]

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-radar-gold">
                        <AvatarImage src="/avatars/01.png" alt={role} />
                        <AvatarFallback className="bg-radar-dark text-radar-gold font-bold">
                            {getInitials(role)}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Usuário Atual</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {role}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuLabel>Alterar Perfil (Simulação)</DropdownMenuLabel>
                    {roles.map((r) => (
                        <DropdownMenuItem key={r.label} onClick={() => setRole(r.label)}>
                            <r.icon className="mr-2 h-4 w-4" />
                            <span>{r.label}</span>
                            {role === r.label && <span className="ml-auto text-radar-gold">✓</span>}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    Log out
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
