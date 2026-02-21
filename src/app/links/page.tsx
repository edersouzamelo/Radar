"use client"

import { useState, useEffect } from "react"
import { useTenders } from "@/contexts/tenders-context"
import {
    Users2,
    UserCircle2,
    Plus,
    Search,
    Phone,
    Mail,
    Building2,
    Gavel,
    SearchCode,
    ArrowRightLeft,
    MoreHorizontal,
    Trash2,
    Edit2,
    GripVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Person } from "@/types"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

const REQUISITANTES_SECTORS = [
    '9º B Mnt', '9º B Sup', '18º B Trnp', 'Cia Cmdo', '9º B Sau', 'Cmdo 9º Gpt'
]

export default function LinksPage() {
    const {
        people, addPerson, updatePerson, deletePerson,
        pregoeiros, addPregoeiro, updatePregoeiro, deletePregoeiro,
        tenders, assignTenderToPregoeiro,
        searchQuery, setSearchQuery
    } = useTenders()

    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        setEnabled(true);
    }, []);

    const onDragEnd = (result: any) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        // O draggableId é o tender.id
        // O destination.droppableId é o pregoeiro.id ou 'none'
        const tenderId = draggableId;
        const newPregoeiroId = destination.droppableId;

        assignTenderToPregoeiro(tenderId, newPregoeiroId);
    };



    const [isAddPersonOpen, setIsAddPersonOpen] = useState(false)
    const [editingPerson, setEditingPerson] = useState<Person | null>(null)
    const [newPerson, setNewPerson] = useState<Omit<Person, 'id'>>({
        name: "",
        role: "",
        whatsapp: "",
        email: "",
        sector: REQUISITANTES_SECTORS[0]
    })

    const [isPregoeiroModalOpen, setIsPregoeiroModalOpen] = useState(false)
    const [editingPregoeiro, setEditingPregoeiro] = useState<any | null>(null)
    const [pregoeiroData, setPregoeiroData] = useState<Omit<any, 'id'>>({
        name: "",
        role: "Pregoeiro",
        whatsapp: "",
        email: ""
    })

    if (!enabled) return null;

    const handleAddPerson = () => {
        if (!newPerson.name) return
        addPerson(newPerson)
        setIsAddPersonOpen(false)
        setNewPerson({
            name: "",
            role: "",
            whatsapp: "",
            email: "",
            sector: REQUISITANTES_SECTORS[0]
        })
    }

    const handleEditPerson = (person: Person) => {
        setEditingPerson(person)
        setNewPerson({ ...person })
        setIsAddPersonOpen(true)
    }

    const handleSaveEdit = () => {
        if (!editingPerson || !newPerson.name) return
        updatePerson(editingPerson.id, newPerson)
        setIsAddPersonOpen(false)
        setEditingPerson(null)
    }

    const handleAddPregoeiro = () => {
        if (!pregoeiroData.name) return
        addPregoeiro(pregoeiroData)
        setIsPregoeiroModalOpen(false)
        setPregoeiroData({ name: "", role: "Pregoeiro", whatsapp: "", email: "" })
    }

    const handleEditPregoeiro = (pregoeiro: any) => {
        setEditingPregoeiro(pregoeiro)
        setPregoeiroData({ ...pregoeiro })
        setIsPregoeiroModalOpen(true)
    }

    const handleSavePregoeiroEdit = () => {
        if (!editingPregoeiro || !pregoeiroData.name) return
        updatePregoeiro(editingPregoeiro.id, pregoeiroData)
        setIsPregoeiroModalOpen(false)
        setEditingPregoeiro(null)
    }

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] w-full gap-4">
            <header className="flex flex-col gap-2 shrink-0 px-4 pt-4 pb-2 bg-white rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-xl">
                        <Users2 className="w-6 h-6 text-amber-700" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Módulo de Vínculos</h1>
                        <p className="text-muted-foreground text-sm font-medium">Gerenciamento de contatos e atribuição de responsabilidades</p>
                    </div>
                </div>
            </header>

            <Tabs defaultValue="requisitantes" className="flex-1 flex flex-col min-h-0 px-4 md:px-8">
                <TabsList className="grid w-fit grid-cols-2 bg-muted/50 p-1 mb-4 shrink-0">
                    <TabsTrigger value="requisitantes" className="gap-2 px-6">
                        <Users2 className="w-4 h-4" />
                        Requisitantes
                    </TabsTrigger>
                    <TabsTrigger value="pregoeiros" className="gap-2 px-6">
                        <Gavel className="w-4 h-4" />
                        Pregoeiros
                    </TabsTrigger>
                </TabsList>

                {/* ABA REQUISITANTES */}
                <TabsContent value="requisitantes" className="flex-1 min-h-0 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar no módulo..."
                                className="pl-9 bg-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Dialog open={isAddPersonOpen} onOpenChange={(open) => {
                            setIsAddPersonOpen(open)
                            if (!open) {
                                setEditingPerson(null)
                                setNewPerson({
                                    name: "", role: "", whatsapp: "", email: "", sector: REQUISITANTES_SECTORS[0]
                                })
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button className="bg-amber-600 hover:bg-amber-700 gap-2">
                                    <Plus className="w-4 h-4" />
                                    Novo Contato
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>{editingPerson ? "Editar Contato" : "Adicionar Novo Contato"}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nome Completo</Label>
                                        <Input id="name" value={newPerson.name} onChange={e => setNewPerson({ ...newPerson, name: e.target.value })} placeholder="Ex: Cap Silva" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role">Função</Label>
                                        <Input id="role" value={newPerson.role} onChange={e => setNewPerson({ ...newPerson, role: e.target.value })} placeholder="Ex: Fiscal" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="sector">Setor Requisitante</Label>
                                        <Select value={newPerson.sector} onValueChange={v => setNewPerson({ ...newPerson, sector: v })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {REQUISITANTES_SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="whatsapp">WhatsApp</Label>
                                        <Input id="whatsapp" value={newPerson.whatsapp} onChange={e => setNewPerson({ ...newPerson, whatsapp: e.target.value })} placeholder="+55..." />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">E-mail</Label>
                                        <Input id="email" type="email" value={newPerson.email} onChange={e => setNewPerson({ ...newPerson, email: e.target.value })} placeholder="email@exemplo.com" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={editingPerson ? handleSaveEdit : handleAddPerson} className="bg-amber-600 hover:bg-amber-700">
                                        {editingPerson ? "Salvar Alterações" : "Criar Contato"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4 items-start custom-scrollbar">
                        {REQUISITANTES_SECTORS.map(sector => (
                            <div key={sector} className="flex flex-col gap-3 min-w-[200px]">
                                <div className="flex items-center justify-between px-2 py-1 bg-muted/40 rounded-lg border">
                                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{sector}</h3>
                                    <Badge variant="outline" className="text-[10px] h-4 min-w-4 flex justify-center">{people.filter(p => p.sector === sector).length}</Badge>
                                </div>
                                <div className="flex flex-col gap-2 min-h-[100px] p-2 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
                                    {people.filter(p => p.sector === sector && (
                                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        p.role.toLowerCase().includes(searchQuery.toLowerCase())
                                    ))
                                        .map(person => (
                                            <Card key={person.id} className="p-3 shadow-sm hover:shadow-md transition-all group relative border-l-4 border-l-amber-500 overflow-hidden">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-xs font-bold text-slate-900 leading-tight">{person.name}</span>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleEditPerson(person)} className="p-1 hover:bg-slate-100 rounded text-blue-600"><Edit2 className="w-3 h-3" /></button>
                                                            <button onClick={() => deletePerson(person.id)} className="p-1 hover:bg-slate-100 rounded text-red-600"><Trash2 className="w-3 h-3" /></button>
                                                        </div>
                                                    </div>
                                                    <Badge variant="secondary" className="text-[9px] w-fit h-4 px-1 bg-amber-50 text-amber-900 border-amber-100 font-bold uppercase">{person.role}</Badge>
                                                    <div className="flex flex-col gap-1 mt-1">
                                                        {person.whatsapp && (
                                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                                <Phone className="w-3 h-3 shrink-0" />
                                                                <span className="truncate">{person.whatsapp}</span>
                                                            </div>
                                                        )}
                                                        {person.email && (
                                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                                <Mail className="w-3 h-3 shrink-0" />
                                                                <span className="truncate italic">{person.email}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    {people.filter(p => p.sector === sector).length === 0 && (
                                        <p className="text-[10px] text-center text-muted-foreground py-4 italic">Nenhum contato</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                {/* ABA PREGOEIROS */}
                <TabsContent value="pregoeiros" className="flex-1 min-h-0 flex flex-col gap-4">
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                            <Gavel className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">Distribuição de Carga de Trabalho</p>
                                <p className="text-[11px] text-amber-800">Assign/Mova processos entre pregoeiros para equilibrar a equipe. Todos os processos ({tenders.length}) estão listados abaixo.</p>
                            </div>
                        </div>
                        <Dialog open={isPregoeiroModalOpen} onOpenChange={(open) => {
                            setIsPregoeiroModalOpen(open)
                            if (!open) {
                                setEditingPregoeiro(null)
                                setPregoeiroData({ name: "", role: "Pregoeiro", whatsapp: "", email: "" })
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-2 h-7 text-xs font-bold">
                                    <Plus className="w-3 h-3" />
                                    Novo Pregoeiro
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>{editingPregoeiro ? "Editar Pregoeiro" : "Adicionar Novo Pregoeiro"}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="p-name">Nome Completo</Label>
                                        <Input id="p-name" value={pregoeiroData.name} onChange={e => setPregoeiroData({ ...pregoeiroData, name: e.target.value })} placeholder="Ex: Cap Silva" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="p-role">Função</Label>
                                        <Input id="p-role" value={pregoeiroData.role} onChange={e => setPregoeiroData({ ...pregoeiroData, role: e.target.value })} placeholder="Ex: Pregoeiro" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="p-whatsapp">WhatsApp</Label>
                                            <Input id="p-whatsapp" value={pregoeiroData.whatsapp} onChange={e => setPregoeiroData({ ...pregoeiroData, whatsapp: e.target.value })} placeholder="+55..." />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="p-email">E-mail</Label>
                                            <Input id="p-email" value={pregoeiroData.email} onChange={e => setPregoeiroData({ ...pregoeiroData, email: e.target.value })} placeholder="ex@mil.br" />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="flex justify-between items-center sm:justify-between w-full">
                                    {editingPregoeiro && (
                                        <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs" onClick={() => {
                                            if (confirm("Deseja realmente excluir este pregoeiro?")) {
                                                deletePregoeiro(editingPregoeiro.id);
                                                setIsPregoeiroModalOpen(false);
                                            }
                                        }}>
                                            Excluir
                                        </Button>
                                    )}
                                    <Button onClick={editingPregoeiro ? handleSavePregoeiroEdit : handleAddPregoeiro} className="bg-blue-600 hover:bg-blue-700 ml-auto">
                                        {editingPregoeiro ? "Salvar Alterações" : "Criar Pregoeiro"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div className="flex-1 relative min-h-0">
                        <DragDropContext onDragEnd={onDragEnd}>
                            <div className="absolute inset-0 overflow-x-auto overflow-y-hidden custom-kanban-scroll rounded-2xl border border-slate-200 bg-slate-50/50">
                                <style jsx global>{`
                                    .custom-kanban-scroll::-webkit-scrollbar {
                                        height: 16px !important;
                                        display: block !important;
                                    }
                                    .custom-kanban-scroll::-webkit-scrollbar-track {
                                        background: #f1f5f9 !important;
                                    }
                                    .custom-kanban-scroll::-webkit-scrollbar-thumb {
                                        background-color: #475569 !important;
                                        border-radius: 8px !important;
                                        border: 3px solid #f1f5f9 !important;
                                    }
                                `}</style>
                                <div className="flex flex-row gap-4 p-4 h-full">
                                    {/* Coluna "A Definir" */}
                                    <div className="flex flex-col gap-3 w-[300px] shrink-0 h-full">
                                        <div className="flex items-center justify-between px-3 py-2 bg-slate-100 rounded-lg border-2 border-slate-200 sticky top-0 z-10 shadow-sm">
                                            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-600 uppercase">SEM PREGOEIRO</h3>
                                            <Badge variant="secondary" className="text-[10px] h-5 min-w-5 flex justify-center bg-slate-200">{tenders.filter(t => !t.assignedPregoeiroId).length}</Badge>
                                        </div>
                                        <Droppable droppableId="none" type="TENDER">
                                            {(provided) => (
                                                <div
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                    className="flex flex-col gap-2 flex-1 overflow-y-auto p-2 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30"
                                                >
                                                    {tenders.filter(t => !t.assignedPregoeiroId && (
                                                        t.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        t.uasg.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        (t.nup && t.nup.toLowerCase().includes(searchQuery.toLowerCase()))
                                                    )).map((tender, index) => (
                                                        <Draggable key={tender.id} draggableId={tender.id} index={index}>
                                                            {(provided, snapshot) => (
                                                                <TenderCard
                                                                    tender={tender}
                                                                    onAssign={assignTenderToPregoeiro}
                                                                    pregoeiros={pregoeiros}
                                                                    provided={provided}
                                                                    isDragging={snapshot.isDragging}
                                                                />
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </div>

                                    {/* Colunas dos Pregoeiros */}
                                    {pregoeiros.map(pregoeiro => (
                                        <div key={pregoeiro.id} className="flex flex-col gap-3 w-[300px] shrink-0 h-full group">
                                            <div className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border-b-4 border-b-blue-600 shadow-sm sticky top-0 z-10">
                                                <div className="flex items-center gap-2 flex-1">
                                                    <UserCircle2 className="w-4 h-4 text-blue-600" />
                                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800 truncate">{pregoeiro.name}</h3>
                                                    <button onClick={() => handleEditPregoeiro(pregoeiro)} className="p-1 hover:bg-slate-100 rounded text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <Badge className="text-[10px] h-5 min-w-5 flex justify-center bg-blue-600">{tenders.filter(t => t.assignedPregoeiroId === pregoeiro.id).length}</Badge>
                                            </div>
                                            <Droppable droppableId={pregoeiro.id} type="TENDER">
                                                {(provided) => (
                                                    <div
                                                        {...provided.droppableProps}
                                                        ref={provided.innerRef}
                                                        className="flex-1 flex flex-col gap-2 overflow-y-auto p-2 rounded-2xl bg-blue-50/20 border border-blue-100/50 group-hover:bg-blue-50/40 transition-colors"
                                                    >
                                                        {tenders.filter(t => t.assignedPregoeiroId === pregoeiro.id && (
                                                            t.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                            t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                            t.uasg.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                            (t.nup && t.nup.toLowerCase().includes(searchQuery.toLowerCase()))
                                                        )).map((tender, index) => (
                                                            <Draggable key={tender.id} draggableId={tender.id} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <TenderCard
                                                                        tender={tender}
                                                                        onAssign={assignTenderToPregoeiro}
                                                                        pregoeiros={pregoeiros}
                                                                        currentPregoeiroId={pregoeiro.id}
                                                                        provided={provided}
                                                                        isDragging={snapshot.isDragging}
                                                                    />
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                        {tenders.filter(t => t.assignedPregoeiroId === pregoeiro.id).length === 0 && (
                                                            <div className="flex flex-col items-center justify-center h-full py-10 opacity-30 grayscale grayscale-0">
                                                                <Gavel className="w-8 h-8 text-slate-300" />
                                                                <p className="text-[9px] font-bold mt-2 uppercase">Sem carga</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </DragDropContext>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function TenderCard({ tender, onAssign, pregoeiros, currentPregoeiroId, provided, isDragging }: {
    tender: any,
    onAssign: (tid: string, pid: string) => void,
    pregoeiros: any[],
    currentPregoeiroId?: string,
    provided?: any,
    isDragging?: boolean
}) {
    return (
        <Card
            ref={provided?.innerRef}
            {...provided?.draggableProps}
            {...provided?.dragHandleProps}
            className={cn(
                "p-2.5 shadow-sm hover:shadow-md transition-all group border-l-2 border-l-slate-400 hover:border-l-blue-500 bg-white relative cursor-grab active:cursor-grabbing",
                isDragging && "shadow-xl ring-2 ring-blue-500/50 z-50 rotate-2 scale-105"
            )}
        >
            <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-1.5 flex-1">
                        <div className="text-slate-300 hover:text-slate-500 p-0.5">
                            <GripVertical className="w-3 h-3" />
                        </div>
                        <span className="text-[10px] font-black text-slate-800 leading-none">{tender.number}</span>
                    </div>
                    <Badge variant="outline" className="text-[8px] h-3 px-1 border-slate-200 text-slate-500 font-mono tracking-tighter shrink-0">{tender.uasg}</Badge>
                </div>

                <p className="text-[10px] font-medium text-slate-600 line-clamp-4 leading-snug min-h-[48px]">
                    {tender.description}
                </p>

                {tender.nup && (
                    <div className="flex items-center gap-1 opacity-60">
                        <SearchCode className="w-2.5 h-2.5" />
                        <span className="text-[8px] font-mono">{tender.nup}</span>
                    </div>
                )}

                <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                    <Badge className={cn(
                        "text-[8px] h-3 px-1 font-bold",
                        tender.status.includes("HOMOLOGADO") ? "bg-green-100 text-green-700" : "bg-blue-50 text-blue-700"
                    )}>
                        {tender.status.split(' ')[0]}...
                    </Badge>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-slate-100">
                                <ArrowRightLeft className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[300px]">
                            <DialogHeader>
                                <DialogTitle className="text-sm">Mover Processo</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col gap-2 py-4">
                                <Label className="text-xs">Atribuir a:</Label>
                                <div className="space-y-1">
                                    <Button
                                        variant={!currentPregoeiroId ? "secondary" : "ghost"}
                                        className="w-full justify-start text-xs h-8"
                                        onClick={() => onAssign(tender.id, 'none')}
                                    >
                                        Sem Pregoeiro
                                    </Button>
                                    {pregoeiros.map(p => (
                                        <Button
                                            key={p.id}
                                            variant={currentPregoeiroId === p.id ? "secondary" : "ghost"}
                                            className="w-full justify-start text-xs h-8"
                                            onClick={() => onAssign(tender.id, p.id)}
                                        >
                                            {p.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </Card>
    )
}
