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
npx prisma migrate deploy
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

## Deploy em produção (servidor próprio — Hostinger KVM2)

Site vivo em **https://estudos.souzautolub.com.br**, rodando no VPS próprio do usuário
(72.61.77.51), como processo pm2 (`estudos-agu`, porta 3200) atrás de um reverse proxy nginx.
O banco de dados continua no Neon (mesmo de desenvolvimento). *(Historicamente este projeto
rodou no Render — o `render.yaml` foi removido do repositório após a migração de 2026-09-28.)*

### Deploy de uma atualização

```bash
# 1. build local
cd frontend && npm run build && cd ../backend && npm run build

# 2. empacotar (sem node_modules — o Prisma precisa gerar o binário certo no Linux)
cd ..
tar -czf /tmp/estudos-agu-deploy.tar.gz \
  backend/dist backend/package.json backend/package-lock.json backend/prisma backend/public \
  frontend/dist

# 3. enviar e extrair no servidor
scp -i ~/.ssh/prospecta_kvm2 /tmp/estudos-agu-deploy.tar.gz root@72.61.77.51:/tmp/
ssh -i ~/.ssh/prospecta_kvm2 root@72.61.77.51 "cd /var/www/estudos && tar -xzf /tmp/estudos-agu-deploy.tar.gz && rm /tmp/estudos-agu-deploy.tar.gz"

# 4. instalar dependências nativas e aplicar migrações no servidor (não localmente)
ssh -i ~/.ssh/prospecta_kvm2 root@72.61.77.51 "cd /var/www/estudos/backend && npm install --omit=dev && npx prisma generate && npx prisma migrate deploy"

# 5. reiniciar
ssh -i ~/.ssh/prospecta_kvm2 root@72.61.77.51 "pm2 restart estudos-agu"
```

O `.env` de produção já está em `/var/www/estudos/backend/.env` no servidor (não versionado
aqui) — só precisa ser recriado se o servidor for reconstruído do zero. Veja
`.env.example` para as variáveis necessárias.
