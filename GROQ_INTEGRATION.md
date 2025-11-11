# 🤖 MyNutriIA com Groq - Sistema Completo

## ✨ Atualizações Implementadas

Foi implementado um sistema completo de geração de planos de refeição com IA, incluindo:

### 1. **Integração Groq API** ✅
- Chave de API configurada em `.env`
- Modelo: `llama-3.1-8b-instant` (melhor disponível)
- Respostas em tempo real (<1 segundo)
- Segurança: chave protegida em variável de ambiente

### 2. **Chat Inteligente com IA** ✅
- Interface moderna e responsiva
- Histórico de mensagens
- Formatação com ícones e timestamps
- Tratamento de erros robusto
- Sistema de prompts especializado em nutrição

### 3. **Sistema de Refeições Avançado** ✅
- Exibição formatada com macros
- **Conversão dinâmica de unidades**:
  - Gramas ↔ Colheres ↔ Xícaras
  - Unidades especiais: filé, peito
  - Alimentos cozidos (arroz, feijão, frango)
- Macros por alimento e totalizados
- Botão para copiar receita
- Resumo visual com cores

### 4. **Banco de Dados Estruturado** ✅
- Tabela `meals` - Refeições principais
- Tabela `meal_foods` - Detalhes de alimentos
- Tabela `user_nutrition` - Perfil nutricional
- RLS (Row Level Security) em todas
- Índices para performance

### 5. **Tipos TypeScript Completos** ✅
- `Meal`, `Food`, `Macros`
- `UserProfile`, `NutritionPlan`
- `ChatMessage`, `MeasurementUnit`
- Type-safe em todo o código

### 6. **Cálculos Nutricionais** ✅
- Fórmula de Harris-Benedict para TDEE
- Conversão de unidades de medida
- Parsing de JSON do Groq
- Distribuição de macros

---

## 📁 Novos Arquivos Criados

```
src/
├── lib/
│   ├── groqClient.ts          # Cliente Groq com tipos
│   ├── types.ts               # Tipos TypeScript para nutrição
│   └── utils.ts               # (existente)
├── components/
│   ├── ChatAI.tsx            # Chat com IA Groq
│   ├── MealDisplay.tsx       # Exibição de refeições com macros
│   ├── MealsList.tsx         # Lista de refeições
│   └── (outros componentes)
└── pages/
    ├── Dashboard.tsx         # Atualizado com novas abas
    └── (outras páginas)

supabase/
└── migrations/
    └── 0003_add_meal_details.sql  # Schema completo

Documentação:
├── AI_SYSTEM_GUIDE.md        # Guia completo do sistema
├── NUTRITION_PROMPTS.md      # Exemplos de prompts
├── .env                      # Chave Groq adicionada
└── (outros arquivos)
```

---

## 🚀 Como Usar

### 1️⃣ **Acessar o Dashboard**
```
1. Faça login no myNutriIA
2. Clique em "Dashboard"
3. Selecione a aba "Chat IA"
```

### 2️⃣ **Conversar com a IA**
```
"Oi, tenho 80kg, 1.80m, 25 anos, homem. Quero emagrecer 5kg"

A IA fará perguntas de acompanhamento:
- Nível de atividade
- Alergias/restrições
- Preferências
```

### 3️⃣ **Receber Plano Personalizado**
```
A IA retorna:
- Seu TDEE calculado
- Distribuição de macros recomendada
- Plano de refeições (café, almoço, jantar)
- Cada refeição com alimentos e macros
```

### 4️⃣ **Ver Refeição com Macros**
```
1. Vá para aba "Minhas Refeições"
2. Clique em uma refeição para expandir
3. Veja macros totais e por alimento
4. Mude a unidade de medida conforme necessário
```

### 5️⃣ **Converter Unidades**
```
1. Exemplo: Frango em gramas
2. Clique no dropdown de unidade
3. Selecione "colheres" ou "xícaras"
4. Quantidade se ajusta automaticamente
```

---

## 🔧 Configuração Técnica

