/**
 * Meal Distribution Calculator
 * Distribui macros do perfil do usuário entre as refeições do dia
 */

export interface MealTargets {
    breakfast: { calories: number; protein: number; carbs: number; fat: number };
    lunch: { calories: number; protein: number; carbs: number; fat: number };
    dinner: { calories: number; protein: number; carbs: number; fat: number };
    snack: { calories: number; protein: number; carbs: number; fat: number };
}

/**
 * Calcula distribuição de macros por refeição baseado em evidências científicas
 * @param targetCalories - Meta de calorias totais do dia
 * @param targetProtein - Meta de proteína total do dia (g)
 * @param targetCarbs - Meta de carboidratos total do dia (g)
 * @param targetFat - Meta de gordura total do dia (g)
 * @param mealsPerDay - Número de refeições por dia (3, 4, ou 5)
 * @returns Distribuição de macros por tipo de refeição
 */
export function calculateMealDistribution(
    targetCalories: number,
    targetProtein: number,
    targetCarbs: number,
    targetFat: number,
    mealsPerDay: number = 3
): MealTargets {
    // Distribuições baseadas em evidências (Kerksick et al., 2017 - JISSN)
    // 3 refeições: café 30%, almoço 45%, jantar 25%
    // 4 refeições: café 25%, almoço 35%, jantar 30%, lanche 10%
    // 5 refeições: café 20%, almoço 30%, jantar 25%, lanches 25% (dividido)
    const distributions: Record<number, { breakfast: number; lunch: number; dinner: number; snack: number }> = {
        3: { breakfast: 0.30, lunch: 0.45, dinner: 0.25, snack: 0 },
        4: { breakfast: 0.25, lunch: 0.35, dinner: 0.30, snack: 0.10 },
        5: { breakfast: 0.20, lunch: 0.30, dinner: 0.25, snack: 0.25 }
    };

    const dist = distributions[mealsPerDay] || distributions[3];

    return {
        breakfast: {
            calories: Math.round(targetCalories * dist.breakfast),
            protein: Math.round(targetProtein * dist.breakfast),
            carbs: Math.round(targetCarbs * dist.breakfast),
            fat: Math.round(targetFat * dist.breakfast)
        },
        lunch: {
            calories: Math.round(targetCalories * dist.lunch),
            protein: Math.round(targetProtein * dist.lunch),
            carbs: Math.round(targetCarbs * dist.lunch),
            fat: Math.round(targetFat * dist.lunch)
        },
        dinner: {
            calories: Math.round(targetCalories * dist.dinner),
            protein: Math.round(targetProtein * dist.dinner),
            carbs: Math.round(targetCarbs * dist.dinner),
            fat: Math.round(targetFat * dist.dinner)
        },
        snack: {
            calories: Math.round(targetCalories * dist.snack),
            protein: Math.round(targetProtein * dist.snack),
            carbs: Math.round(targetCarbs * dist.snack),
            fat: Math.round(targetFat * dist.snack)
        }
    };
}

/**
 * Formata os targets de uma refeição para exibição
 */
export function formatMealTargets(mealType: keyof MealTargets, targets: MealTargets): string {
    const meal = targets[mealType];
    return `${meal.calories}kcal | ${meal.protein}g prot | ${meal.carbs}g carb | ${meal.fat}g gord`;
}
