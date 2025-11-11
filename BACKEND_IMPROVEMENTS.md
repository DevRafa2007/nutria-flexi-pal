# 🚀 Melhorias Sugeridas para o Backend - myNutrIA

## 📊 Estrutura de Banco de Dados

### Tabelas Principais

#### 1. **users**
```sql
- id (uuid, primary key)
- email (text, unique)
- name (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 2. **user_profiles**
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key -> users.id)
- weight (decimal) -- peso atual
- height (decimal) -- altura em cm
- age (integer)
- gender (text) -- masculino/feminino
- activity_level (text) -- sedentário, leve, moderado, intenso
- goal (text) -- emagrecer, ganhar_massa, manter
- dietary_restrictions (text[]) -- array de restrições
- preferred_foods (text[]) -- alimentos preferidos
- tdee (decimal) -- calculado automaticamente
- target_calories (decimal) -- meta de calorias
- target_protein (decimal)
- target_carbs (decimal)
- target_fat (decimal)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 3. **meals**
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key -> users.id)
- name (text) -- ex: "Café da Manhã"
- meal_type (text) -- breakfast, lunch, dinner, snack
- scheduled_date (date)
- scheduled_time (time)
- calories (decimal)
- protein (decimal)
- carbs (decimal)
- fat (decimal)
- completed (boolean, default false)
- completed_at (timestamp)
- notes (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 4. **meal_items**
```sql
- id (uuid, primary key)
- meal_id (uuid, foreign key -> meals.id)
- food_name (text)
- quantity (decimal)
- unit (text) -- g, ml, unidade, colher, etc
- calories (decimal)
- protein (decimal)
- carbs (decimal)
- fat (decimal)
- created_at (timestamp)
```

#### 5. **consumption_tracking**
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key -> users.id)
- date (date)
- meal_id (uuid, foreign key -> meals.id)
- completed (boolean)
- created_at (timestamp)
```

#### 6. **user_streaks**
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key -> users.id, unique)
- current_streak (integer, default 0)
- best_streak (integer, default 0)
- start_date (date)
- last_activity_date (date)
- updated_at (timestamp)
```

#### 7. **ai_conversations**
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key -> users.id)
- message (text)
- role (text) -- user, assistant
- timestamp (timestamp)
- context (jsonb) -- armazena contexto da conversa
```

#### 8. **food_database**
```sql
- id (uuid, primary key)
- name (text)
- category (text)
- calories_per_100g (decimal)
- protein_per_100g (decimal)
- carbs_per_100g (decimal)
- fat_per_100g (decimal)
- fiber_per_100g (decimal)
- source (text) -- TACO, USDA, custom
- created_at (timestamp)
```

---

## 🔐 Autenticação e Segurança

### RLS (Row Level Security) Policies

```sql
-- Users só podem ver e editar seus próprios dados
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Mesma lógica para meals, consumption_tracking, ai_conversations
```

### Autenticação
- **Email/Password**: padrão
- **Google OAuth**: integração futura
- **Magic Link**: login sem senha via email

---

## ⚡ Edge Functions (Serverless)

### 1. **calculate-tdee**
Calcula TDEE e macros baseado no perfil do usuário
```typescript
// Input: weight, height, age, gender, activity_level, goal
// Output: tdee, target_calories, protein, carbs, fat
```

### 2. **generate-meal-plan**
Gera plano de refeições usando IA
```typescript
// Input: user_profile, preferences, dietary_restrictions
// Output: array de meals com meal_items
```

### 3. **update-streak**
Atualiza streak quando usuário completa refeições
```typescript
// Input: user_id, date
// Output: updated streak data
```

### 4. **chat-ai**
Processa conversa com IA (GPT/Groq)
```typescript
// Input: user_message, conversation_history, user_context
// Output: ai_response, updated_context
```

### 5. **food-search**
Busca alimentos no banco de dados ou API externa
```typescript
// Input: search_query
// Output: array de alimentos com nutrientes
```

---

## 🤖 Integração com IA

### APIs Sugeridas
1. **OpenAI GPT-4** ou **Groq (LLaMA)** - para chat inteligente
2. **TACO** - banco de dados brasileiro de composição de alimentos
3. **USDA FoodData Central** - banco internacional
4. **Edamam Nutrition API** - análise nutricional avançada

### Fluxo de Chat com IA
1. Usuário envia mensagem
2. Sistema busca contexto (perfil, histórico, preferências)
3. IA processa e responde com sugestões personalizadas
4. Se mencionar alimentos, busca informações nutricionais
5. Se criar plano, salva meals no banco
6. Atualiza histórico de conversa

---

## 📈 Funcionalidades Importantes

### 1. **Cálculo Automático de TDEE**
```
Fórmula Mifflin-St Jeor:
Homens: (10 × peso) + (6.25 × altura) - (5 × idade) + 5
Mulheres: (10 × peso) + (6.25 × altura) - (5 × idade) - 161

Multiplicar por fator de atividade:
- Sedentário: 1.2
- Leve: 1.375
- Moderado: 1.55
- Intenso: 1.725

Ajustar por objetivo:
- Emagrecer: -500 kcal/dia (déficit de 20%)
- Ganhar massa: +300 a +500 kcal/dia
- Manter: TDEE
```

### 2. **Sistema de Streak**
- Trigger automático ao completar refeições
- Reseta se pular um dia
- Notificações push (futura)

### 3. **Histórico e Analytics**
- Gráficos de peso semanal/mensal
- Gráficos de calorias consumidas
- Taxa de aderência ao plano

### 4. **Substituições Inteligentes**
IA sugere substituições com macros similares:
```
Arroz branco → Arroz integral, batata doce, macarrão integral
Frango → Peixe, carne magra, tofu
```

---

## 🔄 Migrações e Seeds

### Seeds Importantes
1. **food_database**: popular com TACO (top 500 alimentos brasileiros)
2. **meal_types**: café, almoço, jantar, lanches
3. **activity_levels**: sedentário, leve, moderado, intenso

---

## 🚀 Prioridades de Implementação

### Fase 1 (MVP)
- [ ] Autenticação (email/password)
- [ ] CRUD de user_profiles
- [ ] Cálculo de TDEE automático
- [ ] CRUD de meals e meal_items
- [ ] Sistema de streak básico
- [ ] Chat com IA (integração Groq/OpenAI)

### Fase 2
- [ ] Food database populado
- [ ] Busca de alimentos
- [ ] Gráficos de progresso
- [ ] Histórico de peso
- [ ] Notificações

### Fase 3
- [ ] OAuth (Google)
- [ ] Análise de imagens de refeição (IA vision)
- [ ] Gamificação avançada
- [ ] Comunidade e compartilhamento

---

## 💾 Storage (Arquivos)

### Buckets
1. **avatars**: fotos de perfil
2. **meal-photos**: fotos de refeições
3. **reports**: relatórios em PDF gerados

---

## 🔧 Variáveis de Ambiente

```env
# API Keys
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk-...
EDAMAM_API_KEY=...
EDAMAM_APP_ID=...

# Supabase
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# URLs
FRONTEND_URL=https://mynutria.com
```

---

## 📚 Documentação Adicional
- Implementar Swagger/OpenAPI para documentar Edge Functions
- Criar guia de integração para desenvolvedores
- Documentar fluxos de dados principais

---

**🎯 Próximos Passos:**
1. Criar migrations no Supabase
2. Implementar Edge Functions prioritárias
3. Conectar frontend com backend
4. Testar fluxos completos
5. Popular food_database
