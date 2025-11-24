import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Sparkles, CheckCircle2, Trophy } from "lucide-react";
import { useUserProfile, UserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  fields: string[];
  message: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "physical",
    title: "📏 Suas Medidas",
    description: "Vamos começar com suas informações físicas",
    icon: "📏",
    fields: ["weight", "height", "age"],
    message: "Ótimo! Com essas informações calculo seu metabolismo basal (TMB) 🧮",
  },
  {
    id: "personal",
    title: "👤 Informações Pessoais",
    description: "Um pouco sobre você",
    icon: "👤",
    fields: ["gender", "activity_level"],
    message: "Perfeito! Agora sei seu estilo de vida 💪",
  },
  {
    id: "goal",
    title: "🎯 Seu Objetivo",
    description: "O que você quer alcançar?",
    icon: "🎯",
    fields: ["goal"],
    message: "Excelente! Vou personalizar tudo para seu objetivo 🚀",
  },
  {
    id: "foods",
    title: "🍽️ Alimentos que Gosta",
    description: "Seus alimentos favoritos",
    icon: "🍽️",
    fields: ["preferred_foods"],
    message: "Perfeito! Vou usar esses alimentos para criar suas refeições 👨‍🍳",
  },
  {
    id: "diet",
    title: "🚫 Restrições Alimentares",
    description: "Suas restrições e alergias",
    icon: "🚫",
    fields: ["dietary_restrictions"],
    message: "Pronto! Agora você pode usar toda a magia do myNutrIA 🤖",
  },
];

interface OnboardingTutorialProps {
  onComplete: () => void;
}

