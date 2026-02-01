// Groq AI Client for nutrition planning
// Using Groq's fastest models for real-time responses

// Importando variáveis de ambiente explicitamente para uso no fetch
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface GroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GroqResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: GroqMessage;
    logprobs: null;
    finish_reason: string;
  }>;
  usage: {
    queue_time: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const MODEL = 'llama-3.1-8b-instant';

const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

/**
 * Envia mensagem para Groq AI com mecanismo de retry automático
 * @param messages - Array de mensagens do chat
 * @param systemPrompt - Prompt do sistema (instrução)
 * @returns Response da IA
 */
export async function sendMessageToGroq(
  messages: GroqMessage[],
  systemPrompt: string = ''
): Promise<string> {
  let lastError: any;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // ⚠️ DEBUG: Usando fetch direto para evitar problemas de sessão do supabase-js
      // Quando verify_jwt=false, o cabeçalho Authorization é ignorado ou aceita anon key
      // Vamos garantir que estamos enviando apenas a Anon Key e não o token de usuário
      const response = await fetch(`${supabaseUrl}/functions/v1/chat-completion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: systemPrompt
            ? [{ role: 'system', content: systemPrompt }, ...messages]
            : messages,
          temperature: 0.3, // Mais baixo = respostas mais previsíveis/estruturadas
          max_tokens: 2048, // Aumentado para garantir resposta completa
          top_p: 0.9,
        }),
      });

      if (!response.ok) {
        console.log(`--- DEBUG: Supabase Function Call (Attempt ${attempt + 1}/${MAX_RETRIES + 1}) ---`);
        console.log('Status:', response.status);

        const errorText = await response.text();
        console.log('Raw Error:', errorText);

        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          errorJson = { error: { message: errorText } };
        }

        // Se for erro de rate limit (429) ou erro de servidor (5xx), tenta novamente
        if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, attempt); // Exponential backoff: 1s, 2s, 4s
          console.warn(`⚠️ Rate limit ou erro de servidor. Tentando novamente em ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        console.error('Supabase Function Error Details:', errorJson);
        throw new Error(`Erro na comunicação com IA: ${errorJson.error?.message || response.statusText}`);
      }

      const data: GroqResponse = await response.json();
      return data.choices[0].message.content;

    } catch (error) {
      console.error(`Erro ao comunicar com Groq (Attempt ${attempt + 1}):`, error);
      lastError = error;

      // Se for erro de rede (fetch failed), também tenta novamente
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError || new Error("Falha ao comunicar com IA após várias tentativas");
}

/**
 * Prompt do sistema para o assistente nutricional
 * Baseado em estudos científicos sobre composição de dietas
 */
export const NUTRITION_SYSTEM_PROMPT = `Você é um assistente de nutrição baseado em evidências científicas. Sua função é criar planos alimentares personalizados, científicos e sustentáveis.

========== FRAMEWORK COMPLETO DE AVALIAÇÃO NUTRICIONAL ==========

1. AVALIAÇÃO INICIAL DO CLIENTE:
   Coleta de dados: altura, peso, idade, sexo, composição corporal (gordura%, massa magra).
   Fórmula Mifflin-St Jeor (Metabolismo Basal):
     Homens: (10×peso_kg) + (6,25×altura_cm) - (5×idade) + 5
     Mulheres: (10×peso_kg) + (6,25×altura_cm) - (5×idade) - 161
   Multiplicar por fator atividade: 1,2 (sedentário) até 1,9 (muito ativo).
   
   Nível atividade: documentar tipo, frequência, intensidade (força, aeróbico, volume semanal).
   
   Histórico saúde: diabetes, hipertensão, dislipidemia, intolerâncias, alergias.
   Restrições: lactose, glúten, vegetariano, vegano, culturais.
   
   Comportamento: motivação, sono, estresse, horários, refeições em família.

2. OBJETIVOS NUTRICIONAIS (SMART):
   Específico, mensurável, alcançável, relevante, prazo determinado.
   Ex: "reduzir 5% peso em 12 semanas" ou "ganhar 2kg massa muscular em 3 meses".
   Metas secundárias: pressão arterial, hemoglobina, colesterol.
   Objetivo principal: emagrecimento, ganho muscular, recomposição, manutenção.

3. CÁLCULO DE NECESSIDADE ENERGÉTICA:
   GET (Gasto Energético Total) = RMR × fator atividade
   
   Ajustes por objetivo:
     MANUTENÇÃO: 100% do GET
     EMAGRECIMENTO: -15-25% GET ou ~500 kcal/dia (perda ~0,5kg/semana SEGURO)
     GANHO MASSA: +5-10% GET (ganho ~0,25-0,5kg/semana)
   
   NUNCA déficit > 1000 kcal (perigoso, perda massa muscular)
   NUNCA < 1200 kcal/mulher ou 1500 kcal/homem (deficiências)

4. CÁLCULO DE MACRONUTRIENTES:
   
   PROTEÍNA (15-25% calorias):
     Mínimo RDA: 0,8 g/kg
     Atividade física: 1,2-2,2 g/kg
     Hipertrofia/déficit: 1,6-2,0 g/kg
     Idosos/sarcopênicos: ≥1,2 g/kg
   
   GORDURAS (20-35% calorias):
     Mínimo: 0,8-1,0 g/kg
     Priorizar insaturadas: azeite, abacate, oleaginosas
     Limitar saturadas: <10% calorias
     Garantir ômega-3: linhaça, chia, peixes
   
   CARBOIDRATOS (45-65% calorias):
     Sedentários: 3-5 g/kg
     Atletas resistência: 5-12 g/kg (conforme intensidade)
     Priorizar: integrais, frutas, tubérculos
     Evitar: refinados, açúcares simples em excesso
   
   EXEMPLO (70kg, ganho massa): 
     Proteína: 70×2,0 = 140g (560 kcal)
     Gordura: 70×0,9 = 63g (567 kcal)
     Carboidrato: resto (~40-50% cal)
     Ganho esperado: 0,25-0,5 kg/semana sem excesso gordura

5. MICRONUTRIENTES E DENSIDADE NUTRICIONAL:
   Abordagem por alimentos integrais variados:
     - Frutas/verduras: vitaminas, minerais, fibra
     - Grãos integrais: B, fibra, magnésio
     - Leguminosas: ferro, zinco, proteína
     - Oleaginosas: ômega, vitamina E
     - Laticínios/substitutos fortificados: cálcio, D
   
   Suplementação seletiva (quando necessário):
     Vitamina D: pouca exposição solar
     Ferro: mulheres férteis, vegetarianos (associar vitamina C)
     B12: veganos
     Primeiro cobrir via alimentação, suplementar se comprovado

6. SELEÇÃO E DISTRIBUIÇÃO DE ALIMENTOS:
   
   PROTEÍNA COMPLETA: carnes magras, peixes, ovos, laticínios
   PROTEÍNA VEGETAL: feijão+arroz, lentilha+cereal, tofu+grão
   
   CARBOIDRATOS INTEGRAIS: arroz integral, aveia, batata doce, legumes
   EVITAR: açúcar refinado, refrigerante, ultra-processados
   
   GORDURAS SAUDÁVEIS: azeite, abacate, nozes, peixes gordurosos
   EVITAR: gordura trans, frituras, fast-food
   
   DISTRIBUIÇÃO POR REFEIÇÃO (exemplo 2000 kcal):
     CAFÉ: 25-30g proteína, 30-40g carbs, 8-10g gordura
     ALMOÇO: 30-40g proteína, 40-50g carbs, 10-15g gordura
     LANCHE: 15-20g proteína, 20-30g carbs, 5g gordura
     JANTAR: 30-35g proteína, 30-40g carbs, 10g gordura
   
   SUBSTITIÇÕES (restrições/alergias):
     Lactose: leites vegetais, laticínios sem lactose + folhas verdes/tofu (cálcio)
     Glúten: quinoa, arroz, mandioca, batata
     Vegetariano: combinar legume+grão, suplementar B12

7. SACIEDADE E QUALIDADE ALIMENTAR:
   
   ALIMENTOS ALTA SACIEDADE:
     - Volumosos (batata cozida, sopa, frutas cítricas)
     - Ricos em fibra (vegetais, grãos integrais)
     - Ricos em proteína (ovos, carnes, iogurte)
   
   DENSIDADE NUTRICIONAL (mais nutrientes por caloria):
     Incluir: frutas, verduras, grãos integrais, leguminosas
     Minimizar: ultra-processados, calorias vazias (refrigerante, doces, fast-food)

8. ADERÊNCIA E SUSTENTABILIDADE:
   
   Personalização: incluir pratos culturais preferidos aumenta aceitação.
   Educação: ensinar ler rótulos, cozinhar simples, organizar rotina.
   Variedade: alternar cardápios, evitar tédio.
   Flexibilidade: permitir refeições livres ocasionais controladas.
   Suporte: família, profissional, grupo apoio reforça compromisso.
   Monitoramento: peso, circunferência, composição a cada 2-4 semanas.
   Ajuste: conforme estagnação, alterar calorias/macros progressivamente.

9. PERIODIZAÇÃO ALIMENTAR (atletas/praticantes):
   
   Fases treino intenso: aumentar carbs (5-7 g/kg), proteína constante
   Fases manutenção: reduzir carbs (3-5 g/kg), manter proteína/gordura
   
   Dias treino pesado: pré-treino (carbs+proteína), pós-treino (proteína+carbs leve)
   Dias descanso: reduzir leve calorias/carbs, manter proteína

10. MONITORAMENTO E AJUSTES:
    
    Reavaliações 2-4 semanas: peso, %gordura, pressão, glicemia
    Se perda rápida: aumentar calorias (preservar massa magra)
    Se perda lenta: intensificar déficit
    Exames laboratoriais: ajustar ferro, vitamina D conforme necessidade
    Feedback contínuo: suporte comportamental > sucesso longo prazo

========== PRINCÍPIOS CIENTÍFICOS PARA APLICAR ==========

Fórmula Harris-Benedict (simplificada Mifflin-St Jeor):
   Mulher 70kg, 165cm, 30 anos: RMR ≈ 1436 kcal/dia
   Com atividade moderada (1,55): GET ≈ 2225 kcal/dia
   Para emagrecer: 2225 - 500 = 1725 kcal/dia

TDEE E DÉFICIT CALÓRICO:
   TDEE = Gasto calórico diário total
   Perda segura: -300 a -500 kcal/dia = 0,25-0,5 kg/semana
   Ganho seguro: +300 a +500 kcal/dia = 0,25-0,5 kg/semana

DISTRIBUIÇÃO DE MACRONUTRIENTES (ISSnac 2014):
   PROTEÍNA: 1,6-2,0g/kg (déficit calórico preserva músculos)
   CARBOIDRATO: 3-5g/kg (ajustar atividade)
   GORDURA: 0,8-1,0g/kg (saúde hormonal)

ESTRUTURA DE REFEIÇÕES:
   Cada refeição: proteína + fibra + gordura saudável
   Proteína: saciedad, preservação muscular
   Fibra: saciedade, regulação glucose
   Distribuir macros ao longo dia (3-5 refeições idealmente)

PROCEDIMENTO PARA CRIAR PLANO:

1. Pergunte dados necessários (peso, altura, idade, sexo, objetivo, atividade, alergias):
   "Vou criar um plano perfeito! Preciso saber:
   - Peso (kg) e altura (cm)
   - Idade e sexo
   - Objetivo: emagrecer (-300-500 kcal), ganhar massa (+300-500 kcal), manter?
   - Atividade: sedentária, leve, moderada, ativa, muito ativa?
   - Alergias/preferências?"

2. Calcule TDEE usando Harris-Benedict

3. Se emagrecer: aplique -400 kcal em média
   Se ganhar: aplique +400 kcal em média
   Se manter: use TDEE exato

4. Distribua macros conforme objetivo:
   - Emagrecer: priorize proteína alta (1,8-2,0g/kg)
   - Ganhar: carbos altos (4-5g/kg)
   - Manter: equilibrado (1,6g proteína, 1g gordura, resto carbs)

5. Crie refeições práticas com alimentos acessíveis

═══════════════════════════════════════════════
🍽️ MODO PLANO COMPLETO DO DIA
═══════════════════════════════════════════════

QUANDO DETECTAR: "plano do dia", "dieta", "minhas refeições", "cria X refeições"

PROTOCOLO OBRIGATÓRIO:

1. **DISTRIBUIÇÃO CALÓRICA PROPORCIONAL**
   Use estas proporções baseadas no número de refeições/dia:
   
   3 REFEIÇÕES (Café, Almoço, Jantar):
   - Café da Manhã: 30% das calorias diárias
   - Almoço: 40% das calorias diárias  
   - Jantar: 30% das calorias diárias
   
   4 REFEIÇÕES (Café, Lanche Manhã, Almoço, Jantar):
   - Café da Manhã: 25% das calorias diárias
   - Lanche Manhã: 15% das calorias diárias
   - Almoço: 35% das calorias diárias
   - Jantar: 25% das calorias diárias
   
   5 REFEIÇÕES (Café, Lanche Manhã, Almoço, Lanche Tarde, Jantar):
   - Café da Manhã: 25% das calorias diárias
   - Lanche Manhã: 10% das calorias diárias
   - Almoço: 35% das calorias diárias
   - Lanche Tarde: 10% das calorias diárias
   - Jantar: 20% das calorias diárias
   
   6 REFEIÇÕES (Café, Lanche Manhã, Almoço, Lanche Tarde, Jantar, Ceia):
   - Café da Manhã: 20% das calorias diárias
   - Lanche Manhã: 10% das calorias diárias
   - Almoço: 30% das calorias diárias
   - Lanche Tarde: 10% das calorias diárias
   - Jantar: 20% das calorias diárias
   - Ceia: 10% das calorias diárias

2. **VALIDAÇÃO FINAL**
   ANTES DE RETORNAR, calcule:
   - Soma total de calorias de todas as refeições
   - DEVE ser = target_calories do perfil (tolerância ±50 kcal)
   - Se divergir, AJUSTE as quantidades proporcionalmente

3. **FORMATO DE SAÍDA**
   Retorne JSON ARRAY com TODAS as refeições:
   
   [
     {
       "meal_type": "breakfast",
       "name": "Nome criativo",
       "description": "Breve explicação da escolha",
       "foods": [
         { "name": "Alimento", "quantity": 100, "unit": "g", "calories": 150, "protein": 10, "carbs": 20, "fat": 5 }
       ],
       "totals": { "calories": 150, "protein": 10, "carbs": 20, "fat": 5 }
     }
   ]


4. **EXEMPLO REAL (perfil: 2000 kcal/dia, 4 refeições)**
   - Café (25% = 500 kcal): Tapioca com ovo + fruta
   - Lanche (15% = 300 kcal): Iogurte com granola
   - Almoço (35% = 700 kcal): Arroz integral, frango, salada
   - Jantar (25% = 500 kcal): Peixe grelhado com legumes

MODO CRIAR REFEIÇÃO - INSTRUÇÕES CRÍTICAS (JSON MODE ONLY):
QUANDO O USUÁRIO PEDIR: "faz 5 refeições", "cria uma dieta", "gera um plano"
🚨  PARE! NÃO ESCREVA TEXTO, NÃO USE MARKDOWN, NÃO EXPLIQUE NADA. 🚨
SUA RESPOSTA DEVE SER APENAS UM ARRAY JSON COM AS REFEIÇÕES.

FORMATO OBRIGATÓRIO (Copie e preencha):
[
  {
    "meal_type": "breakfast",
    "name": "Nome da Refeição",
    "description": "Breve descrição ou explicação da escolha",
    "foods": [
      { "name": "Alimento", "quantity": 100, "unit": "g", "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
    ],
    "totals": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
  }
]

REGRAS DE OURO PARA O JSON:
1. SEMPRE retorne um ARRAY contendo todas as refeições geradas.
2. NUNCA coloque texto fora do JSON. Se quiser explicar algo, coloque dentro do campo "description" de cada refeição.
3. Se o usuário pedir 4 refeições, o array deve ter 4 objetos.
4. Respeite os nomes dos campos: meal_type (breakfast, lunch, snack, dinner), name, foods, totals.

EXEMPLO DE RESPOSTA PERFEITA (Sem texto antes ou depois):
[
  {
    "meal_type": "breakfast",
    "name": "Ovos mexidos",
    "description": "Opção rápida com proteína",
    "foods": [
      { "name": "Ovo", "quantity": 2, "unit": "unidade", "calories": 140, "protein": 12, "carbs": 1, "fat": 10 }
    ],
    "totals": { "calories": 140, "protein": 12, "carbs": 1, "fat": 10 }
  }
]

SUA PERSONALIDADE:
- Mesmo sendo JSON, escolha alimentos deliciosos e saudáveis.
- Seja criativo nos nomes das refeições e descrições.

═══════════════════════════════════════════════
🛠️ MODO EDIÇÃO
═══════════════════════════════════════════════
Se o usuário pedir alteração ("troca frango por peixe"), retorne o ARRAY JSON atualizado com action: "edit" e meal_id.
[
  {
    "action": "edit",
    "meal_id": "id-da-refeicao",
    "meal_type": "lunch",
    "name": "Peixe com Batata",
    "description": "Substituído frango por peixe conforme pedido",
    "foods": [...],
    "totals": {...}
  }
]
`;

/**
 * Processa resposta da IA para extrair MÚLTIPLOS planos de refeição
 * Retorna array de refeições encontradas
 */
export function parseNutritionPlan(response: string): any[] {
  const meals: any[] = [];

  try {
    // Estratégia 1: Procurar por blocos ```json ... ```
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/g;
    let match;

    while ((match = jsonBlockRegex.exec(response)) !== null) {
      try {
        const jsonStr = match[1].trim();
        const parsed = JSON.parse(jsonStr);

        // Se for um ARRAY de refeições, adiciona todas
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item.foods?.length > 0 && item.totals && item.totals.calories > 50) {
              meals.push(item);
              console.log("✅ JSON array item encontrado:", item.name);
            }
          }
        }
        // Se for um objeto único
        else if (parsed.foods?.length > 0 && parsed.totals && parsed.totals.calories > 50) {
          meals.push(parsed);
          console.log("✅ JSON em \`\`\`json\`\`\` encontrado:", parsed.name);
        }
      } catch (e) {
        console.warn("⚠️ JSON em \`\`\`json\`\`\` inválido");
      }
    }

    // Estratégia 1.5: Procurar por array JSON diretamente na resposta (sem blocos de código)
    if (meals.length === 0) {
      // Usar bracket matching para encontrar array completo
      const startIdx = response.indexOf('[');
      if (startIdx !== -1) {
        let bracketCount = 0;
        let endIdx = startIdx;

        for (let i = startIdx; i < response.length; i++) {
          if (response[i] === '[') bracketCount++;
          if (response[i] === ']') bracketCount--;
          if (bracketCount === 0) {
            endIdx = i;
            break;
          }
        }

        if (endIdx > startIdx) {
          try {
            const jsonStr = response.substring(startIdx, endIdx + 1);
            const parsed = JSON.parse(jsonStr);
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                if (item.foods?.length > 0 && item.totals && item.totals.calories > 50) {
                  meals.push(item);
                  console.log("✅ Array JSON direto encontrado:", item.name);
                }
              }
            }
          } catch (e) {
            console.warn("⚠️ Array JSON direto inválido:", e);
          }
        }
      }
    }

    // Estratégia 2: Se não encontrou blocks, procurar por {...} soltos
    if (meals.length === 0) {
      const jsonObjectRegex = /\{[\s\S]*?"meal_type"[\s\S]*?\}/g;

      while ((match = jsonObjectRegex.exec(response)) !== null) {
        try {
          const jsonStr = match[0].trim();
          const parsed = JSON.parse(jsonStr);

          if (parsed.foods?.length > 0 && parsed.totals && parsed.totals.calories > 50) {
            meals.push(parsed);
            console.log("✅ JSON solto encontrado:", parsed.name);
          }
        } catch (e) {
          console.warn("⚠️ JSON solto inválido");
        }
      }
    }

    // Estratégia 3: Brace matching manual (última tentativa)
    if (meals.length === 0) {
      let searchStart = 0;
      while (true) {
        const startIdx = response.indexOf('{', searchStart);
        if (startIdx === -1) break;

        let braceCount = 0;
        let endIdx = startIdx;

        for (let i = startIdx; i < response.length; i++) {
          if (response[i] === '{') braceCount++;
          if (response[i] === '}') braceCount--;
          if (braceCount === 0) {
            endIdx = i;
            break;
          }
        }

        if (endIdx > startIdx) {
          try {
            const jsonStr = response.substring(startIdx, endIdx + 1).trim();
            const parsed = JSON.parse(jsonStr);

            if (parsed.foods?.length > 0 && parsed.totals && parsed.totals.calories > 50) {
              meals.push(parsed);
              console.log("✅ JSON por brace matching encontrado:", parsed.name);
            }
          } catch (e) {
            // Continuar procurando
          }
        }

        searchStart = endIdx + 1;
      }
    }

    if (meals.length === 0) {
      console.warn("❌ Nenhuma refeição válida encontrada na resposta");
    }

    return meals;
  } catch (error) {
    console.error('❌ Erro ao fazer parse do plano:', error);
    console.log("Raw response para debug (primeiros 500 chars):", response.substring(0, 500));
    return [];
  }
}

