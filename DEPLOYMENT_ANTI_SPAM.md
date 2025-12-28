# 🛡️ Deploy Anti-Spam Protection

## Proteções Implementadas

✅ **Layer 1 - Frontend (ChatAI.tsx)**
- Limite: 15.000 caracteres por mensagem
- Limite: 200 linhas por mensagem  
- Cooldown: 3 segundos entre mensagens
- Toast warnings para usuário

✅ **Layer 2 - Edge Function (chat-completion)**
- Validação servidor: max 15.000 chars
- Validação servidor: max 10 mensagens por requisição
- Return 400 Bad Request se exceder

✅ **Layer 3 - Database (Migrations 0012 + 0013)**
- Tabela `chat_rate_limit` para tracking
- CHECK constraint: max 15.000 chars em `chat_messages`
- System prompt (~13.5KB): NÃO é salvo no banco
- Function: `cleanup_old_chat_messages()` (auto-delete >30 dias)
- Function: `check_rate_limit()` (20 msg/min, 200 msg/dia)

---

## 📋 Deployment Steps

### 1️⃣ Deploy Frontend

```bash
# Commitar mudanças
git add src/components/ChatAI.tsx supabase/functions/chat-completion/index.ts supabase/migrations/0013_increase_ai_response_limit.sql DEPLOYMENT_ANTI_SPAM.md
git commit -m "feat: increase message limit to 15000 chars"
git push
```

Vercel fará deploy automaticamente.

### 2️⃣ Deploy Edge Function

```bash
supabase functions deploy chat-completion
```

Isso atualiza a function com as validações server-side.

### 3️⃣ Apply Database Migration

**Opção A: Via Supabase Dashboard (Recomendado)**
1. Abra: https://supabase.com/dashboard/project/zeovlkmweekxcgepyicu
2. SQL Editor → New query
3. Cole o conteúdo de `supabase/migrations/0013_increase_ai_response_limit.sql`
4. Execute (Run)
5. Verifique se constraint foi atualizada (deve mostrar 6000 chars)

**Opção B: Via CLI**
```bash
supabase db push
```

---

## 🧪 Testing

### Teste 1: Limite de Caracteres
1. Cole um texto com >2000 caracteres no chat
2. Tente enviar
3. **Esperado:** Toast erro: "Mensagem muito longa!"

### Teste 2: Cooldown
1. Envie uma mensagem
2. Tente enviar outra imediatamente
3. **Esperado:** Toast warning: "Aguarde 3s antes de enviar outra mensagem."

### Teste 3: Limite de Linhas
1. Cole um texto com >50 linhas
2. Tente enviar
3. **Esperado:** Toast erro: "Muitas linhas! Máximo: 50 linhas."

### Teste 4: Edge Function Validation
1. Use Postman/curl para tentar enviar mensagem com >2000 chars direto para Edge Function
2. **Esperado:** HTTP 400 Bad Request

---

## 📊 Monitoring

Após deploy, monitore:

1. **Supabase Dashboard → Functions → chat-completion**
   - Verifique logs de "Message too long" ou "Too many messages"
   
2. **Supabase Dashboard → Database → chat_rate_limit**
   - Veja quais users estão sendo rate limited

3. **Frontend Console**
   - Verifique se toasts aparecem corretamente

---

## 🔧 Manutenção

### Ajustar Limites

**Frontend:**
- Edite `ChatAI.tsx` linhas 36-38:
  ```typescript
  const MAX_MESSAGE_LENGTH = 2000;
  const MAX_MESSAGE_LINES = 50;
  const COOLDOWN_MS = 3000;
  ```

**Edge Function:**
- Edite `chat-completion/index.ts` linhas 41-42:
  ```typescript
  const MAX_MESSAGE_LENGTH = 2000;
  const MAX_MESSAGES_COUNT = 10;
  ```

**Database:**
- Edite migration ou execute:
  ```sql
  -- Mudar limite de caracteres
  ALTER TABLE chat_messages DROP CONSTRAINT chat_messages_content_length_check;
  ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_content_length_check 
    CHECK (char_length(content) <= 3000);
  ```

### Limpar Mensagens Antigas Manualmente

```sql
SELECT cleanup_old_chat_messages();
```

Retorna número de mensagens deletadas.

---

## ✅ Success Criteria

- [ ] Frontend bloqueia mensagens >15000 chars com toast
- [ ] Frontend bloqueia envios rápidos (<3s) com toast  
- [ ] Edge Function retorna 400 para mensagens >15000 chars
- [ ] Migration 0013 aplicada sem erros
- [ ] Constraint no banco permite até 15000 chars
- [ ] App funciona normalmente para uso legítimo

---

## 🆘 Rollback (Se Necessário)

Se algo quebrar:

**Frontend:**
```bash
git revert HEAD
git push
```

**Edge Function:**
```bash
# Redeploy versão anterior (se tiver)
git checkout HEAD~1 supabase/functions/chat-completion/index.ts
supabase functions deploy chat-completion
```

**Database:**
```sql
-- Remover constraint
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_content_length_check;

-- Remover tabela
DROP TABLE IF EXISTS chat_rate_limit CASCADE;

-- Remover functions
DROP FUNCTION IF  EXISTS check_rate_limit CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_chat_messages CASCADE;
```
