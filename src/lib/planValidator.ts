import { Meal } from './types';

export interface UserProfile {
    meals_per_day?: number;
    target_calories?: number;
    target_protein?: number;
    target_carbs?: number;
    target_fat?: number;
}

export interface PlanValidation {
    valid: boolean;
    errors: string[];
    warnings: string[];
    totalCalories: number;
    targetCalories: number;
    variance: number; // diferença em %
}

/**
 * Valida um plano alimentar completo
 * Verifica se o número de refeições, calorias totais e macros estão corretos
 */
export function validateMealPlan(
    meals: Meal[],
    profile: UserProfile | null
): PlanValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validação 1: Número de refeições
    const expectedMeals = profile?.meals_per_day || 3;
    if (meals.length !== expectedMeals) {
        warnings.push(`Plan has ${meals.length} meals, but profile indicates ${expectedMeals}`);
    }

    // Validação 2: Calorias totais
    const totalCalories = meals.reduce((sum, m) => sum + m.totalMacros.calories, 0);
    const targetCalories = profile?.target_calories || 2000;
    const variance = ((totalCalories - targetCalories) / targetCalories) * 100;

    if (Math.abs(variance) > 10) { // mais de 10% de diferença
        errors.push(`Total calories (${Math.round(totalCalories)}) differ significantly from target (${targetCalories})`);
    } else if (Math.abs(variance) > 5) {
        warnings.push(`Total calories (${Math.round(totalCalories)}) are ${Math.round(variance)}% ${variance > 0 ? 'above' : 'below'} target`);
    }

    // Validação 3: Cada refeição deve ter calorias mínimas
    meals.forEach((meal, idx) => {
        if (meal.totalMacros.calories < 100) {
            errors.push(`Meal ${idx + 1} (${meal.name}) has very low calories (${Math.round(meal.totalMacros.calories)} kcal)`);
        }

        // Validar que tem alimentos
        if (!meal.foods || meal.foods.length === 0) {
            errors.push(`Meal ${idx + 1} (${meal.name}) has no foods`);
        }
    });

    // Validação 4: Macros totais devem fazer sentido com calorias
    const totalProtein = meals.reduce((sum, m) => sum + m.totalMacros.protein, 0);
    const totalCarbs = meals.reduce((sum, m) => sum + m.totalMacros.carbs, 0);
    const totalFat = meals.reduce((sum, m) => sum + m.totalMacros.fat, 0);

    // 1g proteína = 4kcal, 1g carbs = 4kcal, 1g fat = 9kcal
    const calculatedCalories = (totalProtein * 4) + (totalCarbs * 4) + (totalFat * 9);
    const caloriesDiff = Math.abs(calculatedCalories - totalCalories);

    if (caloriesDiff > 100) {
        warnings.push(`Macros do not match total calories (difference: ${Math.round(caloriesDiff)} kcal)`);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        totalCalories,
        targetCalories,
        variance
    };
}

/**
 * Recalcula plano após edição de uma refeição
 * Ajusta proporcionalmente as outras refeições para manter o total calórico
 */
export function recalculatePlanAfterEdit(
    originalPlan: Meal[],
    editedMeal: Meal,
    targetCalories: number
): Meal[] {
    // Encontrar a refeição editada e calcular diferença calórica
    const mealIndex = originalPlan.findIndex(m =>
        m.id === editedMeal.id || m.type === editedMeal.type
    );

    if (mealIndex === -1) {
        console.warn('[recalculatePlanAfterEdit] Meal not found in plan, returning original');
        return originalPlan;
    }

    const originalMealCals = originalPlan[mealIndex].totalMacros.calories;
    const newMealCals = editedMeal.totalMacros.calories;
    const caloriesDiff = newMealCals - originalMealCals;

    console.log(`[recalculatePlanAfterEdit] Calorie difference: ${Math.round(caloriesDiff)} kcal`);

    // Se diferença é pequena (< 50 kcal), não ajustar outras refeições
    if (Math.abs(caloriesDiff) < 50) {
        const newPlan = [...originalPlan];
        newPlan[mealIndex] = editedMeal;
        console.log('[recalculatePlanAfterEdit] Small difference, only replacing meal');
        return newPlan;
    }

    // Distribuir diferença nas outras refeições
    const otherMealsCount = originalPlan.length - 1;
    if (otherMealsCount === 0) {
        // Só tem uma refeição, não podemos ajustar outras
        return [editedMeal];
    }

    const adjustmentPerMeal = -caloriesDiff / otherMealsCount;
    console.log(`[recalculatePlanAfterEdit] Adjusting ${otherMealsCount} meals by ${Math.round(adjustmentPerMeal)} kcal each`);

    const newPlan = originalPlan.map((meal, idx) => {
        if (idx === mealIndex) {
            return editedMeal;
        }

        // Calcular fator de ajuste (evitar divisão por zero)
        const currentCals = meal.totalMacros.calories;
        if (currentCals < 10) {
            console.warn(`[recalculatePlanAfterEdit] Meal ${meal.name} has very low calories, skipping adjustment`);
            return meal;
        }

        const newCals = currentCals + adjustmentPerMeal;
        const factor = newCals / currentCals;

        // Não permitir redução maior que 50% ou aumento maior que 200%
        const safeFactor = Math.max(0.5, Math.min(2.0, factor));

        if (safeFactor !== factor) {
            console.warn(`[recalculatePlanAfterEdit] Factor ${factor} limited to ${safeFactor} for meal ${meal.name}`);
        }

        return {
            ...meal,
            foods: meal.foods.map(food => ({
                ...food,
                quantity: Math.round(food.quantity * safeFactor * 100) / 100, // 2 casas decimais
                macros: {
                    calories: Math.round(food.macros.calories * safeFactor),
                    protein: Math.round(food.macros.protein * safeFactor * 10) / 10, // 1 casa decimal
                    carbs: Math.round(food.macros.carbs * safeFactor * 10) / 10,
                    fat: Math.round(food.macros.fat * safeFactor * 10) / 10,
                }
            })),
            totalMacros: {
                calories: Math.round(meal.totalMacros.calories * safeFactor),
                protein: Math.round(meal.totalMacros.protein * safeFactor * 10) / 10,
                carbs: Math.round(meal.totalMacros.carbs * safeFactor * 10) / 10,
                fat: Math.round(meal.totalMacros.fat * safeFactor * 10) / 10,
            }
        };
    });

    return newPlan;
}

