import { Meal } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Flame, Drumstick, Wheat, Droplets } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import useUserProfile from "@/hooks/useUserProfile";

interface MealPlanPreviewProps {
    meals: Meal[];
    onAccept: () => void;
    onReject: () => void;
}

export function MealPlanPreview({ meals, onAccept, onReject }: MealPlanPreviewProps) {
    const { profile } = useUserProfile();

    const totalCalories = meals.reduce((acc, meal) => acc + meal.totalMacros.calories, 0);
    const totalProtein = meals.reduce((acc, meal) => acc + meal.totalMacros.protein, 0);
    const totalCarbs = meals.reduce((acc, meal) => acc + meal.totalMacros.carbs, 0);
    const totalFat = meals.reduce((acc, meal) => acc + meal.totalMacros.fat, 0);

    // Calcular diferença com objetivo
    const targetCalories = profile?.target_calories || 2000;
    const diff = totalCalories - targetCalories;
    const diffPercent = (diff / targetCalories) * 100;
    const isWithinTarget = Math.abs(diffPercent) <= 5; // Dentro de 5% do objetivo

    const diffText = diff > 0
        ? `+${Math.round(diff)} acima`
        : diff < 0
            ? `${Math.round(Math.abs(diff))} abaixo`
            : 'no alvo';

    const diffColor = isWithinTarget
        ? 'text-green-600 dark:text-green-400'
        : Math.abs(diffPercent) > 10
            ? 'text-red-600 dark:text-red-400'
            : 'text-yellow-600 dark:text-yellow-400';

    return (
        <Card className="w-full bg-muted/30 border-primary/20 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <CardHeader className="bg-primary/5 pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <span className="text-xl">🥗</span> Plano Sugerido
                        </CardTitle>
                        <CardDescription>
                            {meals.length} refeições • {Math.round(totalCalories)} kcal ({<span className={diffColor}>{diffText}</span>} de {targetCalories} kcal)
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-background">Rascunho</Badge>
                </div>

                {/* Macro Summary */}
                <div className="grid grid-cols-4 gap-2 mt-4 text-xs sm:text-sm">
                    <div className="flex flex-col items-center p-2 bg-background rounded-lg border shadow-sm">
                        <Flame className="w-4 h-4 text-orange-500 mb-1" />
                        <span className="font-bold">{Math.round(totalCalories)}</span>
                        <span className="text-muted-foreground text-[10px]">kcal</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-background rounded-lg border shadow-sm">
                        <Drumstick className="w-4 h-4 text-blue-500 mb-1" />
                        <span className="font-bold">{Math.round(totalProtein)}g</span>
                        <span className="text-muted-foreground text-[10px]">prot</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-background rounded-lg border shadow-sm">
                        <Wheat className="w-4 h-4 text-yellow-500 mb-1" />
                        <span className="font-bold">{Math.round(totalCarbs)}g</span>
                        <span className="text-muted-foreground text-[10px]">carb</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-background rounded-lg border shadow-sm">
                        <Droplets className="w-4 h-4 text-red-500 mb-1" />
                        <span className="font-bold">{Math.round(totalFat)}g</span>
                        <span className="text-muted-foreground text-[10px]">gord</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
                {meals.map((meal, index) => (
                    <div key={index} className="flex gap-3 items-start p-3 bg-background/50 rounded-lg border border-border/50">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                            {index + 1}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-sm">{meal.name}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-1">{meal.description}</p>
                            <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                                <span>{Math.round(meal.totalMacros.calories)} kcal</span>
                                <span>•</span>
                                <span>{Math.round(meal.totalMacros.protein)}g P</span>
                                <span>{Math.round(meal.totalMacros.carbs)}g C</span>
                                <span>{Math.round(meal.totalMacros.fat)}g G</span>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>

            <CardFooter className="flex gap-3 bg-muted/50 p-4 border-t">
                <Button
                    variant="outline"
                    className="flex-1 border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    onClick={onReject}
                >
                    <X className="w-4 h-4 mr-2" />
                    Descartar
                </Button>
                <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={onAccept}
                >
                    <Check className="w-4 h-4 mr-2" />
                    Aceitar Plano
                </Button>
            </CardFooter>

            <div className="px-4 pb-2 text-center text-[10px] text-muted-foreground bg-muted/50">
                Para alterar algo, apenas peça no chat (ex: "troque o jantar por sopa")
            </div>
        </Card>
    );
}