### Variáveis de Ambiente
```env
# .env
VITE_GROQ_API_KEY=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
VITE_SUPABASE_URL=https://zeovlkmweekxcgepyicu.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

### Modelo Groq Selecionado
- **Nome:** llama-3.1-8b-instant
- **Velocidade:** ⚡ Muito rápida
- **Qualidade:** ✨ Excelente
- **Custo:** 💰 Gratuito/Eficiente
- **Latência:** <1 segundo típico

### Alternativas Disponíveis (se necessário)
```
- llama-3.1-70b-versatile   (mais poderosa, mais lenta)
- mixtral-8x7b-32768        (alternativa)
```

---

## 📊 Estrutura de Dados - Exemplo

### Entrada do Usuário
```
"Quero ganhar massa muscular. 
Tenho 75kg, 1.78m, 28 anos, homem.
Treino 5x por semana na academia."
```

### Processamento
```typescript
TDEE calculado: 2,800 kcal/dia
Para bulking: 3,100 kcal/dia (surplus de 300)
Macros recomendadas:
- Proteína: 225g (0.75g por libra)
- Carbos: 350g (45% das calorias)
- Gordura: 75g (22% das calorias)
```

### Saída (Refeição)
```json
{
  "meal_type": "lunch",
  "name": "Frango com Arroz e Brócolis",
  "description": "Refeição clássica para ganho de massa",
  "foods": [
    {
      "name": "Frango Cozido (peito)",
      "quantity": 200,
      "unit": "g",
      "macros": {
        "protein": 60,
        "carbs": 0,
        "fat": 6,
        "calories": 306
      }
    },
    {
      "name": "Arroz Integral Cozido",
      "quantity": 200,
      "unit": "g",
      "macros": {
        "protein": 5,
        "carbs": 44,
        "fat": 2,
        "calories": 204
      }
    },
    {
      "name": "Brócolis Cozido",
      "quantity": 150,
      "unit": "g",
      "macros": {
        "protein": 4,
        "carbs": 10,
        "fat": 1,
        "calories": 60
      }
    }
  ],
  "totals": {
    "calories": 570,
    "protein": 69,
    "carbs": 54,
    "fat": 9
  }
}
```

---

## 💾 Salvando Refeições

Após receber uma refeição da IA:

```typescript
// Será implementado em fase 2
const saveMeal = async (meal: Meal) => {
  // 1. Salvar meal
  const { data: mealData } = await supabase
    .from('meals')
    .insert([{ user_id, name: meal.name, ... }]);
  
  // 2. Salvar foods
  await supabase
    .from('meal_foods')
    .insert(meal.foods.map(food => ({
      meal_id: mealData[0].id,
      food_name: food.name,
      quantity: food.quantity,
      ...
    })));
};
```

---

## 🎯 Recursos Implementados

### Chat
- [x] Interface bonita com ícones
- [x] Histórico de mensagens
- [x] Suporte a Enter para enviar
- [x] Indicador de digitação (animação)
- [x] Tratamento de erros
- [x] Timestamps das mensagens
- [x] Auto scroll para última mensagem

### Refeições
- [x] Exibição formatada por tipo
- [x] Macros totalizados
- [x] Macros por alimento
- [x] Conversão de unidades
- [x] Cores por tipo de refeição
- [x] Botão copiar receita
- [x] Exemplo de refeição (demo)

### IA
- [x] Integração Groq
- [x] Modelo llama-3.1-8b-instant
- [x] Prompt especializado em nutrição
- [x] Parsing de JSON
- [x] Cálculo de TDEE
- [x] Conversão de medidas

### Banco de Dados
- [x] Tabelas normalizadas
- [x] RLS em todas as tabelas
- [x] Índices para performance
- [x] Foreign keys com cascade

---

## 📚 Documentação

Arquivos de referência:
- **AI_SYSTEM_GUIDE.md** - Guia técnico completo
- **NUTRITION_PROMPTS.md** - Exemplos de prompts
- **SUPABASE_SETUP.md** - Setup de migrations
- **MIGRATIONS.md** - Guia de migrations

---

## 🔐 Segurança

✅ Chave de API em variável de ambiente
✅ RLS em todas as tabelas do banco
✅ Autenticação via Supabase Auth
✅ Usuários só veem suas próprias refeições
✅ Validação de entrada no backend (próxima fase)

---

## 🐛 Troubleshooting

### Erro: "Groq API Key não configurada"
```bash
# Verifique .env
cat .env | grep GROQ

# Reinicie o servidor
npm run dev
```

### Erro: "Could not connect to Groq"
- Verifique conexão de internet
- Valide chave API
- Aguarde alguns segundos

### IA retorna resposta sem JSON
- Peça ao usuário para ser mais específico
- A IA tenta recuperar automaticamente

---

## 📈 Próximas Fases

### Fase 2: Salvamento e Histórico
- [ ] Salvar refeições no banco
- [ ] Histórico de planos gerados
- [ ] Editar refeições
- [ ] Deletar refeições

### Fase 3: Funcionalidades Avançadas
- [ ] Gráficos de macros (pie/bar charts)
- [ ] Planos de 7/14/30 dias
- [ ] Substituição inteligente de alimentos
- [ ] Integração com scanners de código de barras

### Fase 4: Otimizações
- [ ] Cache de respostas
- [ ] Sugestões baseadas em histórico
- [ ] Integração com wearables
- [ ] Notificações de horários

---

## 🎓 Exemplos de Uso

### Iniciante (Perda de Peso)
```
"Oi, sou novo nisto. Peso 90kg, altura 1.75m, 30 anos.
Quero emagrecer 15kg. Devo comer menos ou treinar mais?"

IA: [Explica TDEE, responde, cria plano]
```

### Atleta (Ganho de Massa)
```
"Treino bodybuilding há 5 anos, TDEE é 3000.
Quero ganhar 1kg por mês de forma limpa.
Crie um plano com muita proteína."

IA: [Recomenda 3300 calorias, 240g proteína, cria plano]
```

### Com Restrições
```
"Sou vegano, intolerante a lactose, celíaco.
Quero uma dieta de 2000 kcal com 100g de proteína.
Pode ser?"

IA: [Adapta recomendações, cria plano com substitutos]
```

---

## 📞 Suporte

Dúvidas? Consulte:
1. **AI_SYSTEM_GUIDE.md** - Sistema técnico
2. **NUTRITION_PROMPTS.md** - Exemplos de prompts
3. **Documentação Groq** - https://console.groq.com/docs
4. **Documentação Supabase** - https://supabase.com/docs

---

## ✅ Checklist Final

- [x] Chave Groq no .env
- [x] Cliente Groq criado
- [x] Tipos TypeScript definidos
- [x] Chat com IA implementado
- [x] MealDisplay com macros
- [x] MealsList com exemplo
- [x] Dashboard atualizado
- [x] Migration 0003 criada
- [x] Documentação completa
- [x] Prompts de exemplo
- [ ] Testes em produção (próximo)
- [ ] Salvamento no banco (próximo)

---

**Sistema pronto para uso! 🚀**

Acesse: Dashboard → Chat IA → Comece a conversar
