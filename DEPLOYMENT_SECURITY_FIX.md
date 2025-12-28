# 🔐 Guia de Implementação: Correção de Segurança RLS

## ⚠️ Problema Identificado

A tabela `profiles` está **exposta publicamente**. Qualquer pessoa com a chave anônima pode ler todos os perfis de todos os usuários.

## ✅ Solução

Aplicar a migration `0011_fix_profiles_rls.sql` que restringe o acesso apenas ao próprio usuário.

---

## 📋 Passo a Passo

### 1️⃣ Teste ANTES (Opcional mas Recomendado)

Execute o script de teste para confirmar a vulnerabilidade:

```bash
python test_rls_security.py
```

**Resultado esperado ANTES da correção:**
- ⚠️ Script mostrará todos os perfis do banco
- Isso confirma a vulnerabilidade

### 2️⃣ Aplicar a Migration

Como o `supabase db push` falhou, aplique manualmente:

1. **Abra o Supabase Dashboard**:
   - Acesse: https://supabase.com/dashboard/project/zeovlkmweekxcgepyicu

2. **Vá para SQL Editor**:
   - Menu lateral: `SQL Editor`
   - Clique em `New query`

3. **Cole o SQL**:
   - Abra o arquivo: `supabase/migrations/0011_fix_profiles_rls.sql`
   - Copie TODO o conteúdo
   - Cole no SQL Editor

4. **Execute**:
   - Clique em `Run` ou pressione `Ctrl+Enter`
   - Aguarde a confirmação: `Success. No rows returned`

### 3️⃣ Teste DEPOIS (Crucial!)

Execute novamente o script de teste:

```bash
python test_rls_security.py
```

**Resultado esperado DEPOIS da correção:**
- 🎉 Script mostrará array vazio `[]`
- Ou erro 401/403 (ainda melhor)
- Isso confirma que a correção funcionou

### 4️⃣ Verifique o App

1. Faça login no app normalmente
2. Verifique se você consegue ver SEU perfil
3. Confirme que tudo está funcionando

---

## 🔍 O Que a Migration Faz

**ANTES:**
```sql
-- ❌ PERIGOSO: Qualquer um pode ler TODOS os perfis
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );
```

**DEPOIS:**
```sql
-- ✅ SEGURO: Usuários só veem o próprio perfil
create policy "Users can view their own profile."
  on profiles for select
  using ( auth.uid() = id );
```

---

## ✅ Checklist

- [ ] Executei `test_rls_security.py` ANTES (confirmei vulnerabilidade)
- [ ] Abri o Supabase Dashboard
- [ ] Colei e executei `0011_fix_profiles_rls.sql`
- [ ] Executei `test_rls_security.py` DEPOIS (confirmei correção)
- [ ] Testei o app (login e visualização de perfil funcionam)
- [ ] ✨ Banco de dados está seguro!

---

## 🆘 Troubleshooting

**Se o teste DEPOIS ainda mostrar dados:**
1. Verifique se a query foi executada com sucesso
2. Limpe o cache do browser (`Ctrl+Shift+Delete`)
3. Execute novamente

**Se o app parar de funcionar:**
- Verifique se você está autenticado
- A política permite acesso apenas para usuários logados
- Faça logout e login novamente

---

## 📊 Outras Tabelas

Boa notícia! As outras tabelas já estão protegidas:

- ✅ `meals` - apenas owner
- ✅ `chat_messages` - apenas owner
- ✅ `daily_consumption` - apenas owner
- ✅ `user_streak` - apenas owner
- ✅ `consumed_foods` - RLS habilitado
- ✅ `password_policy_log` - RLS habilitado

Apenas `profiles` precisava de correção!
