# Financial Church — Web App (Supabase)

App React (Vite) que usa o Supabase como banco (Postgres), autenticação
(e-mail/senha) e storage (comprovantes). Substitui a versão em Google
Apps Script (que fica em `../src`).

## 1. Criar o projeto no Supabase

1. Crie uma conta e um projeto em https://supabase.com (plano free).
2. No **SQL Editor**, cole e rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
   Isso cria as tabelas, categorias padrão, políticas de segurança (RLS)
   e o bucket `receipts` para os comprovantes.
3. Em **Authentication → Providers → Email**, deixe habilitado. Recomendo
   **desativar "Allow new users to sign up"** (Authentication → Settings),
   já que você mesmo cria os usuários.
4. Em **Authentication → Users → Add user**, crie os logins (você,
   tesoureiro, pastor...) com e-mail e senha.

## 2. Configurar o app

```bash
cd web
cp .env.example .env
```

Preencha o `.env` com os dados de **Project Settings → API**:

- `VITE_SUPABASE_URL` — Project URL
- `VITE_SUPABASE_ANON_KEY` — chave `anon` `public` (pode ficar no front)

> Nunca use a chave `service_role` aqui — ela ignora o RLS.

## 3. Rodar localmente

```bash
npm install
npm run dev
```

Abra o endereço que o Vite mostrar (ex.: http://localhost:5173).

## 4. Publicar (grátis)

Qualquer host de site estático serve. Ex.: **Vercel** ou **Cloudflare Pages**:

- Root/Project: a pasta `web`
- Build command: `npm run build`
- Output: `dist`
- Variáveis de ambiente: as mesmas duas do `.env`

Cada `git push` publica automaticamente.

## Marca / identidade visual

Centralizado para facilitar customização futura:

- **Nome e logo**: `src/brand.js` (`APP_NAME`, `LOGO_URL`).
- **Cores/tema**: bloco `:root` em `src/styles.css` (tema preto/prata).

**Logo**: salve o arquivo em **`web/public/logo.png`** — de preferência
**PNG com fundo transparente**, para a logo prateada ficar bem sobre o
fundo preto. Se o arquivo não existir, o app mostra só o nome (a `<img>`
se esconde sozinha). Aparece no topo e na tela de login.

## Estrutura

```
web/
  supabase/schema.sql   estrutura do banco + RLS + storage
  src/
    supabaseClient.js   cliente Supabase
    api.js              acesso a dados + upload de comprovantes
    App.jsx             shell + navegação + sessão
    Login.jsx           login e-mail/senha
    pages/              Membros, Movimentações, Contas a Pagar, Dashboard
    components/         ReceiptLink (URL assinada do comprovante)
```
