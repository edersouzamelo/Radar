"use client"

import { useState, useEffect } from "react"
import { useUser, UserRole } from "@/contexts/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Shield, UserPlus, Key, UserCog, AlertTriangle, Download, Trash2, Users, Radio, CheckSquare } from "lucide-react"
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

    // TODO: Tasks
    // - [x] Correção de Camadas (Sidebar z-index)
    // - [x] Codificação por Cores: Compromisso (GCALC, PCA, Perseu)
    // - [x] Codificação por Cores: Coordenador (CCOL, CAF, 9º B Sup)
    // - [x] Codificação por Cores: Requisitante (9º B Mnt, 9° B Sup, 18° B Trnp, Cia Cmdo, 9° B Sau, Cmdo 9° Gpt)
    // - [x] Verificação de contraste e legibilidade
    // - [x] Push final para produção

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
            // PRIORIDADE: Perfil real > Gaveta (team_members) > Vazio
            permissions: profile?.permissions || (member as any).permissions || {},
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
                    <p className="text-muted-foreground">Monitoramento ao vivo e gestão de permissões do sistema</p>
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
                                    <div className="text-[10px] font-black uppercase text-muted-foreground mb-2 flex items-center justify-between">
                                        Acessando Agora
                                        <Badge variant="outline" className="text-[10px] h-4 bg-green-50 text-green-700 border-green-200">
                                            {onlineUsers.length} ONLINE
                                        </Badge>
                                    </div>
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
                                    <div className="text-[10px] font-black uppercase text-muted-foreground mb-2 flex items-center justify-between">
                                        Histórico do Dia (Acessos Hoje)
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {dailyUsers.length} TOTAL
                                        </span>
                                    </div>
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

            <div className="space-y-4">
                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-radar-gold" />Gerenciamento de Usuários</CardTitle>
                                <CardDescription>Gerencie funções e permissões de cada membro da seção</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                        <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-wide text-radar-dark dark:text-white min-w-[160px]">Nome</th>
                                        <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-wide text-radar-dark dark:text-white min-w-[180px]">E-mail</th>
                                        <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-wide text-radar-dark dark:text-white min-w-[120px]">Função</th>
                                        <th className="text-center px-3 py-3 font-black text-[10px] uppercase tracking-wide text-radar-dark dark:text-white min-w-[80px]">Ed. Pregões</th>
                                        <th className="text-center px-3 py-3 font-black text-[10px] uppercase tracking-wide text-radar-dark dark:text-white min-w-[80px]">Ed. Datas</th>
                                        <th className="text-center px-3 py-3 font-black text-[10px] uppercase tracking-wide text-radar-dark dark:text-white min-w-[80px]">Conferência</th>
                                        <th className="text-center px-3 py-3 font-black text-[10px] uppercase tracking-wide text-radar-dark dark:text-white min-w-[80px]">Ed. Usuários</th>
                                        <th className="text-center px-3 py-3 font-black text-[10px] uppercase tracking-wide text-radar-dark dark:text-white min-w-[80px]">Visualização</th>
                                        <th className="text-center px-3 py-3 font-black text-[10px] uppercase tracking-wide text-muted-foreground min-w-[60px]">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teamMembers.map((u, idx) => (
                                        <tr key={u.id} className={`border-b border-slate-100 dark:border-slate-800 hover:bg-amber-50/40 dark:hover:bg-slate-800/50 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/50 dark:bg-slate-900/20'}`}>
                                            {/* Nome */}
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 bg-radar-dark text-white rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                                                        {(u.full_name || u.name || '?')[0]}
                                                    </div>
                                                    <span className="font-semibold text-radar-dark dark:text-white text-xs truncate max-w-[120px]">{u.full_name || u.name}</span>
                                                </div>
                                            </td>
                                            {/* E-mail */}
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-1">
                                                    <span className={`text-xs truncate max-w-[150px] ${!u.email ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                                                        {u.email || '⚠️ Sem e-mail'}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-5 w-5 bg-radar-gold/10 hover:bg-radar-gold text-radar-dark border border-radar-gold/20 flex-shrink-0"
                                                        title="Definir e-mail"
                                                        onClick={async () => {
                                                            const newEmail = prompt(`Definir E-mail para ${u.name}:`, u.email || "");
                                                            if (newEmail !== null && newEmail.trim() !== "") {
                                                                const emailLower = newEmail.toLowerCase().trim();
                                                                try {
                                                                    const { error: updateErr } = await supabase.from('team_members').update({ email: emailLower }).eq('id', u.id);
                                                                    if (updateErr) throw updateErr;
                                                                    alert(`E-mail definido: ${emailLower}`);
                                                                    window.location.reload();
                                                                } catch (err: any) {
                                                                    alert("Erro ao salvar e-mail: " + err.message);
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <UserCog className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </td>
                                            {/* Função */}
                                            <td className="px-4 py-2">
                                                <input
                                                    defaultValue={u.role || ''}
                                                    className="text-xs bg-transparent border-b border-transparent hover:border-radar-gold/40 focus:border-radar-gold outline-none w-full text-muted-foreground focus:text-radar-dark dark:focus:text-white transition-colors py-0.5 px-1"
                                                    placeholder="Sem função"
                                                    onBlur={async (e) => {
                                                        const newRole = e.target.value.trim();
                                                        if (newRole !== (u.role || '')) {
                                                            try {
                                                                const { error } = await supabase.from('team_members').update({ role: newRole }).eq('id', u.id);
                                                                if (error) alert('Erro ao salvar função: ' + error.message);
                                                                else window.location.reload();
                                                            } catch (err: any) {
                                                                alert('Erro: ' + err.message);
                                                            }
                                                        }
                                                    }}
                                                />
                                            </td>
                                            {/* Permissões */}
                                            {(['edit_tenders', 'edit_dates', 'bulk_check', 'edit_users', 'view_all'] as const).map(permId => (
                                                <td key={permId} className="px-3 py-2 text-center">
                                                    <button
                                                        title={!u.email ? 'Defina o e-mail primeiro' : (u.permissions?.[permId] ? 'Revogar permissão' : 'Conceder permissão')}
                                                        className={`h-5 w-5 rounded border-2 mx-auto flex items-center justify-center transition-all ${u.permissions?.[permId]
                                                            ? 'bg-radar-gold border-radar-gold text-white shadow-sm'
                                                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-radar-gold/50'
                                                            } ${!u.email ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
                                                        onClick={async () => {
                                                            if (!u.email) { alert('Defina o e-mail primeiro.'); return; }
                                                            const newPerms = { ...(u.permissions || {}), [permId]: !u.permissions?.[permId] };
                                                            if (u.is_auth_user) {
                                                                const { error } = await supabase.from('profiles').update({ permissions: newPerms }).eq('id', u.profile_id);
                                                                if (error) alert('Erro ao salvar permissão: ' + error.message);
                                                                else window.location.reload();
                                                            } else {
                                                                const { error } = await supabase.from('team_members').update({ permissions: newPerms }).eq('id', u.id);
                                                                if (error) alert('Erro ao salvar permissão: ' + error.message);
                                                                else window.location.reload();
                                                            }
                                                        }}
                                                    >
                                                        {u.permissions?.[permId] && <CheckSquare className="h-3 w-3" />}
                                                    </button>
                                                </td>
                                            ))}
                                            {/* Ações */}
                                            <td className="px-3 py-2 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-blue-50 text-blue-500" title="Editar membro" onClick={() => setEditingMember(u)}>
                                                        <UserCog className="h-3 w-3" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-50 text-red-400" title="Remover membro" onClick={() => handleDeleteMember(u)}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Visitantes: usuários autenticados sem cadastro em team_members */}
                                    {allProfiles
                                        .filter(p => !teamMembers.some(m => m.email?.toLowerCase().trim() === p.email?.toLowerCase().trim()))
                                        .map((visitor, idx) => (
                                            <tr key={visitor.id} className={`border-b border-slate-100 dark:border-slate-800 opacity-70 ${idx === 0 ? 'border-t-2 border-t-slate-200 dark:border-t-slate-700' : ''}`}>
                                                {/* Nome visitante */}
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-7 w-7 bg-slate-400 text-white rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                                                            {(visitor.full_name || visitor.email || '?')[0].toUpperCase()}
                                                        </div>
                                                        <span className="font-medium text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{visitor.full_name || visitor.email?.split('@')[0]}</span>
                                                    </div>
                                                </td>
                                                {/* E-mail visitante */}
                                                <td className="px-4 py-2">
                                                    <span className="text-xs text-muted-foreground truncate max-w-[150px] block">{visitor.email}</span>
                                                </td>
                                                {/* Função = Visitante */}
                                                <td className="px-4 py-2">
                                                    <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Visitante</span>
                                                </td>
                                                {/* Permissões visitante */}
                                                {(['edit_tenders', 'edit_dates', 'bulk_check', 'edit_users', 'view_all'] as const).map(permId => (
                                                    <td key={permId} className="px-3 py-2 text-center">
                                                        <button
                                                            className={`h-5 w-5 rounded border-2 mx-auto flex items-center justify-center transition-all cursor-pointer hover:scale-110 ${visitor.permissions?.[permId]
                                                                ? 'bg-radar-gold border-radar-gold text-white shadow-sm'
                                                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-radar-gold/50'
                                                                }`}
                                                            title={visitor.permissions?.[permId] ? 'Revogar permissão' : 'Conceder permissão'}
                                                            onClick={async () => {
                                                                const newPerms = { ...(visitor.permissions || {}), [permId]: !visitor.permissions?.[permId] };
                                                                const { error } = await supabase.from('profiles').update({ permissions: newPerms }).eq('id', visitor.id);
                                                                if (error) alert('Erro ao salvar permissão: ' + error.message);
                                                                else window.location.reload();
                                                            }}
                                                        >
                                                            {visitor.permissions?.[permId] && <CheckSquare className="h-3 w-3" />}
                                                        </button>
                                                    </td>
                                                ))}
                                                {/* Sem ações de edição para visitantes */}
                                                <td className="px-3 py-2 text-center">
                                                    <span className="text-[10px] text-slate-300">—</span>
                                                </td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

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

                <div className="grid gap-6 md:grid-cols-2">

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
            </div>
        </div >
    )
}
