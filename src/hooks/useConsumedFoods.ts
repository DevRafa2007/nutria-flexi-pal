/**
 * Hook para rastrear alimentos individuais consumidos
 * Permite marcação granular ao nível de alimento, não de refeição completa
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getLocalDateString, getTodayString } from '@/lib/dateUtils';

export interface ConsumedFood {
    id: string;
    user_id: string;
    meal_id: string;
    food_index: number;
    consumed_date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    created_at: string;
}

export interface TotalMacros {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export function useConsumedFoods() {
    const [consumedFoods, setConsumedFoods] = useState<ConsumedFood[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Carrega alimentos consumidos de um período
     */
    const loadConsumedFoods = useCallback(async (days: number = 30) => {
        try {
            setIsLoading(true);
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const { data, error } = await supabase
                .from('consumed_foods')
                .select('*')
                .eq('user_id', user.id)
                .gte('consumed_date', getLocalDateString(startDate))
                .order('consumed_date', { ascending: false });

            if (error) throw error;

            setConsumedFoods((data as ConsumedFood[]) || []);
        } catch (err) {
            console.error('Erro ao carregar alimentos consumidos:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Marca um alimento individual como consumido
     */
    const markFoodConsumed = useCallback(
        async (
            mealId: string,
            foodIndex: number,
            macros: { calories: number; protein: number; carbs: number; fat: number }
        ) => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user) return;

                const today = getTodayString();

                // Inserir ou atualizar (upsert) o alimento consumido
                const { error } = await supabase
                    .from('consumed_foods')
                    .upsert(
                        {
                            user_id: user.id,
                            meal_id: mealId,
                            food_index: foodIndex,
                            consumed_date: today,
                            calories: macros.calories,
                            protein: macros.protein,
                            carbs: macros.carbs,
                            fat: macros.fat,
                        },
                        {
                            onConflict: 'user_id,meal_id,food_index,consumed_date',
                        }
                    );

                if (error) throw error;

                // Recarregar dados
                await loadConsumedFoods();
            } catch (err) {
                console.error('Erro ao marcar alimento:', err);
                throw err;
            }
        },
        [loadConsumedFoods]
    );

    /**
     * Desmarca um alimento individual
     */
    const unmarkFoodConsumed = useCallback(
        async (mealId: string, foodIndex: number) => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user) return;

                const today = getTodayString();

                const { error } = await supabase
                    .from('consumed_foods')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('meal_id', mealId)
                    .eq('food_index', foodIndex)
                    .eq('consumed_date', today);

                if (error) throw error;

                // Recarregar dados
                await loadConsumedFoods();
            } catch (err) {
                console.error('Erro ao desmarcar alimento:', err);
                throw err;
            }
        },
        [loadConsumedFoods]
    );

    /**
     * Obtém alimentos consumidos de uma data específica
     */
    const getConsumedFoodsForDate = useCallback(
        (date: Date): ConsumedFood[] => {
            const dateStr = getLocalDateString(date);
            return consumedFoods.filter((cf) => cf.consumed_date === dateStr);
        },
        [consumedFoods]
    );

    /**
     * Calcula total de macros para uma data específica
     */
    const getTotalMacrosForDate = useCallback(
        (date: Date): TotalMacros => {
            const foodsForDate = getConsumedFoodsForDate(date);

            return foodsForDate.reduce(
                (totals, food) => ({
                    calories: totals.calories + (food.calories || 0),
                    protein: totals.protein + (food.protein || 0),
                    carbs: totals.carbs + (food.carbs || 0),
                    fat: totals.fat + (food.fat || 0),
                }),
                { calories: 0, protein: 0, carbs: 0, fat: 0 }
            );
        },
        [getConsumedFoodsForDate]
    );

    /**
     * Verifica se um alimento específico foi consumido hoje
     */
    const isFoodConsumedToday = useCallback(
        (mealId: string, foodIndex: number): boolean => {
            const today = getTodayString();
            return consumedFoods.some(
                (cf) =>
                    cf.meal_id === mealId &&
                    cf.food_index === foodIndex &&
                    cf.consumed_date === today
            );
        },
        [consumedFoods]
    );

    return {
        consumedFoods,
        isLoading,
        loadConsumedFoods,
        markFoodConsumed,
        unmarkFoodConsumed,
        getConsumedFoodsForDate,
        getTotalMacrosForDate,
        isFoodConsumedToday,
    };
}

export default useConsumedFoods;
