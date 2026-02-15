export type TenderStatus = 'pending' | 'active' | 'completed' | 'suspended';

export type TenderStage =
    | 'Edital Publicado'
    | 'Acolhimento de Propostas'
    | 'Abertura de Propostas'
    | 'Disputa'
    | 'Julgamento'
    | 'Habilitação'
    | 'Adjudicação'
    | 'Homologação';

export interface TenderUpdate {
    id: string;
    date: string;
    description: string;
    author: string;
    type: 'info' | 'warning' | 'alert' | 'success';
}

export interface TenderObservation {
    id: string;
    date: string;
    author: string;
    content: string;
}

export interface TenderDates {
    // Protocolo Inicial do Setor Requisitante na SALC
    protocoloSetorRequisitante?: {
        defined?: string;  // Prazo definido
        executed?: string; // Prazo executado
    };
    // Fase Interna Preliminar da SALC até envio para CJU
    faseInternaSALC?: {
        defined?: string;
        executed?: string;
    };
    // Retorno da CJU
    retornoCJU?: {
        estimated?: string; // Prazo estimado
        occurred?: string;  // Prazo ocorrido
    };
    // Ajustes até Publicação pela SALC
    ajustesPublicacao?: {
        defined?: string;
        executed?: string;
    };
    // Início da Sessão Pública pela SALC
    inicioSessaoPublica?: {
        defined?: string;
        executed?: string;
    };
    // Homologação pela SALC
    homologacao?: {
        defined?: string;
        executed?: string;
    };
    // Vigência do Pregão Anterior
    vigenciaAnterior?: string;
    // Prazo do GCALC
    prazoGCALC?: string;
}

export type UserRole = 'Chefe da Seção de Licitações' | 'Pregoeiro' | 'Auxiliar' | 'Setor Requisitante';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    department?: string;
    avatar?: string;
}

export interface Subscriber {
    id: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    preferences: {
        email: boolean;
        whatsapp: boolean;
        sms: boolean;
    };
    createdAt: string;
}

export interface NotificationLog {
    id: string;
    subscriberId: string;
    subscriberName: string;
    tenderNumber: string;
    channel: 'email' | 'whatsapp' | 'sms';
    type: '30_days' | '5_days' | 'deadline';
    sentAt: string;
    status: 'sent' | 'failed';
}

export interface Tender {
    id: string;
    uasg: string;
    number: string; // e.g., "90/2024"
    description: string;
    department: string; // e.g., "Divisão de Logística"
    openingDate: string; // Data da sessão pública
    estimatedValue?: number;
    status: TenderStatus;
    currentStage: TenderStage;
    hasIssues: boolean;
    updates: TenderUpdate[];
    // Campos de controle e datas
    isGCALC?: boolean;
    dates?: TenderDates;
    observations?: TenderObservation[];

    // Novos campos de gestão e responsabilidade (Planilha)
    coord?: string;
    section?: string;
    responsibleInternal?: string;
    responsibleExternal?: string;
    biPublication?: string;
    optimizationNotes?: string;
    nextDeadline?: string;
    nextActivity?: string;
    intercurrences?: string;
}
