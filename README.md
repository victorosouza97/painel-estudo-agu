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

## Deploy em produção (Render)

O repositório já tem um `render.yaml` pronto (Blueprint do Render): builda o frontend, builda o
backend, e sobe um único serviço Node que serve a API e os arquivos estáticos do frontend.

1. **GitHub**: crie um repositório vazio (sem README) em https://github.com/new e rode:
   ```bash
   git remote add origin <URL do repositório>
   git push -u origin master
   ```
2. **Render**: em https://dashboard.render.com → New → Blueprint → conecte o repositório do
   GitHub. O Render lê o `render.yaml` automaticamente e cria o serviço.
3. Preencha as variáveis de ambiente pedidas no formulário do Render:
   - `DATABASE_URL`: a mesma connection string do Neon já usada em desenvolvimento (o banco já
     está com o schema migrado e os 243 assuntos importados — não precisa rodar seed de novo).
   - `APP_USER` / `APP_PASSWORD_HASH`: gere um hash novo com uma senha forte:
     ```bash
     node -e "console.log(require('bcryptjs').hashSync('SUA_SENHA_FORTE', 10))"
     ```
   - `FRONTEND_ORIGIN`: a URL que o Render vai gerar (ex. `https://painel-estudo-agu.onrender.com`).
   - `SESSION_SECRET`: o Render já gera um valor aleatório sozinho (`generateValue: true`).
4. Deploy. O `startCommand` já roda `prisma migrate deploy` antes de subir o servidor, então o
   schema fica sempre em dia a cada deploy.
5. Acesse a URL gerada pelo Render — funciona de qualquer lugar, inclusive celular.

### Atualizando depois do primeiro deploy

Qualquer alteração: `git add -A && git commit -m "..." && git push` — o Render reconstrói e
publica automaticamente a cada push na branch principal.
