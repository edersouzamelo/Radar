-- SCRIPT DE INICIALIZAÇÃO DO BANCO RADAR (v3.0.0)

-- 1. Tabela de Equipe (Membros da SALC, Pregoeiros e Requisitantes)
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    whatsapp TEXT,
    role TEXT,
    type TEXT NOT NULL, -- 'pregoeiro', 'supervisor', 'requisitante'
    organization TEXT, -- OM ou Órgão
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Pregões (Tenders)
CREATE TABLE tenders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uasg TEXT,
    number TEXT NOT NULL,
    nup TEXT,
    description TEXT,
    department TEXT,
    opening_date TIMESTAMPTZ,
    estimated_value NUMERIC,
    status TEXT NOT NULL,
    current_stage TEXT NOT NULL,
    has_issues BOOLEAN DEFAULT FALSE,
    is_gcalc BOOLEAN DEFAULT FALSE,
    commitment TEXT,
    requester_sector TEXT,
    coordinator TEXT,
    coord TEXT,
    section TEXT,
    responsible_internal TEXT,
    responsible_external TEXT,
    bi_publication TEXT,
    optimization_notes TEXT,
    next_deadline TEXT,
    next_activity TEXT,
    intercurrences TEXT,
    last_updated_by TEXT,
    verification_status TEXT DEFAULT 'Pendente',
    quick_notes TEXT,
    assigned_pregoeiro_id UUID REFERENCES team_members(id),
    pregoeiro_fase_interna_id UUID REFERENCES team_members(id),
    pregoeiro_fase_externa_id UUID REFERENCES team_members(id),
    
    -- Campos complexos como JSONB para flexibilidade
    dates JSONB DEFAULT '{}'::jsonb,
    updates JSONB DEFAULT '[]'::jsonb,
    observations JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Status de Conferência (para garantir sincronia entre sessões)
CREATE TABLE conference_statuses (
    tender_id UUID PRIMARY KEY REFERENCES tenders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Verificação de Datas (Checkbox de conferência)
CREATE TABLE date_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
    date_key TEXT NOT NULL,
    is_checked BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tender_id, date_key)
);

-- 5. Configuração de Segurança de Linha (RLS) - Simples para início
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_checks ENABLE ROW LEVEL SECURITY;

-- Política: Permitir leitura e escrita para usuários autenticados (Ajustável futuramente por órgão)
CREATE POLICY "Acesso Total para Autenticados" ON team_members FOR ALL USING (true);
CREATE POLICY "Acesso Total para Autenticados" ON tenders FOR ALL USING (true);
CREATE POLICY "Acesso Total para Autenticados" ON conference_statuses FOR ALL USING (true);
CREATE POLICY "Acesso Total para Autenticados" ON date_checks FOR ALL USING (true);
