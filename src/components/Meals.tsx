import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const meals = [
  {
    id: "1",
    time: "Café da Manhã",
    description: "Ovos mexidos com espinafre e uma fatia de pão integral.",
  },
  {
    id: "2",
    time: "Lanche da Manhã",
    description: "Iogurte grego com frutas vermelhas.",
  },
  {
    id: "3",
    time: "Almoço",
    description: "Peito de frango grelhado, quinoa e salada de vegetais.",
  },
  {
    id: "4",
    time: "Lanche da Tarde",
    description: "Maçã com pasta de amendoim.",
  },
  {
    id: "5",
    time: "Jantar",
    description: "Salmão assado com brócolis e batata doce.",
  },
];

export function Meals() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plano de Refeições</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {meals.map((meal) => (
          <div key={meal.id} className="flex items-center space-x-4 rounded-md border p-4">
            <Checkbox id={`meal-${meal.id}`} />
            <div className="flex-1 space-y-1">
              <Label htmlFor={`meal-${meal.id}`} className="text-sm font-medium leading-none">
                {meal.time}
              </Label>
              <p className="text-sm text-muted-foreground">
                {meal.description}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
