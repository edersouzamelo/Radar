"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Mail, Linkedin, GraduationCap, Link2, BookOpen, Globe } from "lucide-react"

export default function ContactPage() {
    const contactLinks = [
        { name: "Email", href: "mailto:edersouzamelo@gmail.com", icon: Mail, label: "edersouzamelo@gmail.com" },
        { name: "LinkedIn", href: "https://www.linkedin.com/in/edersouzamelo/", icon: Linkedin, label: "LinkedIn Profile" },
        { name: "OSF", href: "https://osf.io/r4yf8", icon: GraduationCap, label: "Open Science Framework" },
        { name: "ORCID", href: "https://orcid.org/0009-0003-6835-135X", icon: GraduationCap, label: "ORCID iD" },
        { name: "Google Scholar", href: "https://scholar.google.com.br/citations?view_op=list_works&hl=pt-BR&hl=pt-BR&user=arfpm2gAAAAJ&pagesize=80", icon: BookOpen, label: "Citações Acadêmicas" },
        { name: "Academia.edu", href: "https://ufmt.academia.edu/EdervaldoMelo", icon: GraduationCap, label: "Publicações na Academia" },
        { name: "Zenodo", href: "https://zenodo.org/communities/sistema-nemosine", icon: Globe, label: "Comunidade Nemosine" },
        { name: "Taggo", href: "https://taggo.one/souzamelo", icon: Link2, label: "Taggo / Social Hub" },
    ]

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-radar-dark dark:text-white">Contato com o Desenvolvedor</h1>
                <p className="text-muted-foreground">Perfis profissionais, acadêmicos e meios de comunicação direta.</p>
            </div>

            <Card className="border-radar-gold/20 shadow-xl overflow-hidden">
                <CardHeader className="bg-radar-dark text-white p-8">
                    <div className="flex items-center gap-6">
                        <div className="h-24 w-24 rounded-full bg-radar-gold flex items-center justify-center text-radar-dark text-4xl font-bold shadow-lg">
                            EM
                        </div>
                        <div>
                            <CardTitle className="text-3xl">Edervaldo José de Souza Melo</CardTitle>
                            <CardDescription className="text-radar-gold font-medium mt-1">Desenvolvedor do Sistema RADAR</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contactLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-radar-gold/10 hover:border-radar-gold/50 transition-all group"
                            >
                                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 text-radar-dark dark:text-radar-gold transition-colors group-hover:bg-radar-gold group-hover:text-radar-dark">
                                    <link.icon className="h-5 w-5" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-semibold text-radar-dark dark:text-white">{link.name}</p>
                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{link.label}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
