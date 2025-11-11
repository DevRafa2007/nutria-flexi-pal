# 🏗️ Arquitetura do Sistema - Diagrama Completo

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                      USUÁRIO (Browser)                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Dashboard (React + TypeScript)             │ │
│  │                                                        │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │  Abas: Chat IA | Refeições | Perfil             │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  │                                                        │ │
│  │  ┌─ Chat IA Component ────────────────────────────┐  │ │
│  │  │                                               │  │ │
│  │  │  [Input] → Enviar → groqClient.ts           │  │ │
│  │  │     ↓         ↓                              │  │ │
│  │  │  [Chat]  [Mensagens]                        │  │ │
│  │  │                                               │  │ │
│  │  └─ MealsList Component ────────────────────────┘  │ │
│  │                                                        │ │
│  │  ┌─ MealDisplay Component ─────────────────────────┐  │ │
│  │  │                                                │  │ │
│  │  │  ┌─ Alimentos ──────────────────────────────┐ │  │ │
│  │  │  │ • Nome: Frango                          │ │  │ │
│  │  │  │ • Qty: 150 [gramas ▼] ← Conversão     │ │  │ │
│  │  │  │ • Macros: P 45g C 0g G 5g 245kcal     │ │  │ │
│  │  │  └──────────────────────────────────────────┘ │  │ │
│  │  │                                                │  │ │
│  │  │  ┌─ Resumo de Macros ───────────────────────┐ │  │ │
│  │  │  │ Proteína: 50g | Carbs: 40g               │ │  │ │
│  │  │  │ Gordura: 10g  | Calorias: 500 kcal      │ │  │ │
│  │  │  └──────────────────────────────────────────┘ │  │ │
│  │  │                                                │  │ │
│  │  │  [Copiar] [Editar]                           │  │ │
│  │  └────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
              ↓                                      ↓
         HTTP Request                         HTTP Request
              ↓                                      ↓
┌──────────────────────────────┐    ┌──────────────────────────────┐
│    Groq API (Cloud)          │    │   Supabase (PostgreSQL)      │
│                              │    │                              │
│ POST /chat/completions       │    │  GET /meals                  │
│ Model: llama-3.1-8b-instant  │    │  POST /meals                 │
│ Prompt: Nutrition System      │    │  UPDATE /meals               │
│                              │    │  DELETE /meals               │
│ Input: Chat messages         │    │                              │
│ Output: Meal JSON            │    │  Tables:                     │
│                              │    │  ├─ meals                   │
│ Speed: <1 second             │    │  ├─ meal_foods              │
│                              │    │  └─ user_nutrition          │
│                              │    │                              │
│ Features:                    │    │  Security:                   │
│ ├─ TDEE Calculator           │    │  ├─ RLS Enabled             │
│ ├─ Macro Distribution         │    │  ├─ Supabase Auth           │
│ ├─ Unit Conversion            │    │  └─ Cascade Delete          │
│ └─ JSON Parser                │    │                              │
└──────────────────────────────┘    └──────────────────────────────┘
```

---

## 📦 Estrutura de Componentes

```
App.tsx (Router)
├─ pages/
│  ├─ Login.tsx          [Página de Login]
│  ├─ Register.tsx       [Página de Cadastro]
│  ├─ Dashboard.tsx      [Dashboard Principal]
│  │  └─ TabsComponent
│  │     ├─ TabContent: ChatAI
│  │     ├─ TabContent: MealsList
│  │     └─ TabContent: Perfil
│  ├─ Index.tsx          [Landing Page]
│  └─ NotFound.tsx       [404]
│
└─ components/
   ├─ ChatAI.tsx
   │  ├─ uses: groqClient.sendMessageToGroq()
   │  ├─ state: messages[], input, isLoading
   │  └─ features: chat, scroll, errors
   │
   ├─ MealsList.tsx
   │  ├─ uses: supabase.from('meals')
   │  ├─ map: meals.map(MealDisplay)
   │  └─ state: meals[], isLoading
   │
   ├─ MealDisplay.tsx
   │  ├─ props: meal (Meal type)
   │  ├─ state: selectedUnits, expanded
   │  ├─ uses: groqClient.convertMeasurement()
   │  └─ features: macros, conversion, copy
   │
   └─ ui/ (Shadcn Components)
      ├─ Button, Input, Card, Select...
      └─ 40+ componentes UI

