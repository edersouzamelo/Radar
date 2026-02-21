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
import { DatabaseMonitor } from "@/components/admin/database-monitor"
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
    const {
        tenders,
        pregoeiros,
        supervisors,
        people,
        addPregoeiro,
        updatePregoeiro,
        deletePregoeiro,
        addSupervisor,
        updateSupervisor,
        deleteSupervisor,
        addPerson,
        updatePerson,
        deletePerson
    } = useTenders()

    // Unificamos a equipe para exibição, mas mantemos a origem para edição
    const teamMembers = [
        ...pregoeiros.map(p => ({ ...p, type: 'pregoeiro' as const })),
        ...supervisors.map(s => ({ ...s, type: 'supervisor' as const })),
        ...people.map(p => ({ ...p, type: 'requisitante' as const, role: p.role || 'Requisitante' }))
    ];

    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingMember, setEditingMember] = useState<any>(null)
    const [newMember, setNewMember] = useState({ name: "", email: "", role: "Pregoeiro", whatsapp: "", type: 'pregoeiro' as 'pregoeiro' | 'supervisor' | 'requisitante', sector: "" })

    const handleExport = () => {
        exportTendersToCSV(tenders, user?.name || "Usuário Radar");
    }

    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault()
        if (newMember.type === 'pregoeiro') {
            addPregoeiro({ name: newMember.name, email: newMember.email, role: newMember.role, whatsapp: newMember.whatsapp })
        } else if (newMember.type === 'supervisor') {
            addSupervisor({ name: newMember.name, email: newMember.email, role: newMember.role, whatsapp: newMember.whatsapp, organization: "SALC" })
        } else {
            addPerson({ name: newMember.name, email: newMember.email, role: newMember.role, whatsapp: newMember.whatsapp, sector: newMember.sector || "Geral" })
        }
        setNewMember({ name: "", email: "", role: "Pregoeiro", whatsapp: "", type: 'pregoeiro', sector: "" })
        setIsAddModalOpen(false)
    }

    const handleEditMember = (e: React.FormEvent) => {
        e.preventDefault()
        if (editingMember.type === 'pregoeiro') {
            updatePregoeiro(editingMember.id, { name: editingMember.name, email: editingMember.email, role: editingMember.role, whatsapp: editingMember.whatsapp })
        } else if (editingMember.type === 'supervisor') {
            updateSupervisor(editingMember.id, { name: editingMember.name, email: editingMember.email, role: editingMember.role, whatsapp: editingMember.whatsapp })
        } else {
            updatePerson(editingMember.id, { name: editingMember.name, email: editingMember.email, role: editingMember.role, whatsapp: editingMember.whatsapp, sector: editingMember.sector })
        }
        setEditingMember(null)
    }

    const handleDeleteMember = (member: any) => {
        if (member.type === 'pregoeiro') {
            deletePregoeiro(member.id)
        } else if (member.type === 'supervisor') {
            deleteSupervisor(member.id)
        } else {
            deletePerson(member.id)
        }
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
                            <Button className="bg-[#1A1A1A] text-white hover:bg-black font-black px-6 shadow-2xl border-2 border-radar-gold/50 uppercase tracking-tight">
                                <UserPlus className="mr-2 h-5 w-5 text-radar-gold" />
                                Novo Membro da Equipe
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white dark:bg-slate-900 border-radar-gold">
                            <form onSubmit={handleAddMember}>
                                <DialogHeader>
                                    <DialogTitle>Cadastrar Novo Membro</DialogTitle>
                                    <DialogDescription>Adicione um novo integrante à equipe da SALC.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="add-name">Nome Completo / Posto ou Grad</Label>
                                        <Input id="add-name" required value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="add-email">E-mail Institucional</Label>
                                        <Input id="add-email" type="email" required value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="add-whatsapp">WhatsApp</Label>
                                        <Input id="add-whatsapp" placeholder="(00) 00000-0000" value={newMember.whatsapp} onChange={e => setNewMember({ ...newMember, whatsapp: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Tipo de Vínculo</Label>
                                            <Select value={newMember.type} onValueChange={(val: 'pregoeiro' | 'supervisor' | 'requisitante') => setNewMember({ ...newMember, type: val, role: val === 'pregoeiro' ? 'Pregoeiro' : val === 'supervisor' ? 'Supervisor' : 'Requisitante' })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pregoeiro">Pregoeiro / Equipe</SelectItem>
                                                    <SelectItem value="supervisor">Supervisor / Órgão</SelectItem>
                                                    <SelectItem value="requisitante">Setor Requisitante</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Função Específica</Label>
                                            <Input value={newMember.role} onChange={e => setNewMember({ ...newMember, role: e.target.value })} />
                                        </div>
                                    </div>
                                    {newMember.type === 'requisitante' && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="add-sector">OM / Setor Requisitante</Label>
                                            <Input id="add-sector" placeholder="Ex: 9º B Mnt" value={newMember.sector} onChange={e => setNewMember({ ...newMember, sector: e.target.value })} />
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className="bg-radar-dark text-white w-full">Salvar na Equipe</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="mb-6">
                <DatabaseMonitor />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Equipe Atual</CardTitle>
                        <CardDescription>Gerencie as funções dos membros da seção</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {teamMembers.map((u) => (
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
                                            onClick={() => setEditingMember(u)}
                                            title="Editar Perfil"
                                        >
                                            <UserCog className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-red-500 hover:bg-red-50 transition-all"
                                            onClick={() => handleDeleteMember(u)}
                                            title="Remover da Equipe"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Modal de Edição */}
                        {editingMember && (
                            <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
                                <DialogContent className="bg-white dark:bg-slate-900 border-radar-gold">
                                    <form onSubmit={handleEditMember}>
                                        <DialogHeader>
                                            <DialogTitle>Editar Membro: {editingMember.name}</DialogTitle>
                                            <DialogDescription>Atualize os dados de contato ou função.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="edit-name">Nome / Posto ou Grad</Label>
                                                <Input id="edit-name" value={editingMember.name} onChange={e => setEditingMember({ ...editingMember, name: e.target.value })} />
                                            </div>
                                            <div className="grid gap-2 text-radar-dark dark:text-white">
                                                <Label htmlFor="edit-email">E-mail</Label>
                                                <Input id="edit-email" type="email" value={editingMember.email} onChange={e => setEditingMember({ ...editingMember, email: e.target.value })} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="edit-whatsapp">WhatsApp</Label>
                                                <Input id="edit-whatsapp" value={editingMember.whatsapp} onChange={e => setEditingMember({ ...editingMember, whatsapp: e.target.value })} />
                                            </div>
                                            <div className="grid gap-2 text-radar-dark dark:text-white">
                                                <Label>Função / Cargo</Label>
                                                <Input value={editingMember.role} onChange={e => setEditingMember({ ...editingMember, role: e.target.value })} />
                                            </div>
                                            {editingMember.type === 'requisitante' && (
                                                <div className="grid gap-2 text-radar-dark dark:text-white">
                                                    <Label htmlFor="edit-sector">OM / Setor Requisitante</Label>
                                                    <Input id="edit-sector" value={editingMember.sector} onChange={e => setEditingMember({ ...editingMember, sector: e.target.value })} />
                                                </div>
                                            )}
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
                                {teamMembers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
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
