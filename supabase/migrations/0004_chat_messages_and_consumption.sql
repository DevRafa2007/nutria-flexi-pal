-- Criar tabela de mensagens do chat
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Adicionar coluna consumed_at em meal_foods para rastrear consumo
alter table public.meal_foods add column if not exists consumed_at timestamp with time zone;

-- Criar tabela para rastreamento diário de macros
create table if not exists public.daily_consumption (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  meal_id uuid not null references public.meals on delete cascade,
  consumed_date date not null,
  macros_met numeric not null default 0, -- percentual de macros atingidas (0-100)
  streak_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, meal_id, consumed_date)
);

-- Criar tabela para rastreamento de streak
create table if not exists public.user_streak (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade unique,
  current_streak integer default 0,
  best_streak integer default 0,
  last_activity_date date,
  start_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar RLS
alter table public.chat_messages enable row level security;
alter table public.daily_consumption enable row level security;
alter table public.user_streak enable row level security;

-- RLS Policies para chat_messages
drop policy if exists "Users can view their own chat messages" on public.chat_messages;
drop policy if exists "Users can insert their own chat messages" on public.chat_messages;

create policy "Users can view their own chat messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert their own chat messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

-- RLS Policies para daily_consumption
drop policy if exists "Users can manage their daily consumption" on public.daily_consumption;

create policy "Users can manage their daily consumption"
  on public.daily_consumption for all
  using (auth.uid() = user_id);

-- RLS Policies para user_streak
drop policy if exists "Users can view their own streak" on public.user_streak;
drop policy if exists "Users can manage their own streak" on public.user_streak;

create policy "Users can view their own streak"
  on public.user_streak for select
  using (auth.uid() = user_id);

create policy "Users can manage their own streak"
  on public.user_streak for all
  using (auth.uid() = user_id);

-- Índices para performance
create index if not exists chat_messages_user_id_idx on public.chat_messages(user_id);
create index if not exists chat_messages_created_at_idx on public.chat_messages(created_at desc);
create index if not exists daily_consumption_user_id_idx on public.daily_consumption(user_id);
create index if not exists daily_consumption_date_idx on public.daily_consumption(consumed_date desc);
create index if not exists daily_consumption_meal_idx on public.daily_consumption(meal_id);
create index if not exists user_streak_user_id_idx on public.user_streak(user_id);
