"use client"

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, UploadCloud, Download, Trash2, Loader2, ShieldAlert } from 'lucide-react';
import { useUser } from '@/contexts/user-context';

interface TenderFile {
    id: string;
    tender_id: string;
    file_name: string;
    file_size: number;
    file_url: string;
    uploaded_by: string;
    uploaded_at: string;
}

export function TenderFiles({ tenderId }: { tenderId: string }) {
    const { role, user } = useUser();
    const isMajor = user?.email?.toLowerCase().trim() === 'edersouzamelo@gmail.com';
    const canManageFiles = role === 'Chefe da Seção de Licitações' || role === 'Administrador' || role === 'Pregoeiro' || isMajor;

    const [files, setFiles] = useState<TenderFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }
        fetchFiles();
    }, [tenderId]);

    const fetchFiles = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('tender_files')
                .select('*')
                .eq('tender_id', tenderId)
                .order('uploaded_at', { ascending: false });

            if (!error && data) {
                setFiles(data);
            } else if (error) {
                console.error("Error fetching files:", error.message);
            }
        } catch (e) {
            console.error("Unknown error fetching files:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // Get user or just use a placeholder if auth is not fully configured for this context
            const { data: userData } = await supabase.auth.getUser();
            const uploadedBy = userData?.user?.email || 'Usuário RADAR';

            // Upload to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${tenderId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('tender_documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('tender_documents')
                .getPublicUrl(filePath);

            // Save to DB
            const { data: insertedData, error: dbError } = await supabase
                .from('tender_files')
                .insert([{
                    tender_id: tenderId,
                    file_name: file.name,
                    file_size: file.size,
                    file_url: publicUrl,
                    uploaded_by: uploadedBy
                }])
                .select();

            if (dbError) throw dbError;

            // Trigger RAG Processing text extraction
            if (insertedData && insertedData[0]) {
                try {
                    await fetch('/api/rag/process', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            fileUrl: publicUrl,
                            tenderId: tenderId,
                            fileId: insertedData[0].id,
                            fileName: file.name
                        })
                    });
                } catch (ragError) {
                    console.error("Erro interno no RAG endpoint:", ragError);
                    // Falha no RAG não deve impedir a lista de carregar a interface do PDF.
                }
            }

            // Refresh list
            fetchFiles();
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Erro ao enviar o arquivo. Verifique se a tabela e o bucket foram criados no Supabase.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDelete = async (id: string, fileUrl: string) => {
        if (!confirm('Deseja realmente excluir este arquivo?')) return;

        try {
            // Extract path from public URL
            const urlParts = fileUrl.split('/');
            const filePath = urlParts[urlParts.length - 1];

            if (filePath) {
                await supabase.storage.from('tender_documents').remove([filePath]);
            }

            const { error } = await supabase
                .from('tender_files')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('Erro ao excluir o arquivo.');
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (!supabase) return null;

    return (
        <Card className="mb-6 border-radar-gold/30 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-radar-gold"></div>
            <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <UploadCloud className="h-5 w-5 text-radar-gold" />
                        Minutas e Documentos
                    </CardTitle>
                    <div>
                        {canManageFiles ? (
                            <>
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                                />
                                <Button
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="bg-radar-gold text-radar-dark hover:bg-radar-gold/80 font-semibold"
                                >
                                    {isUploading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lendo para IA...</>
                                    ) : (
                                        <><UploadCloud className="mr-2 h-4 w-4" /> Enviar Arquivo</>
                                    )}
                                </Button>
                            </>
                        ) : (
                            <span className="text-[10px] text-muted-foreground flex items-center font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                <ShieldAlert className="w-3 h-3 text-amber-500 mr-1" /> Somente Gestores enviam arquivos.
                            </span>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                {isLoading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : files.length === 0 ? (
                    <div className="text-center p-6 border-2 border-dashed rounded-lg bg-muted/20">
                        <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium text-foreground">Ainda não há documentos anexados.</p>
                        <p className="text-xs text-muted-foreground mt-1">Faça o upload de Editais, Termos de Referência (TR) e minutas.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {files.map(file => (
                            <div key={file.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-card rounded-lg border shadow-sm group hover:border-radar-gold/50 transition-colors">
                                <div className="flex items-start gap-3 overflow-hidden mb-3 sm:mb-0">
                                    <div className="p-2 bg-muted rounded-md shrink-0">
                                        <FileText className="h-5 w-5 text-radar-gold" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate text-foreground" title={file.file_name}>
                                            {file.file_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                            <span className="font-medium">{formatBytes(file.file_size)}</span>
                                            <span>•</span>
                                            <span>Por {file.uploaded_by}</span>
                                            <span>•</span>
                                            <span>{new Date(file.uploaded_at).toLocaleString('pt-BR')}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="sm" className="h-8 gap-1" title="Baixar">
                                            <Download className="h-3.5 w-3.5" /> Baixar
                                        </Button>
                                    </a>
                                    {canManageFiles && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleDelete(file.id, file.file_url)} title="Excluir">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
