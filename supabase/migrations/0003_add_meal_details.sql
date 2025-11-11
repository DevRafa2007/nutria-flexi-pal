-- Criar tabela de refeições com detalhes de alimentos
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  description text,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'snack', 'dinner')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Criar tabela de alimentos nas refeições
create table if not exists public.meal_foods (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals on delete cascade,
  food_name text not null,
  quantity numeric not null,
  unit text not null check (unit in ('g', 'colher', 'xícara', 'unidade', 'filé', 'peito')),
  calories numeric not null,
  protein numeric not null, -- grams
  carbs numeric not null, -- grams
  fat numeric not null, -- grams
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Criar tabela de perfil de usuário para nutrição
create table if not exists public.user_nutrition (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade unique,
  weight numeric not null, -- kg
  height numeric not null, -- cm
  age integer not null,
  gender text not null check (gender in ('male', 'female')),
  goal text not null check (goal in ('lose_weight', 'gain_muscle', 'maintain')),
  activity_level text not null check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  allergies text[], -- array of strings
  preferences text[], -- array of strings
  tdee integer,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar RLS
alter table public.meals enable row level security;
alter table public.meal_foods enable row level security;
alter table public.user_nutrition enable row level security;

-- RLS Policies para meals
drop policy if exists "Users can view their own meals" on public.meals;
drop policy if exists "Users can insert their own meals" on public.meals;
drop policy if exists "Users can update their own meals" on public.meals;
drop policy if exists "Users can delete their own meals" on public.meals;

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

-- RLS Policies para meal_foods
drop policy if exists "Users can manage meal foods" on public.meal_foods;

create policy "Users can manage meal foods"
  on public.meal_foods for all
  using (
    meal_id in (
      select id from public.meals where user_id = auth.uid()
    )
  );

-- RLS Policies para user_nutrition
drop policy if exists "Users can view their own nutrition profile" on public.user_nutrition;
drop policy if exists "Users can insert their own nutrition profile" on public.user_nutrition;
drop policy if exists "Users can update their own nutrition profile" on public.user_nutrition;

create policy "Users can view their own nutrition profile"
  on public.user_nutrition for select
  using (auth.uid() = user_id);

create policy "Users can insert their own nutrition profile"
  on public.user_nutrition for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own nutrition profile"
  on public.user_nutrition for update
  using (auth.uid() = user_id);

-- Índices para performance
create index if not exists meals_user_id_idx on public.meals(user_id);
create index if not exists meals_created_at_idx on public.meals(created_at desc);
create index if not exists meal_foods_meal_id_idx on public.meal_foods(meal_id);
create index if not exists user_nutrition_user_id_idx on public.user_nutrition(user_id);