lib/
├─ groqClient.ts
│  ├─ sendMessageToGroq(messages, prompt)
│  ├─ parseNutritionPlan(response)
│  ├─ calculateTDEE(params)
│  ├─ convertMeasurement(qty, from, to, food)
│  ├─ NUTRITION_SYSTEM_PROMPT
│  └─ MODEL = 'llama-3.1-8b-instant'
│
├─ supabaseClient.ts
│  └─ supabase = createClient(url, key)
│
└─ types.ts
   ├─ Meal, Food, Macros
   ├─ UserProfile, NutritionPlan
   ├─ ChatMessage
   └─ Type definitions
```

---

## 🗄️ Banco de Dados

```
auth.users (Supabase Auth)
│
├─→ profiles (1:1)
│   ├─ id (UUID, PK, FK)
│   ├─ first_name
│   ├─ last_name
│   └─ [RLS Enabled]
│
├─→ meals (1:N)
│   ├─ id (UUID, PK)
│   ├─ user_id (FK) ──┐
│   ├─ name           │
│   ├─ description    │ [RLS Policy]
│   ├─ meal_type      │ Users only
│   ├─ created_at     │ their own
│   ├─ updated_at     │
│   └─ [Index] on user_id, created_at
│       │
│       └─→ meal_foods (1:N)
│           ├─ id (UUID, PK)
│           ├─ meal_id (FK) ──┐
│           ├─ food_name       │ [RLS Policy]
│           ├─ quantity        │ Via meal_id
│           ├─ unit            │ reference
│           ├─ calories        │
│           ├─ protein         │
│           ├─ carbs           │
│           ├─ fat             │
│           ├─ notes           │
│           └─ [Index] on meal_id
│
└─→ user_nutrition (1:1)
    ├─ id (UUID, PK)
    ├─ user_id (FK, UNIQUE) ──┐
    ├─ weight                  │ [RLS Policy]
    ├─ height                  │ Users only
    ├─ age                     │ their own
    ├─ gender                  │
    ├─ goal                    │
    ├─ activity_level          │
    ├─ allergies[] (ARRAY)     │
    ├─ preferences[] (ARRAY)   │
    ├─ tdee                    │
    ├─ created_at              │
    └─ [Index] on user_id

Constraints:
✅ FK + CASCADE DELETE
✅ CHECK constraints em campos específicos
✅ UNIQUE em user_nutrition.user_id
✅ RLS policies em todas as tabelas
```

---

## 🔐 Segurança

```
┌─ Frontend ─────────────────────────┐
│                                    │
│  1. Autenticação                   │
│     └─→ Supabase.auth.signIn()    │
│                                    │
│  2. Sessão                         │
│     └─→ JWT Token                 │
│                                    │
│  3. API Calls                      │
│     └─→ Supabase Client            │
│         └─→ JWT no Header          │
│                                    │
└────────────────────────────────────┘
              ↓
┌─ Backend (Supabase) ────────────────┐
│                                    │
│  1. JWT Validation                 │
│     └─→ Verifica assinatura        │
│                                    │
│  2. Row Level Security (RLS)       │
│     └─→ auth.uid() = user_id       │
│                                    │
│  3. Data Access                    │
│     └─→ Apenas dados do user       │
│                                    │
└────────────────────────────────────┘

Groq API:
├─ API Key: Em .env (não exposto)
├─ HTTPS: Sim (seguro)
└─ Rate Limiting: Padrão Groq
```

---

## 🔄 Fluxo de Chat Completo

```
Usuário digita: "Tenho 80kg, quero emagrecer"
                           ↓
                   [Input onChange]
                   state.input = "..."
                           ↓
                [Clica em Enviar]
                           ↓
            [handleSend() executado]
                           ↓
    [Adiciona mensagem do usuário ao array]
                           ↓
    [setMessages(...prev, userMessage)]
                           ↓
              [setIsLoading(true)]
                           ↓
    [sendMessageToGroq(messages, prompt)]
                           ↓
            [Groq API processa]
                (llama-3.1-8b-instant)
                 (<1 segundo típico)
                           ↓
    [Response = resposta estruturada]
                           ↓
    [Adiciona resposta ao array]
    [setMessages(...prev, aiMessage)]
                           ↓
         [setIsLoading(false)]
                           ↓
    [User vê resposta com timestamp]
                           ↓
    [Se houver JSON, pode salvar]
       (próxima fase: implementar)
