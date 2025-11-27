/**
 * Meal Validator
 * Valida refeições para garantir dados corretos e realistas
 */

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    score: number; // 0-100 (qualidade da refeição)
}

const VALID_UNITS = ['g', 'kg', 'ml', 'l', 'colher', 'colher de sopa', 'colher de chá', 'xícara', 'copo', 'unidade', 'unidades', 'filé', 'peito', 'fatia', 'fatias', 'pote', 'lata', 'pacote', 'porção', 'porções'];
const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

/**
 * Valida estrutura e valores de uma refeição
 * @param meal - Refeição a validar
 * @returns Resultado da validação com erros e warnings
 */
export function validateMeal(meal: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // ========== VALIDAÇÕES OBRIGATÓRIAS ==========

    // Nome
    if (!meal.name || typeof meal.name !== 'string' || meal.name.trim().length === 0) {
        errors.push("Nome da refeição ausente ou inválido");
        score -= 20;
    } else if (meal.name.length > 100) {
        warnings.push("Nome muito longo (>100 caracteres)");
        score -= 5;
    }

    // Tipo
    if (!meal.meal_type || !VALID_MEAL_TYPES.includes(meal.meal_type)) {
        errors.push(`Tipo de refeição inválido: "${meal.meal_type}". Use: breakfast, lunch, dinner, ou snack`);
        score -= 20;
    }

    // Foods array
    if (!Array.isArray(meal.foods)) {
        errors.push("Campo 'foods' deve ser um array");
        score -= 30;
    } else if (meal.foods.length === 0) {
        errors.push("Refeição sem alimentos");
        score -= 30;
    } else if (meal.foods.length > 20) {
        warnings.push(`Muitos alimentos (${meal.foods.length}). Considere simplificar.`);
        score -= 10;
    }

    // ========== VALIDAÇÃO DE FOODS ==========

    if (Array.isArray(meal.foods)) {
        meal.foods.forEach((food: any, idx: number) => {
            const foodLabel = food.name || `Alimento ${idx + 1}`;

            // Nome do alimento
            if (!food.name || food.name.trim().length === 0) {
                errors.push(`${foodLabel}: nome ausente`);
                score -= 10;
            }

            // Quantidade
            if (typeof food.quantity !== 'number') {
                errors.push(`${foodLabel}: quantidade deve ser número`);
                score -= 10;
            } else if (food.quantity <= 0) {
                errors.push(`${foodLabel}: quantidade deve ser > 0`);
                score -= 10;
            } else if (food.quantity > 5000) {
                warnings.push(`${foodLabel}: quantidade muito alta (${food.quantity}). Verifique unidade.`);
                score -= 5;
            }

            // Unidade
            if (!food.unit || food.unit.trim().length === 0) {
                errors.push(`${foodLabel}: unidade ausente`);
                score -= 10;
            } else if (!VALID_UNITS.includes(food.unit.toLowerCase())) {
                warnings.push(`${foodLabel}: unidade "${food.unit}" não é padrão`);
                score -= 2;
            }

            // Macros realistas
            if (typeof food.protein !== 'number' || food.protein < 0) {
                errors.push(`${foodLabel}: proteína inválida`);
                score -= 10;
            } else if (food.protein > 100) {
                warnings.push(`${foodLabel}: proteína muito alta (${food.protein}g). Máximo realista: ~100g`);
                score -= 5;
            }

            if (typeof food.carbs !== 'number' || food.carbs < 0) {
                errors.push(`${foodLabel}: carboidratos inválidos`);
                score -= 10;
            } else if (food.carbs > 300) {
                warnings.push(`${foodLabel}: carboidratos muito altos (${food.carbs}g)`);
                score -= 5;
            }

            if (typeof food.fat !== 'number' || food.fat < 0) {
                errors.push(`${foodLabel}: gordura inválida`);
                score -= 10;
            } else if (food.fat > 100) {
                warnings.push(`${foodLabel}: gordura muito alta (${food.fat}g)`);
                score -= 5;
            }

            if (typeof food.calories !== 'number' || food.calories < 0) {
                errors.push(`${foodLabel}: calorias inválidas`);
                score -= 10;
            } else if (food.calories < 5) {
                warnings.push(`${foodLabel}: calorias muito baixas (${food.calories}kcal)`);
                score -= 3;
            } else if (food.calories > 2000) {
                warnings.push(`${foodLabel}: calorias muito altas (${food.calories}kcal) para um alimento`);
                score -= 5;
            }

            // Validar regra 4-4-9 (aprox)
            const estimatedCalories = (food.protein * 4) + (food.carbs * 4) + (food.fat * 9);
            const diff = Math.abs(estimatedCalories - food.calories);
            if (diff > food.calories * 0.20) { // >20% de diferença
                warnings.push(`${foodLabel}: calorias declaradas (${food.calories}) diferem muito do cálculo (${Math.round(estimatedCalories)}). Verifique macros.`);
                score -= 3;
            }
        });
    }

    // ========== VALIDAÇÃO DE TOTALS ==========

    if (meal.totals && Array.isArray(meal.foods) && meal.foods.length > 0) {
        const calculated = meal.foods.reduce((sum: any, f: any) => ({
            calories: sum.calories + (f.calories || 0),
            protein: sum.protein + (f.protein || 0),
            carbs: sum.carbs + (f.carbs || 0),
            fat: sum.fat + (f.fat || 0)
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

        const tolerance = 10; // ±10 kcal/g

        if (Math.abs(meal.totals.calories - calculated.calories) > tolerance) {
            warnings.push(`Totais não batem: declarado ${meal.totals.calories}kcal, calculado ${Math.round(calculated.calories)}kcal`);
            score -= 8;
        }

        if (Math.abs(meal.totals.protein - calculated.protein) > tolerance) {
            warnings.push(`Proteína total não bate: declarado ${meal.totals.protein}g, calculado ${Math.round(calculated.protein)}g`);
            score -= 5;
        }

        if (Math.abs(meal.totals.carbs - calculated.carbs) > tolerance) {
            warnings.push(`Carboidratos totais não batem: declarado ${meal.totals.carbs}g, calculado ${Math.round(calculated.carbs)}g`);
            score -= 5;
        }

        if (Math.abs(meal.totals.fat - calculated.fat) > tolerance) {
            warnings.push(`Gordura total não bate: declarado ${meal.totals.fat}g, calculado ${Math.round(calculated.fat)}g`);
            score -= 5;
        }
    } else if (!meal.totals) {
        warnings.push("Campo 'totals' ausente");
        score -= 5;
    }

    // ========== SCORE FINAL ==========
    score = Math.max(0, Math.min(100, score));

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        score
    };
}

/**
 * Valida e corrige automaticamente totals se possível
 */
export function autoCorrectTotals(meal: any): any {
    if (!Array.isArray(meal.foods) || meal.foods.length === 0) {
        return meal;
    }

    const calculated = meal.foods.reduce((sum: any, f: any) => ({
        calories: sum.calories + (f.calories || 0),
        protein: sum.protein + (f.protein || 0),
        carbs: sum.carbs + (f.carbs || 0),
        fat: sum.fat + (f.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    return {
        ...meal,
        totals: {
            calories: Math.round(calculated.calories),
            protein: Math.round(calculated.protein),
            carbs: Math.round(calculated.carbs),
            fat: Math.round(calculated.fat)
        }
    };
}
