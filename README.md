<div align="center">

<img src="docs/assets/app-icon.png" width="128" height="128" alt="Vida em Dia Logo" style="border-radius: 28px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);" />

# Vida em Dia

**Seu espaço pessoal de treino, cardio, medidas e bem-estar.**

[![Deploy com Vercel](https://img.shields.io/badge/Vercel-Produção-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vida-em-dia-sable.vercel.app)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Dexie](https://img.shields.io/badge/Dexie.js-IndexedDB-2496ED?style=for-the-badge&logo=dexie&logoColor=white)](https://dexie.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Testes Vitest](https://img.shields.io/badge/Testes-304%20Aprovados-brightgreen?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline--First-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

<br />

🚀 **[Acessar o Aplicativo Online (Vercel)](https://vida-em-dia-sable.vercel.app)**

</div>

---

## Plano de evolução

Consulte o [plano atualizado de etapas e pendências](docs/PLANO.md). Entregas anteriores estão no [histórico](docs/HISTORICO.md).

## 📱 Visão Geral

O **Vida em Dia** é um Progressive Web App (PWA) de alta performance criado para fornecer controle total sobre treinos, corridas/cardio, evolução de medidas e consistência diária.

Projetado com a filosofia **Offline-First**, o app salva tudo localmente no aparelho de forma instantânea através do **IndexedDB (Dexie.js)**. Ao se conectar à internet e entrar na sua conta, uma sincronização resiliente em segundo plano mantém seus dados replicados e seguros no **Supabase**.

---

## 📸 Demonstração da Interface

<div align="center">
  <table>
    <tr>
      <td align="center" width="25%">
        <strong>🏠 Hoje</strong><br/><br/>
        <img src="docs/assets/preview-hoje.png" width="220" alt="Tela Hoje" />
      </td>
      <td align="center" width="25%">
        <strong>🏋️ Treino</strong><br/><br/>
        <img src="docs/assets/preview-treino.png" width="220" alt="Tela de Treino" />
      </td>
      <td align="center" width="25%">
        <strong>📏 Medidas</strong><br/><br/>
        <img src="docs/assets/preview-medidas.png" width="220" alt="Tela de Medidas" />
      </td>
      <td align="center" width="25%">
        <strong>⚙️ Configurações</strong><br/><br/>
        <img src="docs/assets/preview-configuracoes.png" width="220" alt="Tela de Configurações" />
      </td>
    </tr>
  </table>
</div>

---

## ✨ Funcionalidades Principais

### 🏋️ Musculação e Fichas
- **Catálogo de 64+ Exercícios**: Pré-carregado com fotos de máquinas, instruções detalhadas, grupos musculares primários e secundários.
- **Divisões e Fichas Personalizadas**: Crie, edite, duplique ou reordene fichas (ABC, ABCD, etc.).
- **Séries Customizadas**: Suporte a séries normais, aquecimento, até a falha e *drop set* com múltiplas reduções de carga.
- **Descanso com Timer e Bipes**: Contagem de descanso entre séries com bipes suaves nos últimos 10 segundos e persistência precisa mesmo com a tela bloqueada.
- **Screen Wake Lock**: Opção para manter a tela do celular acesa durante todo o treino.
- **Métricas de Performance**: Cálculo de 1RM estimado (fórmula de Epley), volume total de carga e histórico com recordes automáticos.

### 🏃 Cardio e Atividade Diária
- **8 Modalidades**: Esteira, Caminhada, Corrida, Ciclismo, Elíptico, Escada, Remo e outros.
- **Métricas em Tempo Real**: Registro de distância (km), velocidade média, ritmo (*pace* em min/km), inclinação, passos e calorias calculadas pelo seu peso real (METs científicos).
- **Metas Semanais e Feriados**: Acompanhamento de metas de passos e calorias, com feriados nacionais já calibrados no calendário.

### 📏 Medidas Corporais e Evolução
- **Registro Anatômico Completo**: Peso, bíceps, coxas, cintura, abdômen, quadril, panturrilhas e busto.
- **Gráficos Interativos**: Evolução temporal de cada medida individualmente ou em conjunto.
- **Comparador entre Datas**: Compare a evolução entre duas medições com cálculo automático de variação.
- **Lembrete Inteligente**: Alerta na tela principal caso a semana fique sem medição registrada.

### 📲 Cards para Stories
- Gere imagens verticais de alta resolução (**1080 × 1920**) dos seus treinos finalizados.
- Estilos exclusivos: *Editorial*, *Foto Inteira*, *Minimalista* e *Adesivo Transparente*.
- Pronto para compartilhar direto no Instagram Stories, WhatsApp ou salvar na galeria.

### ☁️ Nuvem, Segurança e Sincronização
- **Offline-First Real**: O aplicativo funciona 100% sem sinal de internet. Nenhuma tela trava esperando resposta de rede.
- **Sincronização com Supabase**: Envio em lote com resolução atômica de conflitos (*Last-Write-Wins*) e isolamento com *Row Level Security* (RLS).
- **Recuperação por Código OTP**: Envio de código numérico de 6 dígitos via SMTP dedicado (`diaemvida.app@gmail.com`) com verificação direta no app.
- **Backup e Restauração**: Exporte e importe todos os seus dados em formato JSON criptografado ou em planilhas CSV.

### 🌓 Design & Ergonomia Mobile
- **Temas**: Tema Escuro, Tema Claro ou Automático (acompanha o sistema do aparelho).
- **Transições Suaves a 60fps**: Acordeão suave sem solavancos ou saltos bruscos de rolagem.
- **Seletores Touch-First**: Componentes nativos de rolagem tátil para cargas, repetições e medidas.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Ferramenta / Biblioteca | Descrição |
| :--- | :--- | :--- |
| **Interface** | [React 19](https://react.dev/) | Renderização e gerenciamento de estado moderno |
| **Linguagem** | [TypeScript](https://www.typescriptlang.org/) | Tipagem estrita de ponta a ponta |
| **Estilização** | [Tailwind CSS](https://tailwindcss.com/) & CSS Modules | Design responsivo otimizado para mobile |
| **Banco Local** | [Dexie.js](https://dexie.org/) | Abstração reativa sobre o IndexedDB |
| **Backend & Auth** | [Supabase](https://supabase.com/) | Autenticação, banco PostgreSQL e Edge APIs |
| **Gráficos** | [Recharts](https://recharts.org/) | Visualização interativa de evolução de cargas e medidas |
| **Ícones** | [Lucide React](https://lucide.dev/) | Ícones leves e consistentes |
| **Build & PWA** | [Vite](https://vite.dev/) & [Vite PWA](https://vite-pwa-org.netlify.app/) | Empacotamento rápido e service worker para cache offline |
| **Testes** | [Vitest](https://vitest.dev/) & [Playwright](https://playwright.dev/) | Suíte completa com **304 testes automatizados** |

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js** 20 LTS ou 24 LTS
- **npm** (ou yarn/pnpm)

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/breno-camargo/vida-em-dia.git
cd vida-em-dia
```

2. Instale as dependências:
```bash
npm install
```

3. (Opcional) Configure as variáveis de ambiente em um arquivo `.env.local`:
```env
VITE_SUPABASE_URL=https://ofzixbpliejnaiyuspti.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica_aqui
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Abra no navegador em `http://localhost:5173`.

---

## 🧪 Qualidade de Código e Testes

O projeto segue padrões rígidos de qualidade de software, com 100% da suíte de testes aprovada:

```bash
# Validar tipos estritos do TypeScript
npm run typecheck

# Executar o linter (ESLint)
npm run lint

# Rodar a suíte completa de testes automatizados (304 testes)
npm test

# Gerar o build otimizado de produção
npm run build
```

---

## 📲 Como Instalar no Celular (PWA)

### No iPhone (iOS / Safari)
1. Abra o link [vida-em-dia-sable.vercel.app](https://vida-em-dia-sable.vercel.app) no **Safari**.
2. Toque no botão de **Compartilhar** (ícone do quadrado com a seta para cima).
3. Role para baixo e selecione **Adicionar à Tela de Início**.
4. O ícone oficial do **Vida em Dia** será instalado no seu iPhone, rodando em tela cheia sem barras de navegador.

### No Android (Chrome)
1. Acesse o site pelo **Google Chrome**.
2. Toque no menu de três pontos no canto superior direito.
3. Selecione **Adicionar à tela inicial** ou **Instalar aplicativo**.

---

## 📂 Estrutura do Projeto

```text
vida-em-dia/
├── .github/              # Workflows de CI/CD para GitHub Actions
├── docs/                 # Documentação e imagens do repositório
│   ├── assets/           # Screenshots e ícones de exibição
│   └── HISTORICO.md      # Histórico completo de requisitos e etapas
├── public/               # Ícones universais e manifest do PWA
├── src/
│   ├── componentes/      # Componentes reutilizáveis (Timer, Cards, Modal, Rolagem)
│   ├── dados/            # Schemas do Dexie, repositórios e modelos locais
│   ├── estilos/          # Paletas claro/escuro, superfícies e transições
│   ├── hooks/            # Hooks customizados (useTema, useTransicaoSuave)
│   ├── sincronizacao/    # Cliente Supabase, fila de envio, reconciliação LWW
│   ├── telas/            # Telas principais (Hoje, Treino, Medidas, Evolução, Configurações)
│   └── utilitarios/      # Cálculos de MET, 1RM, data local e criptografia
├── supabase/             # Migrações SQL, RLS, Edge Functions e templates SMTP
├── vercel.json           # Configuração de deploy contínuo na Vercel
└── vite.config.ts        # Configurações do Vite e plugin PWA
```

---

## 📜 Histórico & Documentação Completa

Para detalhes de arquitetura profunda, auditorias de segurança e histórico detalhado das etapas implementadas, consulte o [Histórico do Projeto](docs/HISTORICO.md).

---

<div align="center">
  <sub>Desenvolvido com foco em privacidade, robustez e consistência. 🌿</sub>
</div>
