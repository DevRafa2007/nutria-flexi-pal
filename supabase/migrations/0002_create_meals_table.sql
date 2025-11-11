-- INSTRUÇÕES: Copie o SQL abaixo e execute no Supabase Dashboard > SQL Editor
-- Depois renomeie este arquivo para: 0002_create_meals_table.sql

-- Criar tabela de refeições
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  description text,
  calories integer,
  protein integer,
  carbs integer,
  fat integer,
  meal_type text check (meal_type in ('breakfast', 'lunch', 'snack', 'dinner')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar RLS na tabela
alter table public.meals enable row level security;

-- Remover policies antigas se existirem
drop policy if exists "Users can view their own meals" on public.meals;
drop policy if exists "Users can insert their own meals" on public.meals;
drop policy if exists "Users can update their own meals" on public.meals;
drop policy if exists "Users can delete their own meals" on public.meals;

-- Criar policies de segurança
create policy "Users can view their own meals"
  on public.meals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own meals"
  on public.meals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own meals"
  on public.meals for update
  using (auth.uid() = user_id);

create policy "Users can delete their own meals"
  on public.meals for delete
  using (auth.uid() = user_id);

-- Criar índices para performance
create index if not exists meals_user_id_idx on public.meals(user_id);
create index if not exists meals_created_at_idx on public.meals(created_at desc);
