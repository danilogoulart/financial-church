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

-- ---------- Categorias padrão ----------

insert into public.categories (kind, name) values
  ('income','Dízimos'), ('income','Ofertas'), ('income','Cantina'), ('income','Eventos'),
  ('expense','Conta de água'), ('expense','Conta de luz'), ('expense','Conta de internet'),
  ('expense','Passagem de pregador'), ('expense','Limpeza'), ('expense','Descartáveis'),
  ('expense','Parcela terreno')
on conflict do nothing;

-- ---------- Row Level Security ----------
-- App interno: qualquer usuário autenticado (criado por você) tem acesso total.

alter table public.members      enable row level security;
alter table public.categories   enable row level security;
alter table public.transactions enable row level security;
alter table public.payables     enable row level security;

drop policy if exists members_all on public.members;
create policy members_all on public.members
  for all to authenticated using (true) with check (true);

drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories
  for select to authenticated using (true);

drop policy if exists transactions_all on public.transactions;
create policy transactions_all on public.transactions
  for all to authenticated using (true) with check (true);

drop policy if exists payables_all on public.payables;
create policy payables_all on public.payables
  for all to authenticated using (true) with check (true);

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
