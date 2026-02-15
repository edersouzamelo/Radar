import Link from "next/link";
import Image from "next/image";
import {
    LayoutDashboard,
    Gavel,
    AlertCircle,
    FileText,
    Settings,
    LogOut,
    Calendar as CalendarIcon,
    Shield,
    MessageSquare,
    Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/user-context";

export function Sidebar() {
    const { role, logout } = useUser();

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Agenda', href: '/agenda', icon: CalendarIcon },
        { name: 'Pregões', href: '/tenders', icon: Gavel },
        { name: 'Intercorrências', href: '/issues', icon: AlertCircle },
        { name: 'Relatórios', href: '/reports', icon: FileText },
        { name: 'Contato', href: '/contact', icon: MessageSquare },
    ];

    if (role === 'Chefe da Seção de Licitações') {
        navigation.push({ name: 'Gerenciamento de Perfis', href: '/admin', icon: Shield });
        navigation.push({ name: 'Central de Alertas', href: '/admin/notifications', icon: Bell });
    }

    return (
        <div className="flex h-full w-[18rem] flex-col bg-[#1A1A1A] text-[#FDFBF7] rounded-r-[3rem] shadow-2xl mr-4 my-4 ml-4 h-[calc(100vh-2rem)] border-r border-white/10">
            <div className="flex h-[20rem] items-center justify-center py-4 shrink-0">
                <Link href="/" className="flex flex-col items-center gap-4 transition-transform hover:scale-105">
                    <div className="relative h-[16rem] w-[16rem] drop-shadow-2xl">
                        <Image
                            src="/radar-logo.png"
                            alt="Radar Logo"
                            fill
                            className="object-contain"
                            priority
                            unoptimized
                        />
                    </div>
                </Link>
            </div>

            <div className="flex-1 flex flex-col gap-2 overflow-y-auto px-4 py-4">
                <nav className="space-y-2">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "group flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                "text-gray-400 hover:bg-[#FFB000] hover:text-[#1A1A1A] hover:shadow-lg hover:shadow-[#FFB000]/20"
                            )}
                        >
                            <item.icon
                                className="mr-3 h-5 w-5 transition-colors group-hover:text-radar-dark"
                                aria-hidden="true"
                            />
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="p-6 shrink-0">
                <div className="rounded-2xl bg-white/5 p-4 backdrop-blur-sm">
                    <button className="group flex w-full items-center rounded-xl p-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                        <Settings className="mr-3 h-5 w-5" />
                        Configurações
                    </button>
                    <button
                        onClick={logout}
                        className="mt-2 group flex w-full items-center rounded-xl p-2 text-sm font-medium text-gray-400 hover:text-red-400 transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sair
                    </button>
                </div>
            </div>
        </div>
    );
}
