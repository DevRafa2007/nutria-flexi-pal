import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, Sparkles, TrendingDown, TrendingUp, Activity, X } from "lucide-react";
import { useUserProfile, UserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";

const ProfileForm = () => {
  const { profile, isLoading, saveProfile } = useUserProfile();
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [restrictionInput, setRestrictionInput] = useState("");
  const [preferredFoodInput, setPreferredFoodInput] = useState("");
  const [dislikedFoodInput, setDislikedFoodInput] = useState("");

  // Preencher formulário com dados do perfil
  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.weight || !formData.height || !formData.age || !formData.gender) {
      toast.error("Preencha os campos obrigatórios (peso, altura, idade, sexo)");
      return;
    }

    setIsSaving(true);
    try {
      await saveProfile(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (type: 'restrictions' | 'preferred' | 'disliked', value: string) => {
    if (!value.trim()) return;

    const key = type === 'restrictions' 
      ? 'dietary_restrictions' 
      : type === 'preferred' 
      ? 'preferred_foods' 
      : 'disliked_foods';

    const currentArray = formData[key] || [];
    setFormData({
      ...formData,
      [key]: [...currentArray, value.trim()],
    });

    // Limpar input
    if (type === 'restrictions') setRestrictionInput("");
    if (type === 'preferred') setPreferredFoodInput("");
    if (type === 'disliked') setDislikedFoodInput("");
  };

  const removeItem = (type: 'restrictions' | 'preferred' | 'disliked', index: number) => {
    const key = type === 'restrictions' 
      ? 'dietary_restrictions' 
      : type === 'preferred' 
      ? 'preferred_foods' 
      : 'disliked_foods';

    const currentArray = formData[key] || [];
    setFormData({
      ...formData,
      [key]: currentArray.filter((_, i) => i !== index),
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Sparkles className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p>Carregando perfil...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Informações Calculadas */}
      {formData.tdee && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Suas Metas Calculadas pela IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-2xl font-bold text-primary">{formData.tdee}</div>
                <div className="text-xs text-muted-foreground">TDEE (kcal)</div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-2xl font-bold text-primary">{formData.target_calories}</div>
                <div className="text-xs text-muted-foreground">Meta Diária</div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-2xl font-bold text-orange-500">{formData.target_protein}g</div>
                <div className="text-xs text-muted-foreground">Proteína</div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-2xl font-bold text-blue-500">{formData.target_carbs}g</div>
                <div className="text-xs text-muted-foreground">Carboidratos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dados Básicos */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>
            Dados fundamentais para calcular suas necessidades nutricionais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg) *</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={formData.weight || ""}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                placeholder="Ex: 70.5"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Altura (cm) *</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                value={formData.height || ""}
                onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
                placeholder="Ex: 175"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Idade *</Label>
              <Input
                id="age"
                type="number"
                value={formData.age || ""}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                placeholder="Ex: 25"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Sexo *</Label>
              <Select
                value={formData.gender || ""}
                onValueChange={(value) => setFormData({ ...formData, gender: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Objetivo e Atividade */}
      <Card>
        <CardHeader>
          <CardTitle>Seu Objetivo</CardTitle>
          <CardDescription>
            Defina sua meta e nível de atividade física
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal">Objetivo Principal</Label>
            <Select
              value={formData.goal || ""}
              onValueChange={(value) => setFormData({ ...formData, goal: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione seu objetivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lose_weight">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Emagrecer (déficit de 400 kcal)
                  </div>
                </SelectItem>
                <SelectItem value="gain_muscle">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Ganhar Massa Muscular (superávit de 400 kcal)
                  </div>
                </SelectItem>
                <SelectItem value="maintain">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Manter Peso (equilíbrio)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity_level">Nível de Atividade Física</Label>
            <Select
              value={formData.activity_level || ""}
              onValueChange={(value) => setFormData({ ...formData, activity_level: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentário (pouco ou nenhum exercício)</SelectItem>
                <SelectItem value="light">Leve (1-3x por semana)</SelectItem>
                <SelectItem value="moderate">Moderado (3-5x por semana)</SelectItem>
                <SelectItem value="active">Ativo (6-7x por semana)</SelectItem>
                <SelectItem value="very_active">Muito Ativo (atleta)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Preferências Alimentares */}
      <Card>
        <CardHeader>
          <CardTitle>Preferências Alimentares</CardTitle>
          <CardDescription>
            Ajude a IA a criar refeições perfeitas para você
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Restrições */}
          <div className="space-y-2">
            <Label>Restrições Alimentares</Label>
            <div className="flex gap-2">
              <Input
                value={restrictionInput}
                onChange={(e) => setRestrictionInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem('restrictions', restrictionInput))}
                placeholder="Ex: lactose, glúten, nozes..."
              />
              <Button
                type="button"
                onClick={() => addItem('restrictions', restrictionInput)}
                variant="outline"
              >
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.dietary_restrictions || []).map((item, idx) => (
                <Badge key={idx} variant="secondary" className="gap-1">
                  {item}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeItem('restrictions', idx)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Alimentos Preferidos */}
          <div className="space-y-2">
            <Label>Alimentos que Você Gosta</Label>
            <div className="flex gap-2">
              <Input
                value={preferredFoodInput}
                onChange={(e) => setPreferredFoodInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem('preferred', preferredFoodInput))}
                placeholder="Ex: frango, batata doce, abacate..."
              />
              <Button
                type="button"
                onClick={() => addItem('preferred', preferredFoodInput)}
                variant="outline"
              >
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.preferred_foods || []).map((item, idx) => (
                <Badge key={idx} variant="default" className="gap-1">
                  {item}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeItem('preferred', idx)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Alimentos Não Gosta */}
          <div className="space-y-2">
            <Label>Alimentos que Você Não Gosta</Label>
            <div className="flex gap-2">
              <Input
                value={dislikedFoodInput}
                onChange={(e) => setDislikedFoodInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem('disliked', dislikedFoodInput))}
                placeholder="Ex: peixe, espinafre..."
              />
              <Button
                type="button"
                onClick={() => addItem('disliked', dislikedFoodInput)}
                variant="outline"
              >
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.disliked_foods || []).map((item, idx) => (
                <Badge key={idx} variant="destructive" className="gap-1">
                  {item}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeItem('disliked', idx)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <Button
        type="submit"
        disabled={isSaving}
        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        size="lg"
      >
        {isSaving ? (
          <Sparkles className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        {isSaving ? "Salvando..." : "Salvar Perfil e Calcular Metas"}
      </Button>
    </form>
  );
};

export default ProfileForm;