/**
 * Verifica se uma mensagem do usuário solicita um plano completo
 */
export function isFullPlanRequest(message: string): boolean {
    const lowerMsg = message.toLowerCase().trim();

    const fullPlanTriggers = [
        'plano do dia', 'plan do de hoje', 'plano',
        'dieta do dia', 'dieta de hoje', 'dieta',
        'minhas refeições', 'cria refeições', 'faz refeições',
        'monta meu plano', 'monta minha dieta',
        'cardápio', 'menu do dia'
    ];

    // Verificar triggers de string
    const hasStringTrigger = fullPlanTriggers.some(trigger => lowerMsg.includes(trigger));

    // Verificar padrões com número (ex: "cria 4 refeições", "faz 5 refeições")
    const hasNumberPattern = /(?:cria|faz|monta|gera)\s+\d+\s+(?:refeições|refeicoes)/.test(lowerMsg);

    return hasStringTrigger || hasNumberPattern;
}

/**
 * Extrai o número de refeições solicitadas da mensagem
 * Retorna null se não especificado
 */
export function extractMealCount(message: string): number | null {
    const match = message.match(/(\d+)\s+(?:refeições|refeicoes)/i);
    if (match) {
        const count = parseInt(match[1]);
        if (count >= 1 && count <= 6) {
            return count;
        }
    }
    return null;
}

/**
 * Ajusta as quantidades dos alimentos proporcionalmente para atingir as calorias target
 * @param meals - Array de refeições geradas pela IA
 * @param targetCalories - Calorias alvo do usuário
 * @returns Refeições com quantidades ajustadas
 */
export function scaleMealsToTarget(meals: Meal[], targetCalories: number): Meal[] {
    // Calcular calorias atuais
    const currentCalories = meals.reduce((sum, m) => sum + m.totalMacros.calories, 0);

    // Se já está dentro de 5% do target, não precisa ajustar
    const variance = Math.abs((currentCalories - targetCalories) / targetCalories);
    if (variance <= 0.05) {
        console.log(`✅ [scaleMealsToTarget] Já está dentro do target (${Math.round(currentCalories)} / ${targetCalories} kcal)`);
        return meals;
    }

    // Calcular fator de escala
    const scaleFactor = targetCalories / currentCalories;
    console.log(`🔄 [scaleMealsToTarget] Escalando de ${Math.round(currentCalories)} para ${targetCalories} kcal (fator: ${scaleFactor.toFixed(2)})`);

    // Aplicar escala a cada refeição
    return meals.map(meal => {
        // Escalar quantidade dos alimentos
        const scaledFoods = meal.foods.map(food => ({
            ...food,
            quantity: Math.round(food.quantity * scaleFactor),
            macros: {
                calories: Math.round(food.macros.calories * scaleFactor),
                protein: Math.round(food.macros.protein * scaleFactor * 10) / 10,
                carbs: Math.round(food.macros.carbs * scaleFactor * 10) / 10,
                fat: Math.round(food.macros.fat * scaleFactor * 10) / 10
            }
        }));

        // Recalcular totais da refeição
        const scaledTotals = {
            calories: scaledFoods.reduce((sum, f) => sum + f.macros.calories, 0),
            protein: scaledFoods.reduce((sum, f) => sum + f.macros.protein, 0),
            carbs: scaledFoods.reduce((sum, f) => sum + f.macros.carbs, 0),
            fat: scaledFoods.reduce((sum, f) => sum + f.macros.fat, 0)
        };

        // Gerar descrição automática baseada nos alimentos
        const autoDescription = scaledFoods
            .map(f => `${f.quantity}g ${f.name}`)
            .join(', ');

        return {
            ...meal,
            foods: scaledFoods,
            totalMacros: scaledTotals,
            description: autoDescription || meal.description
        };
    });
}
