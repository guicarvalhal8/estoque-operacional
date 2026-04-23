# Estoque Operacional

Aplicacao full stack para controle de estoque de operacao de alimentos, com foco em:

- dashboard operacional
- entrada, saida, perda e ajuste
- historico confiavel por usuario
- contagem mensal com analise entre periodos
- reposicao e relatorios
- instalacao como app (PWA)

## Stack

- `frontend`: Next.js 14 + TypeScript
- `backend`: Node.js + Express + Prisma + JWT + Zod
- `database`: PostgreSQL
- `deploy sugerido`: Supabase + Render

## Ambientes

O projeto agora esta preparado para:

- desenvolvimento com PostgreSQL remoto ou local
- deploy gratuito com `Supabase` no banco
- frontend estatico no `Render`
- backend Node no `Render`
- instalacao como aplicativo no navegador

## Como rodar localmente

1. Instale as dependencias:

```bash
npm install
```

2. Gere os arquivos de ambiente:

```bash
npm run setup:env
```

3. Preencha `backend/.env` com um PostgreSQL valido.

Exemplo:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@db.seu-projeto.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:SUA_SENHA@db.seu-projeto.supabase.co:5432/postgres"
PORT=4000
JWT_SECRET="uma-chave-grande-e-segura"
NODE_ENV="development"
FRONTEND_URLS="http://localhost:3000"
COOKIE_SECURE="false"
COOKIE_SAME_SITE="lax"
```

4. Suba estrutura e dados iniciais:

```bash
npm run db:push
npm run seed
```

5. Rode backend e frontend em terminais separados:

```bash
npm run dev:backend
npm run dev:frontend
```

## Contas iniciais

- `admin@estoque.local` / `Admin@123`
- `gerente@estoque.local` / `Gerente@123`
- `operadora1@estoque.local` / `Operadora@123`
- `operadora2@estoque.local` / `Operadora@123`

## Publicacao gratuita recomendada

### Banco

Crie um projeto no Supabase e copie:

- `DATABASE_URL`
- `DIRECT_URL`

### Backend no Render

Use o servico `estoque-operacional-api` do arquivo [render.yaml](C:\Users\guica\.gemini\antigravity\scratch\acompanhamento de estoque\render.yaml).

Variaveis importantes:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `FRONTEND_URLS`
- `NODE_ENV=production`
- `COOKIE_SECURE=true`
- `COOKIE_SAME_SITE=none`

### Frontend no Render

Use o servico `estoque-operacional-web` do mesmo [render.yaml](C:\Users\guica\.gemini\antigravity\scratch\acompanhamento de estoque\render.yaml).

Variavel importante:

- `NEXT_PUBLIC_API_URL=https://seu-backend.onrender.com`

### Ordem recomendada de deploy

1. Crie o banco no Supabase.
2. Publique o backend no Render.
3. Configure `FRONTEND_URLS` com a URL do frontend.
4. Publique o frontend no Render.
5. Teste login, movimentacoes e contagem.

## PWA

O frontend agora inclui:

- manifesto web
- icones do app
- service worker
- botao `Instalar app`

Isso permite instalar o sistema no celular e no computador direto pelo navegador, sem loja de aplicativos.

## Observacoes importantes

- o seed agora cria os dados iniciais sem sobrescrever o estoque ja movimentado em producao
- o backend aceita multiplas origens em `FRONTEND_URLS`
- os cookies estao prontos para frontend e backend em dominios separados

## Estrutura principal

- [backend/prisma/schema.prisma](C:\Users\guica\.gemini\antigravity\scratch\acompanhamento de estoque\backend\prisma\schema.prisma)
- [backend/prisma/seed.ts](C:\Users\guica\.gemini\antigravity\scratch\acompanhamento de estoque\backend\prisma\seed.ts)
- [backend/src](C:\Users\guica\.gemini\antigravity\scratch\acompanhamento de estoque\backend\src)
- [frontend/app](C:\Users\guica\.gemini\antigravity\scratch\acompanhamento de estoque\frontend\app)
- [frontend/components](C:\Users\guica\.gemini\antigravity\scratch\acompanhamento de estoque\frontend\components)
- [render.yaml](C:\Users\guica\.gemini\antigravity\scratch\acompanhamento de estoque\render.yaml)
