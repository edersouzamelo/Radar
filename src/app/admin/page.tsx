"use client"

import { useState, useEffect } from "react"
import { useUser, UserRole } from "@/contexts/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Shield, UserPlus, Key, UserCog, AlertTriangle, Download, Trash2, Users, Radio, CheckSquare, Square } from "lucide-react"
import { useTenders } from "@/contexts/tenders-context"
import { exportTendersToCSV } from "@/lib/export-utils"
import { DatabaseMonitor } from "@/components/admin/database-monitor"
import { supabase } from "@/lib/supabase"
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
    const { role, user, onlineUsers, dailyUsers, hasPermission, permissions: userPermissions } = useUser()
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

    const [allProfiles, setAllProfiles] = useState<any[]>([]);

    useEffect(() => {
        const fetchProfiles = async () => {
            const { data } = await supabase.from('profiles').select('*');
            if (data) setAllProfiles(data);
        };
        fetchProfiles();
    }, []);

    // Consolidação da equipe: Unimos pregoeiros, supervisores e requisitantes com os perfis de autenticação
    const teamMembers = [
        ...pregoeiros.map(p => ({ ...p, type: 'pregoeiro' })),
        ...supervisors.map(s => ({ ...s, type: 'supervisor' })),
        ...people.map(p => ({ ...p, type: 'requisitante' }))
    ].map(member => {
        // Tenta encontrar um perfil (login) correspondente pelo e-mail com busca robusta
        const memberEmail = member.email?.toLowerCase().trim();
        const profile = allProfiles.find(p => p.email?.toLowerCase().trim() === memberEmail);

        return {
            ...member,
            // Normalização de campos para evitar erros de tipagem e duplicidade
            full_name: profile?.full_name || member.name,
            permissions: profile?.permissions || {},
            profile_id: profile?.id,
            is_auth_user: !!profile
        };
    }).sort((a, b) => a.full_name.localeCompare(b.full_name));

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

    if (role !== 'Administrador' && role !== 'Chefe da Seção de Licitações') {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
                <AlertTriangle className="h-16 w-16 text-red-500" />
                <h1 className="text-2xl font-bold text-radar-dark">Acesso Negado</h1>
                <p className="text-gray-500">Apenas o Administrador ou Chefe da SALC tem permissão para acessar este módulo.</p>
            </div>
        )
    }

    const availablePermissions = [
        { id: 'edit_tenders', name: 'Editar Pregões', description: 'Alterar dados principais dos processos' },
        { id: 'edit_dates', name: 'Editar Datas', description: 'Alterar cronogramas e prazos' },
        { id: 'bulk_check', name: 'Conferência em Massa', description: 'Usar o "Verificar Todos" na lista' },
        { id: 'edit_users', name: 'Editar Usuários', description: 'Cadastrar novos membros e perfis' },
        { id: 'view_all', name: 'Visualizar Tudo', description: 'Acesso total de leitura' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-radar-dark dark:text-white flex items-center">
                        <Shield className="mr-2 h-8 w-8 text-radar-gold" />
                        Painel de Controle SALC
                    </h1>
                    <p className="text-muted-foreground">Monitoramento ao vivo e gestão de prerrogativas do sistema</p>
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

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="col-span-1 border-green-500/30">
                    <CardHeader className="pb-2">
                        <div className="flex items-center space-x-2">
                            <Radio className="h-5 w-5 text-green-500 animate-pulse" />
                            <CardTitle className="text-lg">Acessando Agora</CardTitle>
                        </div>
                        <CardDescription>Usuários online em tempo real</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {onlineUsers.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">Apenas você monitorando...</p>
                            ) : (
                                onlineUsers.map((u) => (
                                    <div key={u.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-800">
                                        <div className="flex items-center space-x-2">
                                            <div className="h-2 w-2 bg-green-500 rounded-full" />
                                            <div>
                                                <p className="text-xs font-bold text-radar-dark dark:text-white">{u.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{u.email}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[8px] h-4 bg-white">ONLINE</Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="col-span-2">
                    <DatabaseMonitor />
                </div>

                <div className="col-span-1 lg:col-span-1">
                    <Card className="h-full border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 py-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Radio className="w-4 h-4 text-green-500 animate-pulse" />
                                Monitor de Adesão Diária
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-2 flex items-center justify-between">
                                        Acessando Agora
                                        <Badge variant="outline" className="text-[10px] h-4 bg-green-50 text-green-700 border-green-200">
                                            {onlineUsers.length} ONLINE
                                        </Badge>
                                    </p>
                                    <div className="space-y-2">
                                        {onlineUsers.map(u => (
                                            <div key={u.id} className="flex items-center gap-3 p-2 bg-green-50/30 rounded-lg border border-green-100/50">
                                                <div className="h-8 w-8 rounded-full bg-radar-dark text-white flex items-center justify-center text-xs font-bold">
                                                    {u.name[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold truncate">{u.name}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                                                </div>
                                                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-2 flex items-center justify-between">
                                        Histórico do Dia (Acessos Hoje)
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {dailyUsers.length} TOTAL
                                        </span>
                                    </p>
                                    <div className="space-y-2">
                                        {dailyUsers.filter(du => !onlineUsers.find(ou => ou.id === du.id)).map(u => (
                                            <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                                                <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold group-hover:bg-radar-gold group-hover:text-radar-dark transition-colors">
                                                    {u.name[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium truncate">{u.name}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate">Visto em: {new Date(u.lastSeen).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
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
                            {teamMembers.map((u) => (
                                <div key={u.id} className="group relative flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-radar-gold/50 transition-all shadow-sm">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-10 w-10 bg-radar-dark text-white rounded-full flex items-center justify-center font-bold">
                                            {u.full_name ? u.full_name[0] : (u.name ? u.name[0] : '?')}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-radar-dark dark:text-white truncate">{u.full_name || u.name}</p>
                                            <div className="flex items-center gap-2 group/email">
                                                <p className="text-xs text-muted-foreground truncate">{u.email || '⚠️ Sem e-mail'}</p>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 bg-radar-gold/10 hover:bg-radar-gold text-radar-dark border border-radar-gold/20"
                                                    onClick={async () => {
                                                        const newEmail = prompt(`Definir E-mail Institucional para ${u.name}:`, u.email || "");
                                                        if (newEmail !== null && newEmail.trim() !== "") {
                                                            const emailLower = newEmail.toLowerCase().trim();
                                                                }]);
                                                            }

                                                            alert("E-mail atualizado. Se o perfil não existia, criamos um vínculo de 'Visitante' para este e-mail.");
                                                            window.location.reload();
                                                        }
                                                    }}
                                                >
                                                    <UserCog className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col space-y-2 mt-4 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                        <p className="text-[10px] font-black uppercase text-radar-dark/50 tracking-tighter mb-1">Prerrogativas do Perfil</p>
                                        <div className="flex flex-wrap gap-2">
                                            {availablePermissions.map(perm => (
                                                <Button
                                                    key={perm.id}
                                                    variant="ghost"
                                                    size="sm"
                                                    className={`h-7 px-2 text-[10px] border ${!u.is_auth_user ? 'opacity-50 cursor-not-allowed' : ''} ${u.permissions?.[perm.id] ? 'bg-radar-gold/20 border-radar-gold text-radar-dark font-bold' : 'bg-white border-gray-200 text-gray-400'}`}
                                                    onClick={async () => {
                                                        if (!u.is_auth_user) {
                                                            alert("Este membro ainda não possui um perfil de acesso vinculado (e-mail).");
                                                            return;
                                                        }
                                                        const newPerms = { ...(u.permissions || {}), [perm.id]: !u.permissions?.[perm.id] };
                                                        const { error } = await supabase.from('profiles').update({ permissions: newPerms }).eq('id', u.profile_id);

                                                        if (error) {
                                                            alert("Erro ao atualizar permissões: " + error.message);
                                                        } else {
                                                            window.location.reload();
                                                        }
                                                    }}
                                                >
                                                    {u.permissions?.[perm.id] ? <CheckSquare className="h-3 w-3 mr-1" /> : <Square className="h-3 w-3 mr-1" />}
                                                    {perm.name}
                                                </Button>
                                            ))}
                                        </div>
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
                                        <DialogTitle>Editar Membro: {editingMember.full_name || editingMember.name}</DialogTitle>
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
                            {teamMembers.map(u => <option key={u.id} value={u.id}>{u.full_name || u.name}</option>)}
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
        </div >
    )
}
