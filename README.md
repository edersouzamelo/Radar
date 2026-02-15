# RADAR - Monitoramento de Licitações 🛡️

O **RADAR** é uma plataforma moderna e intuitiva desenvolvida para o acompanhamento sistemático de pregões eletrônicos e licitações. O sistema foca na transparência operacional, controle de prazos críticos (previsto vs. realizado) e gestão de responsabilidades, servindo como uma ferramenta de C2 (Comando e Controle) para a Seção de Licitações (SALC).

![Radar Dashboard](public/radar-logo.png)

## ✨ Funcionalidades Principais

- **📊 Dashboard Estratégico**: Visualização rápida do status geral dos pregões (Ativos, Pendentes, Suspensos, Homologados).
- **📅 Controle de Prazos Refinado**: Monitoramento detalhado de cada fase (Protocolo, Fase Interna, CJU, Publicação, Sessão Pública e Homologação).
- **👤 Gestão de Responsáveis**: Atribuição clara de responsáveis pela Fase Interna e Pregoeiros (Fase Externa).
- **📝 Notas de Gestão**: Campos específicos para "O que pode ser otimizado?" e registro de Intercorrências.
- **🔄 Persistência de Estado**: Gerenciamento de estado global (React Context) que permite edições em tempo real durante a sessão.
- **🌑 Dark Mode Nativo**: Interface adaptável para diferentes ambientes de trabalho.
- **🛡️ Controle de Acesso por Papel**: Funcionalidades condicionais baseadas no perfil (Chefe SALC, Pregoeiro, Auxiliar, OD, etc.).

## 🚀 Tecnologias Utilizadas

- **Frontend**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Estilização**: [Tailwind CSS 4+](https://tailwindcss.com/)
- **Componentes**: [Radix UI](https://www.radix-ui.com/) & [Lucide React](https://lucide.dev/)
- **Estado**: React Context API
- **Linguagem**: TypeScript

## 🛠️ Como Executar o Projeto

1. **Clonar o Repositório**:
   ```bash
   git clone https://github.com/edersouzamelo/Radar.git
   cd Radar
   ```

2. **Instalar Dependências**:
   ```bash
   npm install
   ```

3. **Rodar o Servidor de Desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Acessar a Aplicação**:
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📈 Importação de Dados

O sistema está configurado para interpretar dados estruturados oriundos de planilhas de controle (Google Sheets), facilitando a transição de processos manuais para a plataforma digital.

## 📜 Licença

Este projeto está sob a licença GNU General Public License v3.0 (GPL-3.0). Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---
Desenvolvido com foco na eficiência da administração pública. 🇧🇷
