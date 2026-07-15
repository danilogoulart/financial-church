-- Financial Church — schema Postgres (Supabase)
-- Rode no SQL Editor do Supabase (uma vez). É idempotente.

create extension if not exists "pgcrypto";

-- ---------- Tabelas ----------

create table if not exists public.members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text default '',
  family     text default '',
  ministry   text default '',
  tither     boolean default false,
  active     boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Bloqueia nomes duplicados (case-insensitive)
create unique index if not exists members_name_unique
  on public.members (lower(name));

create table if not exists public.categories (
  id   uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('income','expense')),
  name text not null
);

create unique index if not exists categories_kind_name_unique
  on public.categories (kind, lower(name));

create table if not exists public.transactions (
  id             uuid primary key default gen_random_uuid(),
  date           date not null default current_date,
  competency     text,
  member_id      uuid references public.members(id) on delete set null,
  type           text not null check (type in ('Receita','Despesa')),
  category       text,
  cult           text,
  payment_method text,
  amount         numeric(12,2) not null check (amount > 0),
  observation    text,
  receipt_path   text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Receitas de iniciativas/eventos que NÃO entram no caixa (ex.: cantina de
-- um congresso), atribuídas a um ministério.
alter table public.transactions
  add column if not exists off_cash boolean not null default false;
alter table public.transactions
  add column if not exists ministry text;

create table if not exists public.payables (
  id           uuid primary key default gen_random_uuid(),
  description  text not null,
  category     text,
  amount       numeric(12,2) not null check (amount > 0),
  due_date     date not null,
  payment_date date,
  status       text not null default 'Em aberto',
  receipt_path text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Despesas recorrentes (fixas e parceladas) — fonte para gerar as contas do mês.
create table if not exists public.recurring_expenses (
  id                 uuid primary key default gen_random_uuid(),
  description        text not null,
  category           text,
  amount             numeric(12,2) not null check (amount > 0),
  due_day            int not null default 5 check (due_day between 1 and 28),
  kind               text not null check (kind in ('fixa','parcelada')),
  installments_total int check (installments_total is null or installments_total > 0),
  start_competency   text not null,           -- 'YYYY-MM'
  active             boolean default true,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- Liga a conta gerada à recorrente + mês, para não duplicar na geração.
alter table public.payables
  add column if not exists recurring_id uuid references public.recurring_expenses(id) on delete set null;
alter table public.payables
  add column if not exists competency text;

create index if not exists payables_recurring_competency
  on public.payables (recurring_id, competency);

-- ---------- Categorias padrão ----------

insert into public.categories (kind, name) values
  ('income','Dízimos'), ('income','Ofertas'), ('income','Cantina'), ('income','Eventos'),
  ('expense','Conta de água'), ('expense','Conta de luz'), ('expense','Conta de internet'),
  ('expense','Passagem de pregador'), ('expense','Limpeza'), ('expense','Descartáveis'),
  ('expense','Parcela terreno')
on conflict do nothing;

-- ---------- Perfis e papéis ----------
-- Papéis: admin (tudo + gerencia usuários/categorias), tesoureiro (lança
-- e edita dados), consulta (somente leitura).

create table if not exists public.profiles (
  id    uuid primary key references auth.users(id) on delete cascade,
  email text,
  role  text not null default 'consulta' check (role in ('admin', 'tesoureiro', 'consulta'))
);

-- Cria o profile automaticamente quando surge um usuário (default consulta).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Usuários que já existem viram admin (fundadores). Novos entram como consulta.
insert into public.profiles (id, email, role)
  select id, email, 'admin' from auth.users
  on conflict (id) do nothing;

create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.can_write()
returns boolean language sql stable as $$
  select public.current_user_role() in ('admin', 'tesoureiro');
$$;

-- ---------- Row Level Security ----------
-- Todos autenticados leem; só admin/tesoureiro escrevem.

alter table public.members            enable row level security;
alter table public.categories         enable row level security;
alter table public.transactions       enable row level security;
alter table public.payables           enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.profiles           enable row level security;

-- Uma tabela por vez: policy de leitura (todos) + policy de escrita (can_write).
drop policy if exists members_all on public.members;
drop policy if exists members_select on public.members;
drop policy if exists members_write on public.members;
create policy members_select on public.members for select to authenticated using (true);
create policy members_write on public.members for all to authenticated
  using (public.can_write()) with check (public.can_write());

drop policy if exists categories_read on public.categories;
drop policy if exists categories_select on public.categories;
drop policy if exists categories_write on public.categories;
create policy categories_select on public.categories for select to authenticated using (true);
create policy categories_write on public.categories for all to authenticated
  using (public.can_write()) with check (public.can_write());

drop policy if exists transactions_all on public.transactions;
drop policy if exists transactions_select on public.transactions;
drop policy if exists transactions_write on public.transactions;
create policy transactions_select on public.transactions for select to authenticated using (true);
create policy transactions_write on public.transactions for all to authenticated
  using (public.can_write()) with check (public.can_write());

drop policy if exists payables_all on public.payables;
drop policy if exists payables_select on public.payables;
drop policy if exists payables_write on public.payables;
create policy payables_select on public.payables for select to authenticated using (true);
create policy payables_write on public.payables for all to authenticated
  using (public.can_write()) with check (public.can_write());

drop policy if exists recurring_all on public.recurring_expenses;
drop policy if exists recurring_select on public.recurring_expenses;
drop policy if exists recurring_write on public.recurring_expenses;
create policy recurring_select on public.recurring_expenses for select to authenticated using (true);
create policy recurring_write on public.recurring_expenses for all to authenticated
  using (public.can_write()) with check (public.can_write());

-- Perfis: todos leem (para a tela de Usuários); só admin altera papéis.
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (true);
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

-- ---------- Storage (comprovantes) ----------

insert into storage.buckets (id, name, public)
  values ('receipts', 'receipts', false)
  on conflict (id) do nothing;

drop policy if exists receipts_read on storage.objects;
create policy receipts_read on storage.objects
  for select to authenticated using (bucket_id = 'receipts');

drop policy if exists receipts_insert on storage.objects;
create policy receipts_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'receipts');

-- ---------- Cargos, Ministérios e Cultos (listas editáveis) ----------
-- Cargo: classificação do membro (Obreiro/Membro), 1 por pessoa; is_worker
--   define quem entra no relatório de obreiros não dizimistas.
-- Ministério: grupo/ministério real (Jovens, Louvor); um membro pode ter vários.

create table if not exists public.cargos (
  id        uuid primary key default gen_random_uuid(),
  name      text not null unique,
  is_worker boolean not null default false
);

create table if not exists public.ministries (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists public.cults (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- is_worker agora vive em cargos; remove da tabela ministries se existir.
alter table public.ministries drop column if exists is_worker;

insert into public.cargos (name, is_worker) values
  ('Obreiro de altar', true), ('Obreiro', true), ('Membro', false)
  on conflict (name) do nothing;

insert into public.cults (name) values
  ('Domingo'), ('Quinta'), ('Terça'), ('Consagração')
  on conflict (name) do nothing;

-- Membro passa a ter cargo (1) e ministries (vários).
alter table public.members add column if not exists cargo text;
alter table public.members add column if not exists ministries text[] default '{}';
-- Migra o antigo "ministry" (que guardava o cargo) para a coluna cargo.
update public.members set cargo = ministry where cargo is null and ministry is not null;

alter table public.cargos     enable row level security;
alter table public.ministries enable row level security;
alter table public.cults      enable row level security;

drop policy if exists cargos_select on public.cargos;
drop policy if exists cargos_write on public.cargos;
create policy cargos_select on public.cargos for select to authenticated using (true);
create policy cargos_write on public.cargos for all to authenticated
  using (public.can_write()) with check (public.can_write());

drop policy if exists ministries_select on public.ministries;
drop policy if exists ministries_write on public.ministries;
create policy ministries_select on public.ministries for select to authenticated using (true);
create policy ministries_write on public.ministries for all to authenticated
  using (public.can_write()) with check (public.can_write());

drop policy if exists cults_select on public.cults;
drop policy if exists cults_write on public.cults;
create policy cults_select on public.cults for select to authenticated using (true);
create policy cults_write on public.cults for all to authenticated
  using (public.can_write()) with check (public.can_write());
