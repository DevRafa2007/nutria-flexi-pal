import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Meal, MeasurementUnit } from "@/lib/types";
import { convertMeasurement } from "@/lib/groqClient";
import { ChevronDown, ChevronUp, Copy, Check, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import useConsumptionTracking from "@/hooks/useConsumptionTracking";
import { useConsumedFoods } from "@/context/ConsumedFoodsContext";

interface MealDisplayProps {
  meal: Meal;
  mealId?: string;
  onUpdate?: (meal: Meal) => void;
  onDelete?: (mealId: string) => void;
}

const MealDisplay = ({ meal, mealId, onUpdate, onDelete }: MealDisplayProps) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState<Record<string, MeasurementUnit>>(
    meal.foods.reduce((acc, food, idx) => {
      acc[idx] = food.unit;
      return acc;
    }, {} as Record<string, MeasurementUnit>)
  );
  const [consumedFoods, setConsumedFoods] = useState<Set<number>>(new Set());
  const [allConsumed, setAllConsumed] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { markMealConsumed } = useConsumptionTracking();
  const { markFoodConsumed, unmarkFoodConsumed } = useConsumedFoods();

  const getMealTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      breakfast: "bg-yellow-100 text-yellow-800",
      lunch: "bg-blue-100 text-blue-800",
      snack: "bg-orange-100 text-orange-800",
      dinner: "bg-purple-100 text-purple-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getMealTypeName = (type: string) => {
    const names: Record<string, string> = {
      breakfast: "☀️ Café da Manhã",
      lunch: "🍽️ Almoço",
      snack: "🥜 Lanche",
      dinner: "🌙 Jantar",
    };
    return names[type] || type;
  };

  const handleUnitChange = (foodIndex: number, newUnit: MeasurementUnit) => {
    setSelectedUnits((prev) => ({
      ...prev,
      [foodIndex]: newUnit,
    }));
  };

  const getConvertedQuantity = (
    foodIndex: number,
    originalQuantity: number,
    originalUnit: MeasurementUnit
  ): number => {
    const newUnit = selectedUnits[foodIndex] || originalUnit;
    if (newUnit === originalUnit) return originalQuantity;

    // Simplificado: seria necessário type do alimento
    const conversion: Record<string, Record<string, number>> = {
      colher: { g: 15, xícara: 0.1, unidade: 1 },
      xícara: { g: 100, colher: 10, unidade: 1 },
      g: { colher: 0.067, xícara: 0.01, unidade: 1 },
      unidade: { g: 100, colher: 6.67, xícara: 1 },
      filé: { g: 150, colher: 10, xícara: 1 },
      peito: { g: 180, colher: 12, xícara: 1 },
    };

    const factor = conversion[originalUnit]?.[newUnit] || 1;
    return parseFloat((originalQuantity * factor).toFixed(2));
  };

  const copyToClipboard = () => {
    const text = `${getMealTypeName(meal.type)} - ${meal.name}
    
${meal.foods.map((food, idx) => `• ${food.name}: ${getConvertedQuantity(idx, food.quantity, food.unit)} ${selectedUnits[idx] || food.unit}`).join("\n")}

Macros Totais:
• Proteína: ${meal.totalMacros.protein}g
• Carboidratos: ${meal.totalMacros.carbs}g
• Gordura: ${meal.totalMacros.fat}g
• Calorias: ${meal.totalMacros.calories} kcal`;

    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const handleToggleFood = async (foodIndex: number) => {
    if (!mealId) return;

    const newSet = new Set(consumedFoods);
    const isCurrentlyConsumed = newSet.has(foodIndex);

    if (isCurrentlyConsumed) {
      newSet.delete(foodIndex);
      try {
        await unmarkFoodConsumed(mealId, foodIndex);
        toast.info("Alimento desmarcado");
      } catch (err) {
        console.error('Erro:', err);
      }
    } else {
      newSet.add(foodIndex);
      const food = meal.foods[foodIndex];
      try {
        await markFoodConsumed(mealId, foodIndex, {
          calories: food.macros.calories,
          protein: food.macros.protein,
          carbs: food.macros.carbs,
          fat: food.macros.fat,
        });
        toast.success("Alimento marcado!");
      } catch (err) {
        console.error('Erro:', err);
      }
    }

    setConsumedFoods(newSet);
    setAllConsumed(newSet.size === meal.foods.length);
  };

  const handleMarkAllConsumed = async () => {
    if (!mealId) {
      toast.error("ID da refeição não encontrado");
      return;
    }

    try {
      // Marcar todos os alimentos como consumidos individualmente
      const newSet = new Set<number>();

      // Criar promises para marcar cada alimento individualmente
      const foodPromises = meal.foods.map((food, index) => {
        newSet.add(index);
        return markFoodConsumed(mealId, index, {
          calories: food.macros.calories,
          protein: food.macros.protein,
          carbs: food.macros.carbs,
          fat: food.macros.fat,
        });
      });

      // Aguardar todos os alimentos serem marcados
      await Promise.all(foodPromises);

      setConsumedFoods(newSet);
      setAllConsumed(true);

      // Registrar consumo da refeição inteira (para streak)
      await markMealConsumed(mealId, 100);

      toast.success(`✅ "${meal.name}" marcada como consumida! 🔥`);
    } catch (err) {
      console.error("Erro ao marcar consumo:", err);
      toast.error("Erro ao registrar consumo");
    }
  };

  const handleDeleteMeal = async () => {
    if (!mealId) {
      toast.error("ID da refeição não encontrado");
      return;
    }

    try {
      setIsDeleting(true);

      // Deletar alimentos associados primeiro
      const { error: foodsError } = await supabase
        .from("meal_foods")
        .delete()
        .eq("meal_id", mealId);

      if (foodsError) throw foodsError;

      // Deletar a refeição
      const { error: mealError } = await supabase
        .from("meals")
        .delete()
        .eq("id", mealId);

      if (mealError) throw mealError;

      toast.success(`"${meal.name}" deletada com sucesso! 🗑️`);

      // Chamar callback se existir
      if (onDelete) {
        onDelete(mealId);
      }
    } catch (err) {
      console.error("Erro ao deletar refeição:", err);
      const errorMsg = err instanceof Error ? err.message : "Erro ao deletar refeição";
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <CardHeader
        className={`${getMealTypeColor(meal.type)} cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-lg">{getMealTypeName(meal.type)}</CardTitle>
              <p className="text-sm font-medium">{meal.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-bold">{meal.totalMacros.calories} kcal</div>
              <div className="text-xs opacity-75">
                P: {meal.totalMacros.protein}g | C: {meal.totalMacros.carbs}g | G:{" "}
                {meal.totalMacros.fat}g
              </div>
            </div>
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-4 space-y-4">
          {meal.description && (
            <p className="text-sm text-muted-foreground italic">{meal.description}</p>
          )}

          {/* Alimentos */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Alimentos:</h3>
            {meal.foods.map((food, idx) => (
              <div
                key={idx}
                className={`rounded-lg p-3 space-y-2 border transition-all ${consumedFoods.has(idx)
                  ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                  : "bg-muted/50 border-border/50"
                  }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={consumedFoods.has(idx)}
                    onCheckedChange={() => handleToggleFood(idx)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h4
                      className={`font-medium text-sm ${consumedFoods.has(idx)
                        ? "line-through text-green-700 dark:text-green-200"
                        : ""
                        }`}
                    >
                      {food.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">{food.macros.calories} kcal</p>
                  </div>
                </div>

                {/* Quantidade e Unidade */}
                <div className="flex items-center gap-2 ml-6">
                  <span className="text-sm font-medium">
                    {getConvertedQuantity(idx, food.quantity, food.unit).toFixed(2)}
                  </span>
                  <Select
                    value={selectedUnits[idx] || food.unit}
                    onValueChange={(newUnit) =>
                      handleUnitChange(idx, newUnit as MeasurementUnit)
                    }
                  >
                    <SelectTrigger className="w-fit h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">gramas</SelectItem>
                      <SelectItem value="colher">colheres</SelectItem>
                      <SelectItem value="xícara">xícaras</SelectItem>
                      <SelectItem value="unidade">unidade</SelectItem>
                      {["frango", "peito", "filé"].includes(food.name.toLowerCase()) && (
                        <>
                          <SelectItem value="filé">filé</SelectItem>
                          <SelectItem value="peito">peito</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Macros do Alimento */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-background/50 p-2 rounded">
                  <div>
                    <span className="text-muted-foreground">Proteína:</span> {food.macros.protein}g
                  </div>
                  <div>
                    <span className="text-muted-foreground">Carbs:</span> {food.macros.carbs}g
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gordura:</span> {food.macros.fat}g
                  </div>
                  <div>
                    <span className="text-muted-foreground">Calorias:</span> {food.macros.calories}
                    kcal
                  </div>
                </div>

                {food.notes && (
                  <p className="text-xs text-muted-foreground italic">📝 {food.notes}</p>
                )}
              </div>
            ))}
          </div>

          {/* Resumo de Macros */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-3">📊 Total de Macros</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="font-bold text-red-700">P</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Proteína</p>
                  <p className="font-bold">{meal.totalMacros.protein}g</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="font-bold text-blue-700">C</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Carboidratos</p>
                  <p className="font-bold">{meal.totalMacros.carbs}g</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="font-bold text-yellow-700">G</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gordura</p>
                  <p className="font-bold">{meal.totalMacros.fat}g</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="font-bold text-green-700">🔥</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Calorias</p>
                  <p className="font-bold">{meal.totalMacros.calories} kcal</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-2 border-t">
            {!allConsumed ? (
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="sm"
                onClick={handleMarkAllConsumed}
              >
                <Check className="w-4 h-4 mr-2" />
                Marcar como consumida
              </Button>
            ) : (
              <div className="flex-1 bg-green-100 border border-green-300 rounded-md flex items-center justify-center gap-2 text-green-700 font-semibold text-sm dark:bg-green-950/20 dark:border-green-900 dark:text-green-200">
                <Check className="w-4 h-4" />
                Refeição consumida! 🔥
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              title="Copiar para área de transferência"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              title="Deletar refeição"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Dialog de Confirmação para Deletar */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deletar refeição?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que quer deletar "{meal.name}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex gap-2">
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteMeal}
                  disabled={isDeleting}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isDeleting ? "Deletando..." : "Deletar"}
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      )}
    </Card>
  );
};

export default MealDisplay;
