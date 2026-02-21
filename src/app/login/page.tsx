"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser, UserRole } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Github, Mail } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
    const router = useRouter()
    const { login } = useUser()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        // Simulação de login
        setTimeout(() => {
            // Se for o chefe, bota como chefe, senão pregoeiro padrão para fins de demo
            const role: UserRole = email.includes('chefe') ? 'Chefe da Seção de Licitações' : 'Pregoeiro'
            login(role, email.split('@')[0], email)
            setIsLoading(false)
            router.push('/')
        }, 1500)
    }

    const handleGmailLogin = () => {
        setIsLoading(true)
        setTimeout(() => {
            login('Chefe da Seção de Licitações', 'Admin User', 'admin@gmail.com')
            setIsLoading(false)
            router.push('/')
        }, 1000)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] dark:bg-[#1A1A1A] p-4 relative overflow-hidden">
            {/* Watermark Logo (Closer to center) */}
            <div className="absolute right-[10%] top-0 bottom-0 w-1/2 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                <div className="relative h-full w-full scale-150 transform translate-x-1/4">
                    <Image
                        src="/radar-logo.png"
                        alt="Watermark"
                        fill
                        className="object-contain"
                        priority
                        unoptimized
                    />
                </div>
            </div>

            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-radar-gold/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-radar-blue/5 rounded-full blur-3xl"></div>

            <Card className="w-full max-w-lg border-radar-gold/20 shadow-2xl relative z-10 glass">
                <CardHeader className="space-y-4 text-center pb-8">
                    <div className="flex justify-center mb-2">
                        <div className="relative h-80 w-80 drop-shadow-2xl">
                            <Image
                                src="/radar-logo.png"
                                alt="Radar Logo"
                                fill
                                className="object-contain"
                                priority
                                unoptimized
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-4xl font-black tracking-tighter text-radar-dark dark:text-white">
                            RADAR
                        </CardTitle>
                        <p className="text-xs font-bold uppercase tracking-widest text-radar-gold px-4">
                            Registro de Auditoria das Despesas e Aquisições Realizadas
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid grid-cols-1 gap-4">
                        <Button
                            variant="outline"
                            className="w-full border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                            onClick={handleGmailLogin}
                            disabled={isLoading}
                        >
                            <Mail className="mr-2 h-4 w-4 text-red-500" />
                            Entrar com Gmail
                        </Button>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-200 dark:border-gray-800" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-radar-dark px-2 text-muted-foreground font-semibold">
                                Ou continue com
                            </span>
                        </div>
                    </div>
                    <form onSubmit={handleLogin}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="font-semibold">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu.nome@exército.mil.br"
                                    className="border-gray-300 focus:ring-radar-gold"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Senha</Label>
                                    <Button variant="link" className="px-0 font-medium text-radar-gold hover:text-radar-gold/80 h-auto text-xs">
                                        Esqueceu a senha?
                                    </Button>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    className="border-gray-300 focus:ring-radar-gold"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-radar-dark text-white hover:bg-gray-800 mt-2 h-11 text-base font-semibold transition-all hover:scale-[1.01]"
                                disabled={isLoading}
                            >
                                {isLoading ? "Autenticando..." : "Entrar no Sistema"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <p className="text-center text-[10px] text-gray-400 max-w-[280px]">
                        Sistema Restrito para uso militar.
                        O acesso indevido está sujeito a sanções conforme o RDE.
                    </p>
                    <div className="absolute bottom-4 right-4 text-[10px] text-muted-foreground opacity-50 font-mono">
                        v1.2.5
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
