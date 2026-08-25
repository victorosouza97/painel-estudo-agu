# Painel de Estudo — AGU

Site pessoal para controlar o estudo do material "Carreiras AGU Pré-edital" (Ponto a Ponto),
organizado por Disciplina → Assunto, com 4 seções de progresso granular por assunto:
Leitura Base, Legislação, Resumo do Conteúdo e Questões.

## Estrutura

```
study-tracker/
  backend/    API Express + Prisma (Postgres)
  frontend/   SPA React + Vite
  seed/       scripts Python que extraem os PDFs semanais e geram seed/seed.json
```

## Configuração local

### 1. Banco de dados (Postgres)

Crie um banco Postgres gratuito (ex. https://neon.tech ou https://supabase.com) e copie a
connection string.

### 2. Backend

```bash
cd backend
cp .env.example .env
# edite .env: DATABASE_URL, SESSION_SECRET, APP_USER, APP_PASSWORD_HASH
npm install
npx prisma migrate dev --name init
npm run seed        # importa seed/seed.json para o banco
npm run dev          # http://localhost:4000
```

Para gerar o hash da senha de login:

```bash
node -e "console.log(require('bcryptjs').hashSync('SUA_SENHA', 10))"
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173 (proxy para a API em :4000)
```

Abra http://localhost:5173 e faça login com o usuário/senha configurados no `.env` do backend.

## Regerando o seed a partir dos PDFs

Se os PDFs semanais mudarem, rode novamente:

```bash
cd seed
python build_seed.py   # regera seed.json e copia os PDFs para backend/public/pdfs
cd ../backend
npm run seed            # reimporta (não apaga progresso já marcado)
```

## Deploy (produção)

1. Suba o `DATABASE_URL` de produção (mesmo provedor Postgres, ou outro).
2. `cd backend && npm run build` gera `dist/`.
3. `cd frontend && npm run build` gera `frontend/dist/`, servido como estático pelo próprio
   backend (`server.ts` já aponta para `../../frontend/dist`).
4. No host (Render/Railway/Fly.io), configure o comando de start como `node backend/dist/server.js`
   e as variáveis de ambiente do `.env.example`.
5. Rode `npx prisma migrate deploy` e `npm run seed` uma vez após o primeiro deploy.
