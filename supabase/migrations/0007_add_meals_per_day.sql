-- Adicionar coluna meals_per_day à tabela profiles
-- Esta coluna permite que o usuário defina quantas refeições por dia deseja (3-6)
-- A IA usará esse valor para distribuir os macros de forma balanceada

alter table public.profiles 
  add column if not exists meals_per_day integer default 4 check (meals_per_day >= 3 and meals_per_day <= 6);

-- Comentário explicativo
comment on column public.profiles.meals_per_day is 'Número de refeições que o usuário deseja fazer por dia (3-6). A IA usa para distribuir macros.';
