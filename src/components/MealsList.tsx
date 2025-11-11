import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MealDisplay from "@/components/MealDisplay";
import { Meal } from "@/lib/types";
import { AlertCircle, Utensils } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const MealsList = () => {
  const [meals, setMeals] = useState<(Meal & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
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
  };

  return (
    <div className="space-y-4">
      {error && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="p-4 flex gap-2">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Suas Refeições</h2>
        <Button onClick={loadMeals} className="gap-2">
          ↻ Atualizar
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-pulse flex flex-col items-center gap-2">
              <Utensils className="w-8 h-8 animate-spin text-primary" />
              <p>Carregando suas refeições...</p>
            </div>
          </CardContent>
        </Card>
      ) : meals.length === 0 ? (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <div className="space-y-3">
              <div className="text-4xl">🍽️</div>
              <h3 className="font-semibold text-lg">Nenhuma refeição ainda</h3>
              <p className="text-sm text-muted-foreground">
                Converse com a IA na aba "Monte sua Dieta" para criar sua primeira refeição personalizada!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {meals.map((meal) => (
            <MealDisplay key={meal.id} meal={meal} mealId={meal.id} />
          ))}
        </div>
      )}

      {/* Dicas */}
      <Card className="bg-primary/10 border-primary/30">
        <CardHeader>
          <CardTitle className="text-sm">✨ Sobre as Refeições</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>
            • <strong>Macros Totais:</strong> Soma de todas as calorias, proteína, carboidratos e
            gordura
          </p>
          <p>
            • <strong>Unidades Flexíveis:</strong> Converta entre gramas, colheres, xícaras e
            unidades
          </p>
          <p>
            • <strong>Alimentos Cozidos:</strong> Arroz, feijão e frango são medidos após o cozimento
          </p>
          <p>• <strong>Copiar Receita:</strong> Clique no botão copiar para compartilhar a refeição</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MealsList;
