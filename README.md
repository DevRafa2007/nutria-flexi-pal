# 📖 Passo a Passo: Criar Tabela Meals

## 🎯 Objetivo
Criar a tabela `meals` (refeições) no seu banco de dados Supabase.

---

## ✅ PASSO 1: Acessar Supabase Dashboard

1. Abra: https://app.supabase.com
2. Faça login com sua conta
3. Selecione seu projeto `nutria-flexi-pal`

![Step 1](./docs/step1.png)

---

## ✅ PASSO 2: Ir para SQL Editor

Na barra lateral esquerda:
1. Clique em **SQL Editor** (ícone de código)
2. Clique em **New Query**

---

## ✅ PASSO 3: Copiar o SQL

Abra este arquivo em seu editor:
```
supabase/migrations/EXAMPLE_0002_create_meals_table.sql
```

**Copie TODO o conteúdo:**

```sql
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
```

---

## ✅ PASSO 4: Colar no SQL Editor

1. No Supabase Dashboard, no SQL Editor:
2. **Cole todo o SQL que copiou** (Ctrl+V ou Cmd+V)
3. Você verá o SQL em azul no editor

---

## ✅ PASSO 5: Executar

Na parte superior direita do editor:
1. Clique no botão **RUN** (verde)
2. Ou pressione: **Ctrl+Enter**

---

## ✅ PASSO 6: Validar

Você deve ver uma mensagem de sucesso:
```
Success. No rows returned.
```

Se vir essa mensagem, a tabela foi criada! ✅

---

## ✅ PASSO 7: Confirmar no Database

Para ter certeza:

1. Na barra lateral, clique em **Database** > **Tables**
2. Procure por `meals` na lista
3. Clique em `meals` para ver as colunas

Você deve ver:
- `id` (UUID)
- `user_id` (UUID)
- `name` (text)
- `description` (text)
- `calories` (integer)
- `protein` (integer)
- `carbs` (integer)
- `fat` (integer)
- `meal_type` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

---

## ✅ PASSO 8: Finalizar

Após confirmar que tudo está certo:

1. Renomeie o arquivo:
   - De: `EXAMPLE_0002_create_meals_table.sql`
   - Para: `0002_create_meals_table.sql`

2. Faça commit:
   ```bash
   git add supabase/migrations/
   git commit -m "feat: add meals table migration"
   git push origin main
   ```

---

## 🎉 Pronto!

A tabela `meals` foi criada com sucesso! 

Agora você pode:
- ✅ Criar novas migrations seguindo o mesmo padrão
- ✅ Usar a tabela no seu código React
- ✅ Ler/escrever dados de refeições

---

## 🆘 Problemas?

### Erro: "Table meals already exists"
- A tabela já foi criada
- Simplesmente continue

### Erro: "Foreign key constraint fails"
- Isso é OK - `auth.users` será criada quando primeiro usuário registrar
- A constraint funcionará normalmente em produção

### Erro: "Permission denied"
- Você pode não ter permissões no projeto
- Verifique se está logado como proprietário do projeto

---

## 📚 Próximas Migrations

Quando quiser adicionar novas tabelas:

1. Crie novo arquivo: `supabase/migrations/0003_seu_nome.sql`
2. Escreva o SQL
3. Copie e cole no SQL Editor do Supabase
4. Clique RUN
5. Faça commit

---

**Perguntas?** Veja:
- [HOW_TO_RUN_MIGRATIONS.md](./HOW_TO_RUN_MIGRATIONS.md)
- [MIGRATIONS.md](./MIGRATIONS.md)
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
