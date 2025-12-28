import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MealDisplay from "@/components/MealDisplay";
import { Meal } from "@/lib/types";
import { AlertCircle, Utensils, Sparkles } from "lucide-react";
import { useMeals } from "@/hooks/useMeals";

interface MealsListProps {
  onRequestTutorial?: () => void;
}

const MealsList = ({ onRequestTutorial }: MealsListProps) => {
  const { meals: allMeals, isLoading, error, refreshMeals } = useMeals();
  const [meals, setMeals] = useState<(Meal & { id: string })[]>([]);

  /**
   * Remove refeições duplicadas, mantendo apenas a mais recente de cada tipo
   * Ex: 2 "cafés da manhã" → mantém apenas o mais recente
   */
  const deduplicateMeals = (allMeals: (Meal & { id: string })[]) => {
    const mealsByType = new Map<string, Meal & { id: string }>();

    // Percorrer de trás para frente (mais recentes primeiro)
    for (let i = allMeals.length - 1; i >= 0; i--) {
      const meal = allMeals[i];
      const mealType = meal.type || "unknown";

      // Se ainda não temos essa tipo de refeição, adicionar (é a mais recente)
      if (!mealsByType.has(mealType)) {
        mealsByType.set(mealType, meal);
      }
    }

    // Retornar na ordem original (cronológica reversa)
    return Array.from(mealsByType.values()).sort(
      (a, b) => new Date(b.id).getTime() - new Date(a.id).getTime()
    );
  };

  useEffect(() => {
    if (allMeals.length > 0) {
      setMeals(deduplicateMeals(allMeals));
    } else {
      setMeals([]);
    }
  }, [allMeals]);

  // Escutar evento de atualização de refeições do ChatAI
  useEffect(() => {
    const handleMealUpdate = () => {
      console.log('[MealsList] Evento mealUpdated recebido, recarregando...');
      refreshMeals();
    };

    window.addEventListener('mealUpdated', handleMealUpdate);

    return () => {
      window.removeEventListener('mealUpdated', handleMealUpdate);
    };
  }, [refreshMeals]);

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
        <Button onClick={refreshMeals} className="gap-2">
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
            <div className="space-y-4">
              <div className="text-4xl">🍽️</div>
              <h3 className="font-semibold text-lg">Nenhuma refeição ainda</h3>
              <p className="text-sm text-muted-foreground">
                Converse com a IA na aba "Monte sua Dieta" para criar sua primeira refeição personalizada!
              </p>
              {onRequestTutorial && (
                <Button
                  onClick={onRequestTutorial}
                  className="w-full gap-2 mt-4"
                  variant="default"
                >
                  <Sparkles className="w-4 h-4" />
                  Ver Tutorial de Refeição
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {meals.map((meal) => (
            <MealDisplay
              key={meal.id}
              meal={meal}
              mealId={meal.id}
              onDelete={(deletedId) => {
                // Remover refeição da lista localmente e recarregar
                setMeals(meals.filter(m => m.id !== deletedId));
                refreshMeals();
              }}
            />
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