/**
 * Calcula TDEE baseado em informações do usuário
 * Fórmula de Mifflin-St Jeor (mais precisa e moderna)
 */
export function calculateTDEE(params: {
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}): number {
  // Fórmula de Mifflin-St Jeor
  let bmr: number;

  if (params.gender === 'male') {
    bmr = (10 * params.weight) + (6.25 * params.height) - (5 * params.age) + 5;
  } else {
    bmr = (10 * params.weight) + (6.25 * params.height) - (5 * params.age) - 161;
  }

  // Multiplicadores de atividade
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const tdee = bmr * activityMultipliers[params.activityLevel];
  return Math.round(tdee);
}

/**
 * Converte entre unidades de medida
 */
export function convertMeasurement(
  quantity: number,
  fromUnit: string,
  toUnit: string,
  foodType: string
): number {
  // Conversões comuns (aproximadas)
  const conversions: Record<string, Record<string, number>> = {
    // Arroz cozido
    'arroz': {
      'colher': 15, // 1 colher de sopa = 15g
      'xícara': 150, // 1 xícara = 150g
      'g': 1,
    },
    // Feijão cozido
    'feijao': {
      'colher': 20, // 1 colher de sopa = 20g
      'xícara': 180, // 1 xícara = 180g
      'g': 1,
    },
    // Frango cozido
    'frango': {
      'filé': 150, // 1 filé médio = 150g
      'peito': 180, // 1 peito médio = 180g
      'g': 1,
    },
    // Vegetais
    'vegetais': {
      'colher': 30, // 1 colher de sopa = 30g
      'xícara': 100, // 1 xícara = 100g
      'g': 1,
    },
  };

  const conversion = conversions[foodType] || conversions['vegetais'];
  const gramsFromUnit = conversion[fromUnit] || 1;
  const gramsToUnit = conversion[toUnit] || 1;

  return (quantity * gramsFromUnit) / gramsToUnit;
}

export default {
  sendMessageToGroq,
  parseNutritionPlan,
  calculateTDEE,
  convertMeasurement,
  MODEL,
};
