"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUser } from "@/contexts/user-context"
import { Plus } from "lucide-react"

export function CreateTenderModal() {
    const { role } = useUser();
    const [open, setOpen] = useState(false);

    // Permissões: Apenas Chefe SALC, Pregoeiro e Auxiliares
    const canCreate = ['Chefe da Seção de Licitações', 'Pregoeiro', 'Auxiliar'].includes(role);

    if (!canCreate) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Lógica simulada de envio
        alert("Pregão seria salvo no banco de dados.");
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-radar-gold text-radar-dark hover:bg-radar-gold/90 font-bold">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Pregão
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-radar-cream text-radar-dark border-radar-gold">
                <DialogHeader>
                    <DialogTitle>Novo Pregão</DialogTitle>
                    <DialogDescription>
                        Preencha os dados básicos do novo pregão. Clique em Salvar quando terminar.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="number" className="text-right">
                                Número
                            </Label>
                            <Input id="number" placeholder="99/2026" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="uasg" className="text-right">
                                UASG
                            </Label>
                            <Input id="uasg" placeholder="987654" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">
                                Abertura
                            </Label>
                            <Input id="date" type="datetime-local" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                Objeto
                            </Label>
                            <Input id="description" placeholder="Aquisição de..." className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" className="bg-radar-dark text-white hover:bg-gray-800">Salvar alterações</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