const OnboardingTutorial = ({ onComplete }: OnboardingTutorialProps) => {
  const { profile, saveProfile, loadProfile } = useUserProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [restrictionInput, setRestrictionInput] = useState("");
  const [foodInput, setFoodInput] = useState("");
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const addRestriction = () => {
    if (!restrictionInput.trim()) return;
    const restrictions = formData.dietary_restrictions || [];
    setFormData({
      ...formData,
      dietary_restrictions: [...restrictions, restrictionInput.trim()],
    });
    setRestrictionInput("");
  };

  const removeRestriction = (index: number) => {
    const restrictions = formData.dietary_restrictions || [];
    setFormData({
      ...formData,
      dietary_restrictions: restrictions.filter((_, i) => i !== index),
    });
  };

  const addFood = () => {
    if (!foodInput.trim()) return;
    const foods = formData.preferred_foods || [];
    setFormData({
      ...formData,
      preferred_foods: [...foods, foodInput.trim()],
    });
    setFoodInput("");
  };

  const removeFood = (index: number) => {
    const foods = formData.preferred_foods || [];
    setFormData({
      ...formData,
      preferred_foods: foods.filter((_, i) => i !== index),
    });
  };

  const canProceed = () => {
    const requiredFields = step.fields;
    return requiredFields.every((field) => {
      const value = formData[field as keyof UserProfile];
      if (Array.isArray(value)) {
        // preferred_foods e dietary_restrictions precisam ter pelo menos 1 item na seção de alimentos
        if (field === "preferred_foods") return value.length > 0;
        return value.length > 0 || field === "dietary_restrictions"; // Restrições opcionais
      }
      return value !== undefined && value !== null && value !== "";
    });
  };

  const handleNext = async () => {
    if (!canProceed()) {
      toast.error("Preencha todos os campos obrigatórios para continuar");
      return;
    }

    try {
      setIsSaving(true);
      
      // Salvar dados do perfil
      await saveProfile(formData);
      
      // Aguardar um pouco mais para garantir que foi salvo no banco
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Recarregar o perfil do banco
      await loadProfile();
      
      // Aguardar mais um tempo para a atualização
      await new Promise(resolve => setTimeout(resolve, 500));

      if (currentStep === ONBOARDING_STEPS.length - 1) {
        // Último passo, mostrar celebração
        setShowCompletion(true);
        setTimeout(() => {
          onComplete();
        }, 4000); // Aumentado para 4 segundos
      } else {
        // Ir para o próximo passo
        setCurrentStep(currentStep + 1);
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);
      toast.error("Erro ao salvar dados. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  if (showCompletion) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Card className="w-full max-w-md mx-auto animate-in zoom-in">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <Trophy className="w-24 h-24 text-yellow-400 animate-bounce" />
                <CheckCircle2 className="w-8 h-8 text-green-500 absolute bottom-0 right-0 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Parabéns! 🎉</h2>
              <p className="text-muted-foreground">
                Seu perfil está 100% completo! Agora você pode usar toda a magia do myNutrIA.
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <p>✨ Crie refeições personalizadas com IA</p>
              <p>📊 Acompanhe seu progresso</p>
              <p>🔥 Mantenha seu streak em dia</p>
            </div>

            <Button className="w-full" onClick={onComplete}>
              Começar Jornada 🚀
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4">
        <CardHeader className="bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground rounded-t-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl">
                  <span className="mr-2">{step.icon}</span>
                  {step.title}
                </CardTitle>
                <p className="text-xs opacity-90">{step.description}</p>
              </div>
              <Badge variant="secondary" className="text-lg font-bold">
                {currentStep + 1}/{ONBOARDING_STEPS.length}
              </Badge>
            </div>

            {/* Barra de progresso */}
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs opacity-75">
                {Math.round(progress)}% completo
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Mensagem motivacional */}
          <div className="bg-primary/10 rounded-lg p-4 flex gap-3 items-start">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-primary">{step.message}</p>
          </div>

          {/* Campos do formulário */}
          <div className="space-y-4">
            {step.id === "physical" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="weight">
                    Peso (kg) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="Ex: 75"
                    value={formData.weight || ""}
                    onChange={(e) =>
                      handleInputChange("weight", parseFloat(e.target.value))
                    }
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">
                    Altura (cm) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="Ex: 180"
                    value={formData.height || ""}
                    onChange={(e) =>
                      handleInputChange("height", parseFloat(e.target.value))
                    }
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">
                    Idade (anos) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Ex: 25"
                    value={formData.age || ""}
                    onChange={(e) =>
                      handleInputChange("age", parseFloat(e.target.value))
                    }
                    className="text-lg"
                  />
                </div>
              </>
            )}

            {step.id === "personal" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="gender">
                    Sexo <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.gender || ""}
                    onValueChange={(value) =>
                      handleInputChange(
                        "gender",
                        value as "male" | "female" | "other"
                      )
                    }
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Selecione seu sexo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activity">
                    Nível de Atividade <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.activity_level || ""}
                    onValueChange={(value) =>
                      handleInputChange(
                        "activity_level",
                        value as
                          | "sedentary"
                          | "light"
                          | "moderate"
                          | "active"
                          | "very_active"
                      )
                    }
                  >
                    <SelectTrigger id="activity">
                      <SelectValue placeholder="Selecione seu nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentário</SelectItem>
                      <SelectItem value="light">Leve</SelectItem>
                      <SelectItem value="moderate">Moderado</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="very_active">Muito Ativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step.id === "goal" && (
              <div className="space-y-2">
                <Label htmlFor="goal">
                  Seu Objetivo <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.goal || ""}
                  onValueChange={(value) =>
                    handleInputChange(
                      "goal",
                      value as "lose_weight" | "gain_muscle" | "maintain"
                    )
                  }
                >
                  <SelectTrigger id="goal">
                    <SelectValue placeholder="Selecione seu objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose_weight">⬇️ Emagrecer</SelectItem>
                    <SelectItem value="gain_muscle">⬆️ Ganhar Massa</SelectItem>
                    <SelectItem value="maintain">➡️ Manter Peso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {step.id === "foods" && (
              <div className="space-y-3">
                <Label>
                  Alimentos que Gosta <span className="text-red-500">*</span>
                </Label>
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 mb-3">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    💡 <strong>Dica importante:</strong> Liste todos os alimentos que você gostaria de incluir em uma dieta, independente do seu objetivo. A IA vai manipular apenas as quantidades conforme seu objetivo!
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: frango, arroz, brócolis..."
                    value={foodInput}
                    onChange={(e) => setFoodInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFood();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addFood}
                  >
                    +
                  </Button>
                </div>

                {formData.preferred_foods &&
                  formData.preferred_foods.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.preferred_foods.map((food, idx) => (
                        <Badge
                          key={idx}
                          variant="default"
                          className="cursor-pointer hover:bg-green-600 transition-all"
                          onClick={() => removeFood(idx)}
                        >
                          {food} ✕
                        </Badge>
                      ))}
                    </div>
                  )}

                <p className="text-xs text-muted-foreground">
                  {formData.preferred_foods?.length || 0} alimento(s) adicionado(s)
                </p>
              </div>
            )}

            {step.id === "diet" && (
              <div className="space-y-3">
                <Label>Restrições Alimentares (Opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: sem lactose, vegetariano..."
                    value={restrictionInput}
                    onChange={(e) => setRestrictionInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addRestriction();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addRestriction}
                  >
                    +
                  </Button>
                </div>

                {formData.dietary_restrictions &&
                  formData.dietary_restrictions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.dietary_restrictions.map((restriction, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="cursor-pointer hover:bg-red-500 hover:text-white transition-all"
                          onClick={() => removeRestriction(idx)}
                        >
                          {restriction} ✕
                        </Badge>
                      ))}
                    </div>
                  )}

                <p className="text-xs text-muted-foreground">
                  💡 Deixe em branco se não tiver restrições
                </p>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={isSaving}
              >
                Voltar
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : currentStep === ONBOARDING_STEPS.length - 1 ? (
                <>
                  Completar
                  <Trophy className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingTutorial;
