import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useConsumedFoods } from "@/context/ConsumedFoodsContext";

const MacroProgress = () => {
    const { profile } = useUserProfile();
    const { getTotalMacrosForDate } = useConsumedFoods();

    const [consumedMacros, setConsumedMacros] = useState({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
    });

    useEffect(() => {
        const today = new Date();
        const macros = getTotalMacrosForDate(today);
        setConsumedMacros(macros);
    }, [getTotalMacrosForDate]);

    const targetCalories = profile?.target_calories || 2000;
    const targetProtein = profile?.target_protein || 150;
    const targetCarbs = profile?.target_carbs || 200;
    const targetFat = profile?.target_fat || 60;

    const macros = [
        {
            name: "Calorias",
            consumed: Math.round(consumedMacros.calories),
            target: targetCalories,
            unit: "kcal",
            color: "bg-blue-500",
        },
        {
            name: "Proteínas",
            consumed: Math.round(consumedMacros.protein),
            target: targetProtein,
            unit: "g",
            color: "bg-red-500",
        },
        {
            name: "Carboidratos",
            consumed: Math.round(consumedMacros.carbs),
            target: targetCarbs,
            unit: "g",
            color: "bg-yellow-500",
        },
        {
            name: "Gorduras",
            consumed: Math.round(consumedMacros.fat),
            target: targetFat,
            unit: "g",
            color: "bg-green-500",
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Progresso Diário de Macros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {macros.map((macro) => {
                    const percentage = Math.min((macro.consumed / macro.target) * 100, 100);

                    return (
                        <div key={macro.name} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">{macro.name}</span>
                                <span className="text-muted-foreground">
                                    {macro.consumed} / {macro.target} {macro.unit}
                                </span>
                            </div>
                            <Progress value={percentage} className={macro.color} />
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};

export default MacroProgress;
