"use client"

import { useNotifications } from "@/contexts/notifications-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Send, Mail, MessageSquare, Smartphone, History, Users } from "lucide-react"

export default function AdminNotificationsPage() {
    const { subscribers, logs, removeSubscriber, checkAndSendNotifications } = useNotifications()

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-radar-dark tracking-tighter">CENTRAL DE NOTIFICAÇÕES</h1>
                    <p className="text-sm text-gray-500">Gerencie subscrições e acompanhe disparos automáticos.</p>
                </div>
                <Button
                    onClick={checkAndSendNotifications}
                    className="bg-radar-gold text-radar-dark font-bold hover:bg-radar-gold/80"
                >
                    <Send className="w-4 h-4 mr-2" />
                    Simular Disparo Diário
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lista de Inscritos */}
                <Card className="border-none shadow-lg">
                    <CardHeader className="border-b bg-gray-50/50">
                        <div className="flex items-center space-x-2">
                            <Users className="w-5 h-5 text-radar-dark" />
                            <CardTitle className="text-lg">Subscritores Ativos</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3">Nome / Setor</th>
                                        <th className="px-6 py-3">Canais</th>
                                        <th className="px-6 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscribers.map((sub) => (
                                        <tr key={sub.id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-radar-dark">{sub.name}</div>
                                                <div className="text-xs text-gray-400">{sub.department}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex space-x-2">
                                                    {sub.preferences.email && <Mail className="w-4 h-4 text-blue-500" />}
                                                    {sub.preferences.whatsapp && <MessageSquare className="w-4 h-4 text-green-500" />}
                                                    {sub.preferences.sms && <Smartphone className="w-4 h-4 text-orange-500" />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => removeSubscriber(sub.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {subscribers.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                                                Nenhum subscritor cadastrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Log de Envios */}
                <Card className="border-none shadow-lg">
                    <CardHeader className="border-b bg-gray-50/50">
                        <div className="flex items-center space-x-2">
                            <History className="w-5 h-5 text-radar-dark" />
                            <CardTitle className="text-lg">Histórico de Disparos</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[400px] overflow-y-auto">
                            {logs.map((log) => (
                                <div key={log.id} className="flex items-center justify-between p-4 border-b hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-2 rounded-full ${log.channel === 'whatsapp' ? 'bg-green-100 text-green-600' :
                                                log.channel === 'email' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-orange-100 text-orange-600'
                                            }`}>
                                            {log.channel === 'whatsapp' && <MessageSquare className="w-4 h-4" />}
                                            {log.channel === 'email' && <Mail className="w-4 h-4" />}
                                            {log.channel === 'sms' && <Smartphone className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-radar-dark">
                                                {log.type === '30_days' ? 'Alerta de 30 Dias' :
                                                    log.type === '5_days' ? 'Alerta de 5 Dias' : 'Alerta de Abertura'}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                Para {log.subscriberName} • Pregão {log.tenderNumber}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="success" className="text-[10px]">ENVIADO</Badge>
                                        <div className="text-[10px] text-gray-400 mt-1">
                                            {new Date(log.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <div className="p-8 text-center text-gray-400">
                                    Nenhuma notificação enviada hoje.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
