import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Meal } from "@/lib/types";
import { toast } from "sonner";

export function useMeals() {
  const [meals, setMeals] = useState<(Meal & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMeals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Você precisa estar autenticado");
        return;
      }

      // Buscar refeições do usuário
      const { data: mealsData, error: mealsError } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (mealsError) throw mealsError;

      // Para cada refeição, buscar seus alimentos
      const mealsWithFoods: (Meal & { id: string })[] = [];

      for (const meal of mealsData || []) {
        const { data: foodsData, error: foodsError } = await supabase
          .from("meal_foods")
          .select("*")
          .eq("meal_id", meal.id);

        if (foodsError) throw foodsError;

        const mealWithFoods: Meal & { id: string } = {
          id: meal.id,
          name: meal.name,
          description: meal.description,
          type: meal.meal_type,
          foods: (foodsData || []).map((food) => ({
            name: food.food_name,
            quantity: food.quantity,
            unit: food.unit,
            macros: {
              protein: food.protein,
              carbs: food.carbs,
              fat: food.fat,
              calories: food.calories,
            },
            notes: food.notes,
          })),
          totalMacros: {
            protein: (foodsData || []).reduce((sum, f) => sum + (f.protein || 0), 0),
            carbs: (foodsData || []).reduce((sum, f) => sum + (f.carbs || 0), 0),
            fat: (foodsData || []).reduce((sum, f) => sum + (f.fat || 0), 0),
            calories: (foodsData || []).reduce((sum, f) => sum + (f.calories || 0), 0),
          },
        };

        mealsWithFoods.push(mealWithFoods);
      }

      setMeals(mealsWithFoods);
    } catch (err) {
      console.error("Erro ao carregar refeições:", err);
      const errorMsg = err instanceof Error ? err.message : "Erro ao carregar refeições";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  return {
    meals,
    isLoading,
    error,
    refreshMeals: loadMeals,
  };
}
