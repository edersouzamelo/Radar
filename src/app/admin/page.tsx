"use client"

import { useState } from "react"
import { useUser, UserRole } from "@/contexts/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Shield, UserPlus, Key, UserCog, AlertTriangle, Download, Trash2 } from "lucide-react"
import { useTenders } from "@/contexts/tenders-context"
import { exportTendersToCSV } from "@/lib/export-utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function AdminPage() {
    const { role, user } = useUser()
    const { tenders } = useTenders()
    const [users, setUsers] = useState([
        { id: 1, name: "S Ten L Alves", email: "alves@exercito.mil.br", role: "Pregoeiro" as UserRole },
        { id: 2, name: "2º Sgt Octávio", email: "octavio@exercito.mil.br", role: "Auxiliar" as UserRole },
        { id: 3, name: "Chefe SALC", email: "chefe@exercito.mil.br", role: "Chefe da Seção de Licitações" as UserRole },
    ])

    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<any>(null)
    const [newUser, setNewUser] = useState({ name: "", email: "", role: "Auxiliar" as UserRole })

    const handleExport = () => {
        exportTendersToCSV(tenders, user?.name || "Usuário Radar");
    }

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault()
        setUsers([...users, { ...newUser, id: users.length + 1 }])
        setNewUser({ name: "", email: "", role: "Auxiliar" as UserRole })
        setIsAddModalOpen(false)
    }

    const handleEditUser = (e: React.FormEvent) => {
        e.preventDefault()
        setUsers(users.map(u => u.id === editingUser.id ? editingUser : u))
        setEditingUser(null)
    }

    if (role !== 'Chefe da Seção de Licitações') {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
                <AlertTriangle className="h-16 w-16 text-red-500" />
                <h1 className="text-2xl font-bold text-radar-dark">Acesso Negado</h1>
                <p className="text-gray-500">Apenas o Chefe da SALC tem permissão para acessar este módulo.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-radar-dark dark:text-white flex items-center">
                        <Shield className="mr-2 h-8 w-8 text-radar-gold" />
                        Gerenciamento de Perfis
                    </h1>
                    <p className="text-muted-foreground">Concessão de acessos e senhas para a equipe da SALC</p>
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="secondary"
                        className="bg-white border-2 border-black text-black hover:bg-gray-100 font-bold px-4 hover:shadow-md"
                        onClick={handleExport}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Exportar Banco
                    </Button>

                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-radar-dark text-white hover:bg-black font-black px-6 shadow-2xl border-2 border-white/20 uppercase tracking-tight">
                                <UserPlus className="mr-2 h-5 w-5 text-radar-gold" />
                                Novo Usuário
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white dark:bg-slate-900 border-radar-gold">
                            <form onSubmit={handleAddUser}>
                                <DialogHeader>
                                    <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
                                    <DialogDescription>Adicione um novo membro à equipe da SALC.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="add-name">Nome Completo / Posto ou Grad</Label>
                                        <Input id="add-name" required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="add-email">E-mail Institucional</Label>
                                        <Input id="add-email" type="email" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Perfil de Acesso</Label>
                                        <Select value={newUser.role} onValueChange={(val: UserRole) => setNewUser({ ...newUser, role: val })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Chefe da Seção de Licitações">Chefe da Seção</SelectItem>
                                                <SelectItem value="Pregoeiro">Pregoeiro</SelectItem>
                                                <SelectItem value="Auxiliar">Auxiliar</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className="bg-radar-dark text-white w-full">Salvar Usuário</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Equipe Atual</CardTitle>
                        <CardDescription>Gerencie as funções dos membros da seção</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {users.map((u) => (
                                <div key={u.id} className="group relative flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-radar-gold/50 transition-all shadow-sm">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-10 w-10 bg-radar-dark text-white rounded-full flex items-center justify-center font-bold">
                                            {u.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-radar-dark dark:text-white">{u.name}</p>
                                            <p className="text-xs text-muted-foreground">{u.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Badge variant="outline" className="font-black border-radar-dark/30 text-[10px] uppercase tracking-widest mr-2">{u.role}</Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-radar-dark hover:bg-radar-gold/20 transition-all"
                                            onClick={() => setEditingUser(u)}
                                            title="Editar Perfil"
                                        >
                                            <UserCog className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-red-500 hover:bg-red-50 transition-all"
                                            onClick={() => setUsers(users.filter(user => user.id !== u.id))}
                                            title="Remover Usuário"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Modal de Edição */}
                        {editingUser && (
                            <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
                                <DialogContent className="bg-white dark:bg-slate-900 border-radar-gold">
                                    <form onSubmit={handleEditUser}>
                                        <DialogHeader>
                                            <DialogTitle>Editar Perfil: {editingUser.name}</DialogTitle>
                                            <DialogDescription>Atualize o e-mail ou cargo do servidor.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2 text-radar-dark dark:text-white">
                                                <Label htmlFor="edit-email">E-mail</Label>
                                                <Input id="edit-email" type="email" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} />
                                            </div>
                                            <div className="grid gap-2 text-radar-dark dark:text-white">
                                                <Label>Perfil / Cargo</Label>
                                                <Select value={editingUser.role} onValueChange={(val: UserRole) => setEditingUser({ ...editingUser, role: val })}>
                                                    <SelectTrigger className="bg-white dark:bg-slate-800"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-white">
                                                        <SelectItem value="Chefe da Seção de Licitações">Chefe da Seção</SelectItem>
                                                        <SelectItem value="Pregoeiro">Pregoeiro</SelectItem>
                                                        <SelectItem value="Auxiliar">Auxiliar</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" className="bg-radar-dark text-white w-full">Salvar Alterações</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Segurança e Senhas</CardTitle>
                        <CardDescription>Redefinição de credenciais de acesso</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="user-select">Selecionar Usuário</Label>
                            <select id="user-select" className="w-full p-2 bg-white dark:bg-gray-800 border rounded-md">
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">Nova Senha Temporária</Label>
                            <div className="flex space-x-2">
                                <Input id="new-password" type="password" placeholder="********" />
                                <Button variant="outline">
                                    <Key className="mr-2 h-4 w-4" />
                                    Gerar
                                </Button>
                            </div>
                        </div>
                        <Button className="w-full bg-radar-dark text-white hover:bg-gray-800">
                            Atualizar Credenciais
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
