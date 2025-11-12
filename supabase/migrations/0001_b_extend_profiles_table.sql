-- Estender a tabela profiles com colunas nutricionais
alter table public.profiles 
  add column if not exists age integer,
  add column if not exists weight numeric,
  add column if not exists height numeric,
  add column if not exists goal text,
  add column if not exists activity_level text,
  add column if not exists gender text,
  add column if not exists tdee numeric,
  add column if not exists target_calories numeric,
  add column if not exists target_protein numeric,
  add column if not exists target_carbs numeric,
  add column if not exists target_fat numeric,
  add column if not exists dietary_restrictions text[] default array[]::text[],
  add column if not exists preferred_foods text[] default array[]::text[],
  add column if not exists disliked_foods text[] default array[]::text[],
  add column if not exists created_at timestamp with time zone default timezone('utc'::text, now()),
  add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- Criar função para atualizar updated_at automaticamente
create or replace function public.update_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Criar trigger para atualizar updated_at
drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_profiles_updated_at();
