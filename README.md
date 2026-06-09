# Monitor Fiscal de Trocas

Sistema para cruzamento do Relatório Gerencial com o Relatório de Trocas Emitidas, identificando irregularidades fiscais no procedimento de troca nas lojas.

---

## Pré-requisitos

- Node.js 18+
- Conta na [Anthropic](https://console.anthropic.com) com API key
- Banco de dados [Neon](https://neon.tech) (PostgreSQL serverless)

---

## Estrutura do projeto

```
fiscal-trocas/
├── server.js          # Backend Express — API + Anthropic + Neon
├── src/
│   ├── App.jsx        # Layout principal e roteamento de abas
│   ├── hooks/
│   │   └── useAnalise.js   # Estado central e motor de análise
│   ├── lib/
│   │   ├── engine.js  # Lógica de cruzamento (sem dependências externas)
│   │   └── api.js     # Cliente HTTP para o backend
│   ├── pages/
│   │   ├── Upload.jsx      # Aba de carregamento de arquivos
│   │   ├── Dashboard.jsx   # Visão executiva com gráficos
│   │   ├── Alertas.jsx     # Tabela de alertas com filtros e IA
│   │   ├── LojaDetail.jsx  # Painel por loja + geração de PDF
│   │   └── Historico.jsx   # Log de análises do comprador
│   └── components/
│       └── UI.jsx     # Componentes reutilizáveis
└── .env.example       # Variáveis de ambiente necessárias
```

---

## Setup

### 1. Instale as dependências

```bash
npm install
npm install express cors @anthropic-ai/sdk dotenv
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com seus valores:

```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://user:senha@host/dbname?sslmode=require
PORT=3001
```

### 3. Rode o backend

```bash
node server.js
```

Na primeira execução, as tabelas são criadas automaticamente no Neon.

### 4. Rode o frontend (em outro terminal)

```bash
npm run dev
```

Acesse: `http://localhost:5173`

---

## Deploy no GitHub Pages / Vercel / Netlify

### Frontend (Vite)

```bash
npm run build
```

A pasta `dist/` contém o frontend pronto para deploy.

> **Atenção:** O frontend depende do backend (`/api`). Em produção, hospede o `server.js` em um serviço como Railway, Render, ou Fly.io, e ajuste o proxy no `vite.config.js` com a URL de produção do backend.

### Backend (server.js)

Deploy recomendado: [Railway](https://railway.app) ou [Render](https://render.com).

Defina as variáveis de ambiente `ANTHROPIC_API_KEY` e `DATABASE_URL` no painel do serviço.

---

## Como usar

1. **Aba Arquivos** — carregue os dois CSVs e configure a tolerância de divergência
2. **Analisar agora** — roda o cruzamento e persiste os resultados no Neon
3. **Aba Dashboard** — visão executiva com métricas, gráficos e score por loja
4. **Aba Alertas** — filtre, atualize o status de apuração e acione a IA por alerta
5. **Aba Por loja** — painel individual + botão para gerar relatório PDF com análise da IA
6. **Aba Histórico** — registro de todas as análises realizadas (monitoramento do comprador)

---

## Tipos de alerta detectados

| Tipo | Descrição |
|------|-----------|
| Sem NF fiscal | Gerencial registra troca mas não há NF de entrada no dia |
| Divergência de valor | Valor gerencial difere do fiscal acima do threshold configurado |
| NF com erro | Existem notas fiscais com situação "Com Erro" |
| NF cancelada | Existem notas fiscais canceladas no período |

---

## Score de conformidade

Calculado por loja com base nas ocorrências:
- Dia sem NF: −6 pontos
- Divergência de valor: −4 pontos
- NF com erro/cancelada: −2 pontos

Score 70–100 = OK · 40–69 = Atenção · 0–39 = Crítico
