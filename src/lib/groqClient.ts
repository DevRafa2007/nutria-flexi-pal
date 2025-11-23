// Groq AI Client for nutrition planning
// Using Groq's fastest models for real-time responses

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

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Modelo mais recente e poderoso do Groq (2025)
// llama-3.3-70b-versatile: Versão mais nova, 70B params, 8K contexto
// llama-3.2-90b-vision-preview: Alternativa com visão
// gemma2-9b-it: Mais leve se tiver problemas
const MODEL = 'llama-3.3-70b-versatile';

if (!GROQ_API_KEY) {
  console.warn('⚠️ VITE_GROQ_API_KEY não configurada');
}

/**
 * Envia mensagem para Groq AI
 * @param messages - Array de mensagens do chat
 * @param systemPrompt - Prompt do sistema (instrução)
 * @returns Response da IA
 */
export async function sendMessageToGroq(
  messages: GroqMessage[],
  systemPrompt: string = ''
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API Key não configurada');
  }

  try {
    // ⚠️ OTIMIZAÇÃO: Reduzir tokens para evitar erro 413 (Content Too Large)
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: systemPrompt
          ? [{ role: 'system', content: systemPrompt }, ...messages]
          : messages,
        temperature: 0.5, // Reduzido de 0.7 para respostas mais diretas (menos variação)
        max_tokens: 1024, // Reduzido de 2048 para economizar tokens (refeições não precisam de 2048)
        top_p: 0.9, // Reduzido de 1 para respostas mais focadas
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Groq API Error: ${error.error?.message || 'Unknown error'}`);
    }

    const data: GroqResponse = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Erro ao comunicar com Groq:', error);
    throw error;
  }
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

MODO CRIAR REFEIÇÃO - INSTRUÇÕES CRÍTICAS:
QUANDO O USUÁRIO PEDIR: "faz 5 refeições", "cria uma dieta", "gera um plano"
RESPONDA APENAS COM JSONs (nada de texto, bullets, ou explicações):

1. ENVIE EXATAMENTE ASSIM (cópia fiel):
{
  "meal_type": "breakfast",
  "name": "Ovos com Aveia",
  "description": "Café da manhã alto em proteína",
  "foods": [
    {
      "name": "Ovo inteiro",
      "quantity": 2,
      "unit": "unidade",
      "calories": 140,
      "protein": 12,
      "carbs": 1,
      "fat": 10
    },
    {
      "name": "Aveia",
      "quantity": 30,
      "unit": "g",
      "calories": 100,
      "protein": 2,
      "carbs": 20,
      "fat": 2
    }
  ],
  "totals": {
    "calories": 240,
    "protein": 14,
    "carbs": 21,
    "fat": 12
  }
}

REGRAS DE OURO:
1. NUNCA mande markdown, blocos de código, ou explicações
2. APENAS JSON puro, um após outro
3. Sem nenhum texto antes ou depois
4. Números sem aspas (quantity: 2, não "2")
5. Validar: totals.calories = soma exata dos foods
6. Unidades válidas: g, kg, ml, l, colher, colher de sopa, colher de chá, xícara, copo, unidade, unidades, filé, peito, fatia, fatias, pote, lata, pacote, porção, porções
7. Se pedir 5 refeições, mande 5 JSONs diferentes (breakfast, lunch, dinner, snack)
8. não repita os exemplos, pesquise e consulte os reais macros dos alimentos, siga somente a estrutura do exemplo correto, baseie se nos alimentos que a pessoa gosta para estruturar suas refeições e nos pedidos da pessoa


EXEMPLOS CORRETOS (não mande nada além disso):
{
  "meal_type": "breakfast",
  "name": "Café da Manhã",
  "description": "Proteína e carbos",
  "foods": [
    {"name": "Ovo", "quantity": 2, "unit": "unidade", "calories": 140, "protein": 12, "carbs": 1, "fat": 10}
  ],
  "totals": {"calories": 140, "protein": 12, "carbs": 1, "fat": 10}
}
{
  "meal_type": "lunch",
  "name": "Almoço",
  "description": "Frango com arroz",
  "foods": [
    {"name": "Frango", "quantity": 100, "unit": "g", "calories": 165, "protein": 31, "carbs": 0, "fat": 3}
  ],
  "totals": {"calories": 165, "protein": 31, "carbs": 0, "fat": 3}
}

SUA PERSONALIDADE:
- Amigável, motivador, sem julgamentos
- Baseado em ciência, não em mitos
- Prático: quer receitas fáceis? Tem! Quer fitness? Tem!
- Sempre oferece alternativas (vegetariano, sem glúten, etc)
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
        
        if (parsed.foods?.length > 0 && parsed.totals && parsed.totals.calories > 50) {
          meals.push(parsed);
          console.log("✅ JSON em ```json``` encontrado:", parsed.name);
        }
      } catch (e) {
        console.warn("⚠️ JSON em ```json``` inválido");
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
 */
export function calculateTDEE(params: {
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}): number {
  // Fórmula de Harris-Benedict
  let bmr: number;
  
  if (params.gender === 'male') {
    bmr = 88.362 + (13.397 * params.weight) + (4.799 * params.height) - (5.677 * params.age);
  } else {
    bmr = 447.593 + (9.247 * params.weight) + (3.098 * params.height) - (4.330 * params.age);
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
