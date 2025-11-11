import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Sparkles, User, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { sendMessageToGroq, NUTRITION_SYSTEM_PROMPT, parseNutritionPlan } from "@/lib/groqClient";
import { ChatMessage, Meal } from "@/lib/types";
import useChatMessages from "@/hooks/useChatMessages";
import { supabase } from "@/lib/supabaseClient";

interface ChatInterfaceProps {
  onMealGenerated?: (meal: Meal) => void;
  userProfile?: any;
}

const ChatAI = ({ onMealGenerated }: ChatInterfaceProps) => {
  const { messages, addMessage, clearMessages, isLoading: messagesLoading } = useChatMessages();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInitialMessage, setShowInitialMessage] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mostrar mensagem inicial se não houver histórico
  useEffect(() => {
    if (!messagesLoading && messages.length === 0) {
      setShowInitialMessage(true);
    } else {
      setShowInitialMessage(false);
    }
  }, [messages, messagesLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  /**
   * Salva refeição no banco de dados
   */
  const saveMealToDatabase = async (meal: Meal) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Você precisa estar autenticado");
        return;
      }

      // Salvar refeição
      const { data: mealData, error: mealError } = await supabase
        .from("meals")
        .insert({
          user_id: user.id,
          name: meal.name,
          description: meal.description,
          meal_type: meal.type,
        })
        .select()
        .single();

      if (mealError) throw mealError;

      // Salvar alimentos da refeição
      const foodsToInsert = meal.foods.map((food) => ({
        meal_id: mealData.id,
        food_name: food.name,
        quantity: food.quantity,
        unit: food.unit,
        calories: food.macros.calories,
        protein: food.macros.protein,
        carbs: food.macros.carbs,
        fat: food.macros.fat,
        notes: food.notes || "",
      }));

      const { error: foodsError } = await supabase
        .from("meal_foods")
        .insert(foodsToInsert);

      if (foodsError) throw foodsError;

      toast.success(`✅ "${meal.name}" salva em Minhas Refeições!`);
      if (onMealGenerated) onMealGenerated(meal);
    } catch (err) {
      console.error("Erro ao salvar refeição:", err);
      toast.error("Erro ao salvar refeição");
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      // Adiciona mensagem do usuário ao banco
      await addMessage("user", userMessage);

      // Prepara histórico de mensagens para Groq
      const groqMessages = [...messages, { role: "user" as const, content: userMessage }].map(
        (msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })
      );

      // Chama Groq API
      const response = await sendMessageToGroq(groqMessages, NUTRITION_SYSTEM_PROMPT);

      // Tenta fazer parse de refeição no JSON
      const parsedMeal = parseNutritionPlan(response);

      if (parsedMeal && parsedMeal.foods && parsedMeal.foods.length > 0) {
        // Se for uma refeição válida, salvar no banco e não mostrar o JSON no chat
        const meal: Meal = {
          name: parsedMeal.name || "Refeição gerada",
          description: parsedMeal.description || "",
          type: parsedMeal.meal_type || "breakfast",
          foods: parsedMeal.foods.map((f: any) => ({
            name: f.name,
            quantity: f.quantity,
            unit: f.unit,
            macros: {
              protein: f.protein || 0,
              carbs: f.carbs || 0,
              fat: f.fat || 0,
              calories: f.calories || 0,
            },
            notes: f.notes || "",
          })),
          totalMacros: {
            protein: parsedMeal.totals?.protein || parsedMeal.foods.reduce((sum: number, f: any) => sum + (f.protein || 0), 0),
            carbs: parsedMeal.totals?.carbs || parsedMeal.foods.reduce((sum: number, f: any) => sum + (f.carbs || 0), 0),
            fat: parsedMeal.totals?.fat || parsedMeal.foods.reduce((sum: number, f: any) => sum + (f.fat || 0), 0),
            calories: parsedMeal.totals?.calories || parsedMeal.foods.reduce((sum: number, f: any) => sum + (f.calories || 0), 0),
          },
        };

        // Salvar refeição
        await saveMealToDatabase(meal);

        // Mostrar apenas a explicação, não o JSON
        const responseWithoutJSON = response
          .replace(/\{[\s\S]*\}/g, "")
          .trim();

        const finalResponse =
          responseWithoutJSON ||
          `✅ Refeição "${meal.name}" criada com sucesso! Você pode ver detalhes na aba "Minhas Refeições"`;

        await addMessage("assistant", finalResponse);
      } else {
        // Se for apenas conversa, mostrar normalmente
        await addMessage("assistant", response);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao comunicar com a IA";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (window.confirm("Tem certeza que deseja limpar todo o histórico de chat?")) {
      try {
        await clearMessages();
        toast.success("Histórico limpo com sucesso");
      } catch (err) {
        toast.error("Erro ao limpar histórico");
      }
    }
  };

  const displayMessages = showInitialMessage && messages.length === 0 ? [
    {
      role: "assistant" as const,
      content:
        "Olá! 👋 Sou a myNutrIA, sua assistente de nutrição com IA.\n\n🎯 Como funciono:\n1. Você me conta sobre seus objetivos (emagrecer, ganhar massa, manter)\n2. Peço informações sobre seu peso, altura, atividades, etc\n3. Calculo suas necessidades calóricas (TDEE)\n4. Crio refeições balanceadas automaticamente\n\n💪 Quando gero uma refeição:\n✨ Aparece automaticamente em \"Minhas Refeições\"\n✅ Você marca quando consumiu\n🔥 Seu streak aumenta (como no Duolingo)\n\n📊 Vamos começar? Me conte seu objetivo principal!",
      timestamp: new Date(),
    },
  ] : messages;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-lg border border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 text-primary-foreground rounded-t-lg">
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center animate-pulse">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg">myNutrIA Assistant</div>
                <div className="text-xs font-normal opacity-90">
                  Assistente de Nutrição Inteligente
                </div>
              </div>
            </CardTitle>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Erro */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 p-4 m-4 rounded-lg flex gap-2 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm text-destructive">{error}</div>
            </div>
          )}

          {/* Loading inicial */}
          {messagesLoading && (
            <div className="h-[500px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Sparkles className="w-8 h-8 text-primary animate-spin" />
                <p className="text-muted-foreground">Carregando histórico de chat...</p>
              </div>
            </div>
          )}

          {!messagesLoading && (
            <>
              {/* Chat messages */}
              <div className="h-[500px] overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-muted/20">
                {displayMessages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 ${
                      message.role === "user" ? "justify-end" : ""
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-md">
                        <Sparkles className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl p-4 max-w-[80%] text-sm font-medium transition-all ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-tr-sm shadow-md hover:shadow-lg"
                          : "bg-white border border-muted-foreground/20 rounded-tl-sm shadow-sm hover:shadow-md dark:bg-muted"
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-medium leading-relaxed">
                        {message.content}
                      </div>
                      {message.timestamp && (
                        <div className={`text-xs mt-2 opacity-60 font-normal`}>
                          {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center flex-shrink-0 shadow-md">
                        <User className="w-4 h-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 animate-in fade-in">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-md">
                      <Sparkles className="w-4 h-4 text-primary-foreground animate-pulse" />
                    </div>
                    <div className="bg-white border border-muted-foreground/20 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                        <div
                          className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t bg-muted/30 p-4">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSend()}
                    placeholder="Conte-me sobre seus objetivos..."
                    disabled={isLoading}
                    className="flex-1 border-primary/30 focus:border-primary"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md hover:shadow-lg transition-all"
                    size="default"
                  >
                    {isLoading ? (
                      <Sparkles className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <div className="flex gap-2 items-start">
          <Sparkles className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-primary mb-1">💡 Dica:</p>
            <p>
              A IA está analisando suas informações em tempo real. Quando uma refeição é gerada,
              ela aparece automaticamente em "Minhas Refeições" para você acompanhar seu consumo!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAI;
