import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  Zap,
} from "lucide-react";

interface MealCreationTutorialProps {
  onComplete: () => void;
}

type TutorialStep = "welcome" | "navigation" | "chat" | "messages" | "complete";

const steps: Array<{
  id: TutorialStep;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
    {
      id: "welcome",
      title: "Vamos Criar Sua Primeira Refeição! 🍽️",
      description: "Agora você vai aprender a usar a IA para criar refeições",
      icon: "🍽️",
    },
    {
      id: "navigation",
      title: "Navegando pelo App 🗺️",
      description: "Veja como se mover entre as diferentes seções",
      icon: "🗺️",
    },
    {
      id: "chat",
      title: "Usando o Chat 💬",
      description: "Como conversar com a IA para criar refeições",
      icon: "💬",
    },
    {
      id: "messages",
      title: "Sugestões de Mensagens 💭",
      description: "Exemplos de como pedir ao myNutrIA",
      icon: "💭",
    },
    {
      id: "complete",
      title: "Você Está Pronto! 🚀",
      description: "Agora é com você!",
      icon: "🚀",
    },
  ];

const MealCreationTutorial = ({ onComplete }: MealCreationTutorialProps) => {
  const [currentStep, setCurrentStep] = useState<TutorialStep>("welcome");
  const stepIndex = steps.findIndex((s) => s.id === currentStep);
  const step = steps[stepIndex];
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].id);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].id);
    }
  };

  if (currentStep === "complete") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Card className="w-full max-w-md mx-auto animate-in zoom-in">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="text-6xl animate-bounce">🚀</div>
                <CheckCircle2 className="w-8 h-8 text-green-500 absolute bottom-0 right-0 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Você Está Pronto! 🎉</h2>
              <p className="text-muted-foreground">
                Agora é hora de criar sua primeira refeição! Você pode começar no chat quando quiser.
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <p>✨ Crie refeições personalizadas</p>
              <p>📋 Adicione uma refeição por vez</p>
              <p>🔄 A IA ajustará as quantidades conforme seu objetivo</p>
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
      <Card className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground rounded-t-lg sticky top-0">
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
                {stepIndex + 1}/{steps.length}
              </Badge>
            </div>

            {/* Barra de progresso */}
            <div className="h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-foreground transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {currentStep === "welcome" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 rounded-lg p-4 space-y-3">
                <div className="flex gap-3 items-start">
                  <Zap className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Parabéns por completar seu perfil! 🎊</p>
                    <p className="text-muted-foreground">
                      Agora você tem acesso a toda a magia do myNutrIA. Vamos aprender como usar a IA para criar suas refeições de forma simples e rápida.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  O que você aprenderá:
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>✓ Como navegar pelo app</li>
                  <li>✓ Como usar o chat com a IA</li>
                  <li>✓ Exemplos de mensagens para criar refeições</li>
                  <li>✓ Dicas importantes para melhores resultados</li>
                </ul>
              </div>
            </div>
          )}

          {currentStep === "navigation" && (
            <div className="space-y-4">
              <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4 space-y-3">
                <p className="font-semibold text-primary dark:text-primary">
                  🗺️ Estrutura do App
                </p>
                <div className="space-y-3 text-sm">
                  <div className="bg-white dark:bg-slate-800 rounded p-2 border-l-4 border-primary">
                    <p className="font-semibold">📊 Dashboard (Home)</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Você vê seu progresso, streak (sequência de dias), e resumo das refeições
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded p-2 border-l-4 border-green-500">
                    <p className="font-semibold">🍽️ Minhas Refeições</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Aqui estão todas as refeições que você criou. Você pode ver os detalhes de cada uma
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded p-2 border-l-4 border-blue-500">
                    <p className="font-semibold">💬 Monte sua Dieta (Chat)</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      O lugar mágico! Aqui você conversa com a IA e cria suas refeições
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded p-2 border-l-4 border-orange-500">
                    <p className="font-semibold">👤 Perfil</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Editar seus dados, objetivos e preferências
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-3 flex gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-900 dark:text-amber-100">
                  <strong>Dica:</strong> Use o menu no topo para navegar entre essas seções rapidamente!
                </p>
              </div>
            </div>
          )}

          {currentStep === "chat" && (
            <div className="space-y-4">
              <div className="bg-cyan-50 dark:bg-cyan-950 rounded-lg p-4 space-y-3">
                <p className="font-semibold text-cyan-900 dark:text-cyan-100">
                  💬 Como Usar o Chat
                </p>
                <div className="space-y-2 text-sm text-cyan-800 dark:text-cyan-200">
                  <div className="bg-white dark:bg-slate-800 rounded p-2">
                    <p className="font-semibold">1️⃣ Abra o chat</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Clique na aba "Monte sua Dieta" no menu
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded p-2">
                    <p className="font-semibold">2️⃣ Digite sua mensagem</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Converse de forma natural com a IA
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded p-2">
                    <p className="font-semibold">3️⃣ Receba sugestões</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      A IA vai sugerir refeições personalizadas para você
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded p-2">
                    <p className="font-semibold">4️⃣ Salve a refeição</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Clique em "Adicionar Refeição" para salvar
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3 flex gap-3">
                <MessageSquare className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-xs text-red-900 dark:text-red-100">
                  <strong>Importante:</strong> Adicione <strong>uma refeição por vez</strong>. Isso ajuda a IA a entender melhor suas necessidades!
                </p>
              </div>
            </div>
          )}

          {currentStep === "messages" && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 space-y-3">
                <p className="font-semibold text-green-900 dark:text-green-100">
                  💭 Exemplos de Mensagens
                </p>
                <p className="text-xs text-green-800 dark:text-green-200 mb-3">
                  Aqui estão alguns exemplos de como conversar com a IA:
                </p>

                <div className="space-y-2">
                  {[
                    "Crie um café da manhã proteico com os alimentos que gosto",
                    "Quero um almoço com frango e arroz que cumpra minhas calorias do dia",
                    "Me sugira um lanche saudável para 15h",
                    "Preciso de um jantar leve, estou em déficit calórico",
                    "Me crie uma refeição pós-treino com bastante proteína",
                    "Qual seria uma boa refeição sem esses alimentos [lista alimentos]",
                  ].map((message, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-800 rounded-lg p-3 text-sm border-l-4 border-green-500 cursor-pointer hover:bg-green-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <p className="text-muted-foreground italic">"{message}"</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-950 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-100">
                  ✨ Dicas para Melhores Resultados:
                </p>
                <ul className="text-xs text-indigo-800 dark:text-indigo-200 space-y-1">
                  <li>
                    • Seja específico sobre o que quer (café, almoço, lanche, etc)
                  </li>
                  <li>
                    • Mencione seu objetivo (déficit, ganho, manutenção)
                  </li>
                  <li>
                    • Fale sobre restrições ou preferências específicas
                  </li>
                  <li>
                    • A IA vai usar os alimentos que você adicionou no perfil
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Botões de navegação */}
          <div className="flex gap-3 pt-4 border-t">
            {stepIndex > 0 && (
              <Button
                variant="outline"
                onClick={handlePrev}
                className="flex-1"
              >
                Voltar
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1"
            >
              {stepIndex === steps.length - 1 ? (
                <>
                  Começar! 🚀
                  <ChevronRight className="w-4 h-4 ml-2" />
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

export default MealCreationTutorial;
