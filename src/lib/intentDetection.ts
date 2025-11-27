/**
 * Intent Detection System
 * Detecta a intenção do usuário (criar, editar, substituir, ajustar, chat)
 */

export type UserIntent =
    | { type: 'create'; mealCount: number; mealTypes?: string[] }
    | { type: 'edit'; mealId: string; changes: string }
    | { type: 'substitute'; mealId: string; oldFood: string; newFood: string }
    | { type: 'adjust'; mealId: string; macro: 'proteina' | 'carboidrato' | 'gordura' | 'caloria'; amount: number; increase: boolean }
    | { type: 'chat' };

/**
 * Detecta intenção do usuário baseado na mensagem
 * @param message - Mensagem do usuário
 * @param mealsContext - Contexto com refeições existentes (contém IDs)
 * @returns Intenção detectada
 */
export function detectIntent(message: string, mealsContext: string): UserIntent {
    const lower = message.toLowerCase().trim();

    // ========== EDIÇÃO ==========

    // Edição com ID explícito: "edita o [ID: xxx]"
    const editWithIdMatch = lower.match(/edit[ae]?\s+(?:o\s+|a\s+)?\[?id:\s*([a-f0-9-]+)\]?/i);
    if (editWithIdMatch) {
        return { type: 'edit', mealId: editWithIdMatch[1], changes: message };
    }

    // Edição por nome: "edita o café da manhã" ou "muda a refeição 'X'"
    const editByNameMatch = lower.match(/(?:edit[ae]?|mud[ae]|alter[ae])\s+(?:o\s+|a\s+)?(?:refeição\s+)?[\"']?(.+?)[\"']?$/i);
    if (editByNameMatch) {
        const mealNameQuery = editByNameMatch[1].replace(/[\"']/g, '');
        // Procurar ID no contexto que contenha esse nome
        const lines = mealsContext.split('\n');
        for (const line of lines) {
            if (line.toLowerCase().includes(mealNameQuery.toLowerCase())) {
                const idMatch = line.match(/\[ID:\s*([a-f0-9-]+)\]/);
                if (idMatch) {
                    return { type: 'edit', mealId: idMatch[1], changes: message };
                }
            }
        }
    }

    // ========== SUBSTITUIÇÃO ==========

    // "substitui X por Y" ou "troca X por Y"
    const substituteMatch = lower.match(/(?:substitu[íi]|troca?)[re]?\s+(?:o\s+|a\s+)?(.+?)\s+por\s+(.+?)(?:\s+na|\s+no|\s+em|$)/i);
    if (substituteMatch) {
        const oldFood = substituteMatch[1].trim();
        const newFood = substituteMatch[2].trim();

        // Procurar ID da refeição mencionada no contexto ou na própria mensagem
        const words = message.split(/\s+/);
        for (const word of words) {
            const cleanWord = word.replace(/[^\w\s]/gi, '');
            if (cleanWord.length > 3) {
                const idRegex = new RegExp(`\\[ID:\\s*([a-f0-9-]+)\\][^\\n]*${cleanWord}`, 'i');
                const match = mealsContext.match(idRegex);
                if (match) {
                    return {
                        type: 'substitute',
                        mealId: match[1],
                        oldFood,
                        newFood
                    };
                }
            }
        }
    }

    // ========== AJUSTE DE MACROS ==========

    // "aumenta proteína em X" ou "diminui carboidrato em Y"
    const adjustMatch = lower.match(/(aumenta?|diminui?|reduz)\s+(prote[íi]na|carboidrato|gordura|caloria)s?\s+(?:em\s+)?(\d+)/i);
    if (adjustMatch) {
        const action = adjustMatch[1];
        const macro = adjustMatch[2];
        const amount = parseInt(adjustMatch[3]);
        const increase = action.startsWith('aument');

        // Normalizar nome do macro
        let macroNormalized: 'proteina' | 'carboidrato' | 'gordura' | 'caloria' = 'proteina';
        if (macro.includes('carb')) macroNormalized = 'carboidrato';
        else if (macro.includes('gord')) macroNormalized = 'gordura';
        else if (macro.includes('calor')) macroNormalized = 'caloria';

        // Buscar última refeição mencionada no contexto
        const lastMealMatch = mealsContext.match(/\[ID:\s*([a-f0-9-]+)\]/);
        if (lastMealMatch) {
            return {
                type: 'adjust',
                mealId: lastMealMatch[1],
                macro: macroNormalized,
                amount,
                increase
            };
        }
    }

    // ========== CRIAÇÃO ==========

    // "cria 5 refeições" ou "faz um plano do dia"
    const createWithCountMatch = lower.match(/(?:cri[ae]|faz|ger[ae])\s+(?:um\s+)?(\d+)\s+(?:refeições?|refeiç)/i);
    if (createWithCountMatch) {
        const count = parseInt(createWithCountMatch[1]);
        return { type: 'create', mealCount: count };
    }

    // "cria um café da manhã" ou "faz um almoço"
    const createSpecificMatch = lower.match(/(?:cri[ae]|faz|ger[ae])\s+(?:um[ae]?\s+)?(café|almoço|jantar|lanche)/i);
    if (createSpecificMatch) {
        const mealTypeMap: Record<string, string> = {
            'café': 'breakfast',
            'almoço': 'lunch',
            'jantar': 'dinner',
            'lanche': 'snack'
        };
        const mealType = mealTypeMap[createSpecificMatch[1]];
        return { type: 'create', mealCount: 1, mealTypes: [mealType] };
    }

    // Genérico: "cria", "faz", "gera" sozinho
    if (/(cri[ae]|faz|ger[ae])\s+(refeição|plano|dieta)/i.test(lower)) {
        return { type: 'create', mealCount: 1 };
    }

    // ========== CHAT (padrão) ==========
    return { type: 'chat' };
}

/**
 * Gera prompt específico baseado na intenção
 */
export function generateIntentPrompt(intent: UserIntent): string {
    switch (intent.type) {
        case 'edit':
            return `\n\n⚠️ MODO EDIÇÃO ATIVADO\nO usuário quer EDITAR a refeição [ID: ${intent.mealId}].\nMudanças solicitadas: ${intent.changes}\n\nRESPONDA com JSON incluindo "action": "edit" e "meal_id": "${intent.mealId}"`;

        case 'substitute':
            return `\n\n⚠️ MODO SUBSTITUIÇÃO\nSubstituir "${intent.oldFood}" por "${intent.newFood}" na refeição [ID: ${intent.mealId}].\nMANTENHA macros similares ajustando a quantidade.`;

        case 'adjust':
            return `\n\n⚠️ MODO AJUSTE\n${intent.increase ? 'AUMENTAR' : 'DIMINUIR'} ${intent.macro} em ${intent.amount}${intent.macro === 'caloria' ? 'kcal' : 'g'} na refeição [ID: ${intent.mealId}].`;

        case 'create':
            if (intent.mealTypes && intent.mealTypes.length > 0) {
                return `\n\n⚠️ CRIAR ${intent.mealTypes[0].toUpperCase()}`;
            }
            return intent.mealCount > 1 ? `\n\n⚠️ CRIAR ${intent.mealCount} REFEIÇÕES` : '';

        default:
            return '';
    }
}
