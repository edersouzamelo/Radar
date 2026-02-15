import Link from "next/link";
import Image from "next/image";
import {
    LayoutDashboard,
    Gavel,
    AlertCircle,
    FileText,
    Settings,
    LogOut,
    Calendar as CalendarIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Agenda', href: '/agenda', icon: CalendarIcon },
    { name: 'Pregões', href: '/tenders', icon: Gavel },
    { name: 'Intercorrências', href: '/issues', icon: AlertCircle },
    { name: 'Relatórios', href: '/reports', icon: FileText },
];

export function Sidebar() {
    return (
        <div className="flex h-full w-64 flex-col bg-radar-dark text-radar-cream rounded-r-[3rem] shadow-2xl mr-4 my-4 ml-4 h-[calc(100vh-2rem)]">
            <div className="flex h-96 items-center justify-center py-2">
                <div className="flex flex-col items-center gap-2">
                    <div className="relative h-80 w-80">
                        <Image
                            src="/radar-logo.png"
                            alt="Radar Logo"
                            fill
                            className="object-contain"
                            priority
                            unoptimized
                        />
                    </div>
                    {/* <span className="text-2xl font-bold tracking-wider text-white">RADAR</span> */}
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-2 overflow-y-auto px-4 py-6">
                <nav className="space-y-2">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "group flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                "text-gray-400 hover:bg-radar-gold hover:text-radar-dark hover:shadow-lg hover:shadow-radar-gold/20"
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

            <div className="p-6">
                <div className="rounded-2xl bg-white/5 p-4 backdrop-blur-sm">
                    <button className="group flex w-full items-center rounded-xl p-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                        <Settings className="mr-3 h-5 w-5" />
                        Configurações
                    </button>
                    <button className="mt-2 group flex w-full items-center rounded-xl p-2 text-sm font-medium text-gray-400 hover:text-red-400 transition-colors">
                        <LogOut className="mr-3 h-5 w-5" />
                        Sair
                    </button>
                </div>
            </div>
        </div>
    );
}
