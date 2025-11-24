import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Sparkles, User, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { sendMessageToGroq, NUTRITION_SYSTEM_PROMPT, parseNutritionPlan } from "@/lib/groqClient";
import { ChatMessage, Meal } from "@/lib/types";
import useChatMessages from "@/hooks/useChatMessages";
import useUserProfile from "@/hooks/useUserProfile";
import { supabase } from "@/lib/supabaseClient";

interface ChatInterfaceProps {
  onMealGenerated?: (meal: Meal) => void;
  fullscreen?: boolean;
}

const ChatAI = ({ onMealGenerated, fullscreen = false }: ChatInterfaceProps) => {
  const { profile } = useUserProfile();
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
   * Carrega refeições do usuário do banco de dados
   */
  const loadUserMeals = async (): Promise<string> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return "";

      // ⚠️ OTIMIZAÇÃO: Buscar apenas últimas 5 refeições (não 10) para economizar tokens
      const { data: meals, error } = await supabase
        .from("meals")
        .select("*, meal_foods(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error || !meals?.length) return "";

      // ⚠️ OTIMIZAÇÃO: Formato comprimido de refeições para economizar tokens
      let mealsContext = "\n\nÚltimas refeições:\n";
      meals.forEach((meal: any) => {
        const totalCals = meal.meal_foods.reduce((sum: number, f: any) => sum + (f.calories || 0), 0);
        const totalProt = meal.meal_foods.reduce((sum: number, f: any) => sum + (f.protein || 0), 0);
        const foods = meal.meal_foods.map((f: any) => `${f.quantity}${f.unit} ${f.food_name}`).join(', ');
        mealsContext += `- ${meal.name}: ${foods} | ${totalCals}kcal, ${totalProt}g prot\n`;
      });

      return mealsContext;
    } catch (err) {
      console.error("Erro ao carregar refeições:", err);
      return "";
    }
  };

  /**
   * Salva refeição no banco de dados
   */
  const saveMealToDatabase = async (meal: Meal) => {
    try {
      // Validar refeição
      if (!meal.name || meal.name.trim() === '') {
        toast.error("Nome da refeição inválido");
        return;
      }

      if (!meal.foods || meal.foods.length === 0) {
        toast.error("Refeição sem alimentos");
        return;
      }

      // Validar que tem dados corretos
      const totalCals = meal.foods.reduce((sum, f) => sum + (f.macros.calories || 0), 0);
      if (totalCals < 50) {
        console.warn("Refeição com calorias muito baixas:", meal);
        toast.error("Refeição com dados inválidos (calorias muito baixas)");
        return;
      }

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

      // Validar e salvar alimentos
      const foodsToInsert = meal.foods
        .filter(f => f.name && f.name.trim() !== '')
        .map((food) => ({
          meal_id: mealData.id,
          food_name: food.name,
          quantity: food.quantity || 0,
          unit: food.unit || 'g',
          calories: food.macros.calories || 0,
          protein: food.macros.protein || 0,
          carbs: food.macros.carbs || 0,
          fat: food.macros.fat || 0,
          notes: food.notes || "",
        }));

      if (foodsToInsert.length === 0) {
        toast.error("Nenhum alimento válido na refeição");
        return;
      }

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

      // Carrega refeições anteriores do usuário
      const previousMealsContext = await loadUserMeals();

      // ⚠️ OTIMIZAÇÃO: Limitar histórico para evitar erro 413 (Content Too Large)
      // Mantém apenas as últimas 8 mensagens + a mensagem atual para economizar tokens
      const MAX_HISTORY = 8;
      const allMessages = [...messages, { role: "user" as const, content: userMessage }];
      const messagesToSend = allMessages.slice(-MAX_HISTORY);
      
      const groqMessages = messagesToSend.map(
        (msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })
      );

      // Adicionar informações do perfil ao contexto se disponível
      let enhancedPrompt = NUTRITION_SYSTEM_PROMPT;
      
      if (profile) {
        // ⚠️ OTIMIZAÇÃO: Formato comprimido do perfil para economizar tokens
        enhancedPrompt += `\n\n📋 PERFIL:
Peso ${profile.weight}kg | Alt ${profile.height}cm | ${profile.age}a | ${profile.gender} | ${profile.goal === 'lose_weight' ? 'Emagrecer' : profile.goal === 'gain_muscle' ? 'Ganhar' : 'Manter'} | ${profile.activity_level}
TDEE: ${profile.tdee}kcal

⭐ METAS (EXATAMENTE):
${profile.target_calories}kcal | ${profile.target_protein}g prot | ${profile.target_carbs}g carb | ${profile.target_fat}g gord
${profile.dietary_restrictions?.length ? `Restrições: ${profile.dietary_restrictions.join(', ')} ` : ''}${profile.preferred_foods?.length ? `| Gosta: ${profile.preferred_foods.slice(0, 2).join(', ')}` : ''}

QUANDO CRIAR REFEIÇÃO, USE ESTE JSON (sem markdown):
{"meal_type":"breakfast","name":"Nome","description":"Desc","foods":[{"name":"Alimento","quantity":100,"unit":"g","calories":150,"protein":20,"carbs":10,"fat":5}],"totals":{"calories":TOTAL,"protein":TOTAL,"carbs":TOTAL,"fat":TOTAL}}

${previousMealsContext}`;
      }

      // Chama Groq API
      const response = await sendMessageToGroq(groqMessages, enhancedPrompt);

      // DEBUG: Mostrar resposta bruta
      console.log("🤖 Groq Response (raw):", response.substring(0, 500));
      
      // Tenta extrair MÚLTIPLAS refeições no JSON
      const parsedMeals = parseNutritionPlan(response);
      
      // DEBUG: Mostrar resultado do parsing
      console.log("📊 Parsed Meals:", parsedMeals?.length || 0, "refeições encontradas");

      if (parsedMeals && parsedMeals.length > 0) {
        // Salvar TODAS as refeições encontradas
        let savedCount = 0;
        
        for (const parsedMeal of parsedMeals) {
          // Validar refeição
          if (!parsedMeal.foods?.length || !parsedMeal.totals?.calories || parsedMeal.totals.calories < 50) {
            console.warn("⚠️ Refeição inválida, pulando:", parsedMeal.name);
            continue;
          }

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
          try {
            await saveMealToDatabase(meal);
            savedCount++;
            console.log(`✅ Refeição "${meal.name}" salva (${savedCount}/${parsedMeals.length})`);
          } catch (error) {
            console.error(`❌ Erro ao salvar "${meal.name}":`, error);
          }
        }

        // Mostrar mensagem de resumo
        let responseWithoutJSON = response
          .replace(/```json[\s\S]*?```/g, "")
          .replace(/\{[\s\S]*?\}/g, "")
          .trim()
          .split('\n')
          .filter(line => line.trim() !== '')
          .join('\n');

        if (!responseWithoutJSON || responseWithoutJSON.length < 10) {
          responseWithoutJSON = `
✅ ${savedCount} refeição(ões) criada(s) com sucesso!

� Refeições adicionadas:
${parsedMeals.slice(0, savedCount).map(m => `- ${m.name}: ${Math.round(m.totals?.calories || 0)}kcal`).join('\n')}

Ver detalhes em "Minhas Refeições" 👉`;
        }

        await addMessage("assistant", responseWithoutJSON);
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
        setIsLoading(true);
        await clearMessages();
        setInput(""); // Limpar input também
        setError(null);
        toast.success("✅ Histórico deletado com sucesso");
      } catch (err) {
        console.error('Erro ao limpar:', err);
        toast.error("❌ Erro ao limpar histórico. Tente novamente.");
      } finally {
        setIsLoading(false);
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

  // Modo fullscreen (como WhatsApp)
  if (fullscreen) {
    return (
      <div className="flex flex-col h-full w-full bg-gradient-to-b from-background to-muted/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 text-primary-foreground p-4 border-b flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center animate-pulse">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold">myNutrIA</div>
                <div className="text-xs opacity-90">Assistente de Nutrição</div>
              </div>
            </div>
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
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 w-full">
          {messagesLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Sparkles className="w-8 h-8 text-primary animate-spin" />
                <p className="text-muted-foreground">Carregando histórico...</p>
              </div>
            </div>
          ) : (
            <>
              {displayMessages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 animate-in fade-in ${
                    message.role === "user" ? "justify-end" : ""
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl p-3 max-w-[85%] text-sm transition-all ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted rounded-tl-sm"
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-primary-foreground animate-pulse" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm p-3">
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
            </>
          )}
        </div>

        {/* Input area */}
        <div className="border-t bg-background p-3 sm:p-4 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSend()}
              placeholder="Digite sua mensagem..."
              disabled={isLoading}
              className="flex-1 rounded-full border-primary/30"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
              size="icon"
            >
              {isLoading ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Modo card (padrão)
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
    </div>
  );
};

export default ChatAI;
