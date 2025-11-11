# 🗄️ Executar Tabelas de Refeições no Supabase

Como o CLI teve problema de conexão, vamos executar manualmente (é rápido!).

## ⚡ Passo 1: Copie o SQL

Abra o arquivo:
```
supabase/migrations/0003_add_meal_details.sql
```

**Copie TODO o conteúdo.**

## ⚡ Passo 2: Vá ao Supabase Dashboard

1. Acesse: https://app.supabase.com
2. Selecione seu projeto `nutria-flexi-pal`
3. No menu esquerdo, clique em **SQL Editor**
4. Clique em **New Query**

## ⚡ Passo 3: Cole e Execute

1. Cole o SQL que copiou
2. Clique em **RUN** (botão verde, ou Ctrl+Enter)

## ✅ Passo 4: Confirme

Você deve ver:
```
Success. No rows returned.
```

E em **Database > Tables**, você verá as novas tabelas:
- `meals` ✅
- `meal_foods` ✅
- `user_nutrition` ✅

---

## 📋 Resumo do que será criado

### 1. Tabela `meals`
- Armazena refeições do usuário
- Campos: id, user_id, name, description, meal_type, created_at, updated_at
- RLS: Usuários só veem suas próprias refeições

### 2. Tabela `meal_foods`
- Alimentos dentro de cada refeição
- Campos: id, meal_id, food_name, quantity, unit, calories, protein, carbs, fat, notes
- RLS: Controlada pela refeição pai

### 3. Tabela `user_nutrition`
- Perfil nutricional do usuário
- Campos: weight, height, age, gender, goal, activity_level, allergies, preferences, tdee
- RLS: Usuário só vê seu próprio perfil

---

## 🔒 Segurança (RLS)

Todas as 3 tabelas têm **Row Level Security** habilitado:

✅ Usuários só veem seus próprios dados
✅ Usuários só podem editar seus próprios dados
✅ Deletar em cascade (refeição deletada = alimentos deletados)

---

## 📊 Relacionamentos

```
auth.users (Supabase Auth)
    ↓
    ├─→ meals (1 usuário : muitas refeições)
    │   ↓
    │   └─→ meal_foods (1 refeição : muitos alimentos)
    │
    └─→ user_nutrition (1 usuário : 1 perfil nutricional)
```

---

## 🚀 Próximos Passos

Após executar o SQL:

1. ✅ Tabelas criadas
2. ⏭️ Implemente salvamento de refeições no `ChatAI.tsx`
3. ⏭️ Implemente carregamento em `MealsList.tsx`
4. ⏭️ Implemente edição em `MealDisplay.tsx`
5. ⏭️ Adicione formulário de perfil no Dashboard

---

## ⚠️ Se Tiver Erro

### Erro: "Table meals already exists"
- Normal se você executou antes
- Simplesmente continue

### Erro: "Foreign key constraint fails"
- Normal se usuários ainda não existem
- A constraint funcionará quando usuários fizerem sign-up

### Erro: "Permission denied"
- Você pode não ser admin do projeto
- Peça permissões ao proprietário do projeto

---

**SQL pronto para executar! Copie e cole no Supabase Dashboard.** 🚀