```

---

## 🍽️ Fluxo de Refeição Completa

```
Groq API retorna JSON:
{
  "meal_type": "lunch",
  "name": "Frango com Arroz",
  "foods": [
    {
      "name": "Frango",
      "quantity": 150,
      "unit": "g",
      "macros": {...}
    },
    ...
  ],
  "totalMacros": {...}
}
                ↓
    [Exibir em MealDisplay]
                ↓
    ┌─ Card com header colorido
    │  └─ meal_type color-coded
    │
    ├─ Foods Array
    │  └─ Para cada food:
    │     ├─ Nome
    │     ├─ Quantity [Dropdown para converter]
    │     └─ Macros (P, C, G)
    │
    ├─ Resumo de Macros
    │  └─ 4 cards com cores
    │
    └─ Ações
       ├─ Copiar (copy to clipboard)
       └─ Editar (placeholder)
```

---

## 🎯 Conversão de Unidades

```
User seleciona nova unidade: "colheres"
                ↓
          [handleUnitChange]
                ↓
    [setSelectedUnits[idx] = 'colheres']
                ↓
      [getConvertedQuantity()]
              chamada com:
        - foodIndex
        - originalQuantity (150)
        - originalUnit ('g')
        - selectedUnits[idx] ('colheres')
                ↓
    [Consultai tabela de conversão]
    'g' → 'colheres'
    150g ÷ 15 (g por colher)
    = 10 colheres
                ↓
    [Renderiza: "10 colheres"]
                ↓
    [Macros permanecem iguais]
    (mesma comida, unidade diferente)
```

---

## 📊 State Management

### ChatAI Component
```typescript
const [messages, setMessages] = useState<ChatMessage[]>([...])
const [input, setInput] = useState("")
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

### MealDisplay Component
```typescript
const [expanded, setExpanded] = useState(true)
const [selectedUnits, setSelectedUnits] = useState<Record<string, MeasurementUnit>>({...})
```

### MealsList Component
```typescript
const [meals, setMeals] = useState<Meal[]>([])
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

---

## 🎨 Design System

### Cores
```
Primary: #22c55e (verde)
Primary-Dark: #16a34a
Secondary: #f97316 (laranja)
Muted: #f5f5f5
Destructive: #ef4444
```

### Componentes UI
```
Buttons:     Shadcn/ui Button
Inputs:      Shadcn/ui Input
Cards:       Shadcn/ui Card
Selects:     Shadcn/ui Select
Tabs:        Shadcn/ui Tabs
Tooltips:    Shadcn/ui Tooltip
```

### Tipografia
```
H1: 3xl bold (landing)
H2: 2xl bold (sections)
H3: lg bold (subsections)
Body: base (conteúdo)
Small: sm (labels)
```

---

## 🚀 Performance

### Load Times
```
App Load:       <2s (Vite)
Dashboard:      <1s
Chat Response:  <1s (Groq)
Unit Convert:   Instantâneo
```

### Otimizações
```
✅ Lazy loading de componentes
✅ Memoization de funções pesadas
✅ Índices no banco de dados
✅ Queries otimizadas
```

---

## 📱 Responsividade

```
Mobile:   <768px
├─ Layout em coluna
├─ Fonts menores
└─ Touch-friendly

Tablet:   768px - 1024px
├─ 2 colunas
└─ Layout balanceado

Desktop:  >1024px
├─ 3 colunas
└─ Full layout
```

---

## 🔄 Ciclo de Desenvolvimento

```
Fase 1: ✅ Implementação (Completado)
├─ Chat com IA
├─ Exibição de refeições
├─ Conversão de unidades
├─ Banco de dados
└─ Documentação

Fase 2: ⏭️ Salvamento (Próximo)
├─ Save meal to DB
├─ Load meals from DB
├─ Edit meal
└─ Delete meal

Fase 3: ⏭️ Avançado
├─ Gráficos
├─ Planos de 7/14/30 dias
├─ Substituição de alimentos
└─ Dashboard de análise

Fase 4: ⏭️ Otimização
├─ Cache
├─ PWA
├─ Wearables
└─ Analytics
```

---

**Arquitetura completa e profissional! 🏗️**
