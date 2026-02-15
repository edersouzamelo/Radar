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
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 text-radar-dark dark:text-white border-radar-gold shadow-2xl">
                <DialogHeader className="border-b pb-4 mb-4">
                    <DialogTitle className="text-2xl font-bold">Novo Pregão</DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400">
                        Preencha os dados básicos do novo pregão. Clique em Salvar quando terminar.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 py-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="number" className="font-semibold">
                                Número do Processo
                            </Label>
                            <Input id="number" placeholder="99/2026" className="focus:ring-radar-gold" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="uasg" className="font-semibold">
                                UASG
                            </Label>
                            <Input id="uasg" placeholder="987654" className="focus:ring-radar-gold" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="date" className="font-semibold">
                                Data de Abertura
                            </Label>
                            <Input id="date" type="datetime-local" className="focus:ring-radar-gold" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="description" className="font-semibold">
                                Objeto da Licitação
                            </Label>
                            <Input id="description" placeholder="Aquisição de material..." className="focus:ring-radar-gold" />
                        </div>
                    </div>
                    <DialogFooter className="mt-8 pt-4 border-t">
                        <Button
                            type="submit"
                            className="w-full bg-radar-dark hover:bg-black text-white font-bold h-12 transition-all hover:scale-[1.02] shadow-lg"
                        >
                            Salvar Pregão
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
