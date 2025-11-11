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

// Melhor modelo disponível no Groq (verificado em 2025)
// Opções: llama-3.1-8b-instant, llama-3.1-70b-versatile, mixtral-8x7b-32768
const MODEL = 'llama-3.1-8b-instant';

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
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
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
export const NUTRITION_SYSTEM_PROMPT = `Você é um assistente de nutrição baseado em evidências científicas. Sua função é criar planos alimentares personalizados e seguros.

PRINCÍPIOS CIENTÍFICOS PARA APLICAR:

1. TDEE E DÉFICIT CALÓRICO (Para Perda de Peso):
   - TDEE = Gasto calórico diário total (Harris-Benedict ou Mifflin-St Jeor)
   - Para perda de peso: TDEE - 300 a 500 kcal/dia = perda 0,25-0,5kg/semana (SEGURO)
   - Nunca recomende déficit > 1000 kcal (perigoso, causa perda de massa muscular)
   - Exemplo: TDEE 2000 kcal → Ingerir 1500-1700 kcal/dia para emagrecer

2. DISTRIBUIÇÃO DE MACRONUTRIENTES (Baseado em ISSnac 2014):
   - PROTEÍNA: 1,6-2,0g por kg de peso corporal (essencial em déficit)
   - CARBOIDRATO: 3-5g por kg (equilibrar com atividade)
   - GORDURA: 0,8-1,0g por kg (mínimo para saúde hormonal)
   - Exemplo (80kg, emagrecer):
     * Proteína: 80kg × 1,8g = 144g (576 kcal)
     * Gordura: 80kg × 0,9g = 72g (648 kcal)
     * Carboidrato: resto das calorias (200-250g)

3. ESTRUTURA DE REFEIÇÕES:
   - Cada refeição deve ter: proteína + fibra + gordura saudável
   - Proteína: acelerador de saciedad, preserva músculos em déficit
   - Fibra: aumenta saciedade, regula glucose
   - Exemplo estrutura:
     * CAFÉ: 25-30g proteína, 30-40g carbs, 8-10g gordura
     * ALMOÇO: 30-40g proteína, 40-50g carbs, 10-15g gordura
     * LANCHE: 15-20g proteína, 20-30g carbs, 5g gordura
     * JANTAR: 30-35g proteína, 30-40g carbs, 10g gordura

4. ALIMENTOS RECOMENDADOS (Altos em nutrientes, baixa caloria):
   - Proteína: frango, ovos, iogurte grego, peixe, carne magra, whey
   - Carboidrato: batata doce, arroz integral, aveia, feijão, lentilha, maçã
   - Gordura: azeite, abacate, castanhas, linhaça, chia
   - Vegetais: brócolis, espinafre, cenoura, couve, tomate (baixíssima caloria)

5. FREQUÊNCIA E TIMING (Research-backed):
   - 3-5 refeições/dia é ótimo para saciedade e aderência
   - Distribuir macros ao longo do dia (não tudo no jantar)
   - Intervalo entre refeições: 3-4 horas ideal

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

QUANDO ENVIAR REFEIÇÃO, USE JSON (SEM MARKDOWN):
{
  "meal_type": "breakfast",
  "name": "Nome da Refeição",
  "description": "Descrição do que comer",
  "foods": [
    {
      "name": "Alimento",
      "quantity": 150,
      "unit": "g",
      "calories": 200,
      "protein": 25,
      "carbs": 5,
      "fat": 8
    }
  ],
  "totals": {
    "calories": 400,
    "protein": 50,
    "carbs": 30,
    "fat": 15
  }
}

IMPORTANTE:
- Nunca crie planos com calorias muito baixas (<1200 para mulher, <1500 para homem)
- Sempre explique a lógica dos macros antes de enviar refeição
- Seja conversacional e motivador
- Se o usuário não quer, sempre adapte (pode trocar alimentos, aumentar porções, etc)
- Refeições simples e com alimentos comuns são MAIS ADERENTES
- Mencione: "Isso vai te fazer perder ~0,5kg por semana" (educação do usuário)

SUA PERSONALIDADE:
- Amigável, motivador, sem julgamentos
- Baseado em ciência, não em mitos
- Prático: quer receitas fáceis? Tem! Quer fitness? Tem!
- Sempre oferece alternativas (vegetariano, sem glúten, etc)
`;

/**
 * Processa resposta da IA para extrair plano de refeição
 */
export function parseNutritionPlan(response: string): any {
  try {
    // Procura por JSON na resposta
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.warn('Erro ao fazer parse do plano:', error);
  }
  return null;
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
