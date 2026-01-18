import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Sparkles, User, AlertCircle, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { sendMessageToGroq, NUTRITION_SYSTEM_PROMPT, parseNutritionPlan } from "@/lib/groqClient";
import { ChatMessage, Meal } from "@/lib/types";
import useChatMessages from "@/hooks/useChatMessages";
import useUserProfile from "@/hooks/useUserProfile";
import { supabase } from "@/lib/supabaseClient";
import { formatMessageForDisplay, generateActionSummary, processAssistantMessage } from "@/lib/messageFormatter";
import { calculateMealDistribution, formatMealTargets } from "@/lib/mealDistribution";
import { detectIntent, generateIntentPrompt } from "@/lib/intentDetection";
import { validateMeal, autoCorrectTotals } from "@/lib/mealValidator";

interface ChatInterfaceProps {
  onMealGenerated?: (meal: Meal) => void;
  fullscreen?: boolean;
}

const ChatAI = ({ onMealGenerated, fullscreen = false }: ChatInterfaceProps) => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { messages, addMessage, clearMessages, isLoading: messagesLoading } = useChatMessages();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInitialMessage, setShowInitialMessage] = useState(true);

  // 🛡️ Anti-spam protection
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 🛡️ LIMITES DE PROTEÇÃO
  // Limite aumentado para 100.000 caracteres por mensagem (match backend)
  const MAX_MESSAGE_LENGTH = 100000; // caracteres
  const MAX_MESSAGE_LINES = 200; // linhas
  const COOLDOWN_MS = 3000; // 3 segundos entre mensagens

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
   * MELHORADO: Carrega TODAS as refeições com IDs para a IA ter contexto completo
   */
  const loadUserMeals = async (): Promise<string> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return "";

      // Carregar TODAS as refeições do usuário (não apenas 5)
      const { data: meals, error } = await supabase
        .from("meals")
        .select("id, name, description, meal_type, created_at, meal_foods(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50); // Optimization: Limit to last 50 meals to prevent context overflow

      if (error || !meals?.length) return "";

      // Agrupar refeições por tipo
      const groupedMeals: Record<string, any[]> = {
        breakfast: [],
        lunch: [],
        snack: [],
        dinner: []
      };

      meals.forEach((meal: any) => {
        const type = meal.meal_type || 'snack';
        if (!groupedMeals[type]) groupedMeals[type] = [];
        groupedMeals[type].push(meal);
      });

      // Formatar para contexto da IA
      let mealsContext = "\n\n🍽️ REFEIÇÕES JÁ CRIADAS (para referência e edição):\n";

      const typeNames: Record<string, string> = {
        breakfast: 'Café da Manhã',
        lunch: 'Almoço',
        snack: 'Lanche',
        dinner: 'Jantar'
      };

      for (const [type, typeMeals] of Object.entries(groupedMeals)) {
        if (typeMeals.length > 0) {
          mealsContext += `\n${typeNames[type]}:\n`;
          typeMeals.forEach((meal: any) => {
            const totalCals = meal.meal_foods?.reduce((sum: number, f: any) => sum + (f.calories || 0), 0) || 0;
            const totalProt = meal.meal_foods?.reduce((sum: number, f: any) => sum + (f.protein || 0), 0) || 0;
            const totalCarbs = meal.meal_foods?.reduce((sum: number, f: any) => sum + (f.carbs || 0), 0) || 0;
            const totalFat = meal.meal_foods?.reduce((sum: number, f: any) => sum + (f.fat || 0), 0) || 0;

            mealsContext += `  [ID: ${meal.id}] ${meal.name}`;
            if (meal.description) mealsContext += ` - ${meal.description}`;
            mealsContext += `\n    Macros: ${Math.round(totalCals)}kcal | ${Math.round(totalProt)}g prot | ${Math.round(totalCarbs)}g carb | ${Math.round(totalFat)}g gord\n`;
          });
        }
      }

      mealsContext += `\n✏️ Para EDITAR uma refeição: "edita o [ID: xxx]" ou "muda a refeição [nome]"\n`;
      mealsContext += `📋 Para CRIAR novas: "cria X refeições" ou "faz um plano do dia"\n`;

      return mealsContext;
    } catch (err) {
      console.error("Erro ao carregar refeições:", err);
      return "";
    }
  };

  /**
   * Salva refeição no banco de dados
   */
  const saveMealToDatabase = async (meal: Meal): Promise<boolean> => {
    try {
      // Validar refeição
      if (!meal.name || meal.name.trim() === '') {
        toast.error("Nome da refeição inválido");
        return false;
      }

      if (!meal.foods || meal.foods.length === 0) {
        toast.error("Refeição sem alimentos");
        return false;
      }

      // Validar que tem dados corretos
      const totalCals = meal.foods.reduce((sum, f) => sum + (f.macros.calories || 0), 0);
      if (totalCals < 50) {
        console.warn("Refeição com calorias muito baixas:", meal);
        toast.error("Refeição com dados inválidos (calorias muito baixas)");
        return false;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Você precisa estar autenticado");
        return false;
      }

      // 🔍 LÓGICA INTELIGENTE: Verificar se já existe refeição desse tipo
      // Se a IA criou um "Café da Manhã" e já existe um, vamos SUBSTITUIR em vez de duplicar
      if (meal.type) {
        const { data: existingMeals } = await supabase
          .from("meals")
          .select("id, name")
          .eq("user_id", user.id)
          .eq("meal_type", meal.type)
          .order("created_at", { ascending: false })
          .limit(1);

        if (existingMeals && existingMeals.length > 0) {
          const existing = existingMeals[0];
          console.log(`[saveMealToDatabase] 🔄 Substituindo refeição existente: ${existing.name} (${existing.id})`);

          // Chamar update em vez de insert
          const updated = await updateMealInDatabase(existing.id, meal);
          if (updated) {
            toast.success(`✅ Refeição "${meal.name}" atualizada com sucesso!`);
            if (onMealGenerated) onMealGenerated(meal);
            // Disparar evento para notificar outros componentes
            window.dispatchEvent(new CustomEvent('mealUpdated'));
            return true;
          }
        }
      }

      // Se não existe, prosseguir com criação normal
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

      console.log('[saveMealToDatabase] Insert meal result:', { mealData, mealError });

      if (mealError || !mealData?.id) {
        console.error('[saveMealToDatabase] Falha ao inserir meal:', mealError);
        throw mealError || new Error('Meal insert failed');
      }

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
        return false;
      }

      const { data: foodsInserted, error: foodsError } = await supabase
        .from("meal_foods")
        .insert(foodsToInsert)
        .select();

      console.log('[saveMealToDatabase] Insert meal_foods result:', { foodsInserted, foodsError });

      if (foodsError) {
        // Tentar rollback: deletar a meal criada para manter consistência
        try {
          await supabase.from('meal_foods').delete().eq('meal_id', mealData.id);
          await supabase.from('meals').delete().eq('id', mealData.id);
        } catch (rbErr) {
          console.error('[saveMealToDatabase] Erro no rollback após falha em meal_foods:', rbErr);
        }
        throw foodsError;
      }

      // Verificar se os alimentos foram realmente inseridos
      if (!Array.isArray(foodsInserted) || foodsInserted.length === 0) {
        console.warn('[saveMealToDatabase] Nenhum food inserido retornado, verificando manualmente...');
        const { data: verifyFoods } = await supabase.from('meal_foods').select('*').eq('meal_id', mealData.id).limit(1);
        if (!verifyFoods || verifyFoods.length === 0) {
          // rollback
          await supabase.from('meals').delete().eq('id', mealData.id);
          throw new Error('Falha ao inserir alimentos da refeição');
        }
      }

      // Se chegou aqui, foi uma INSERÇÃO nova
      toast.success(`✅ "${meal.name}" criada em Minhas Refeições!`);

      if (onMealGenerated) onMealGenerated(meal);

      // Disparar evento para notificar outros componentes
      window.dispatchEvent(new CustomEvent('mealUpdated'));

      return true;
    } catch (err) {
      console.error("Erro ao salvar refeição:", err);
      toast.error("Erro ao salvar refeição");
      return false;
    }
  };

  /**
   * Atualiza refeição existente no banco de dados
   */
  const updateMealInDatabase = async (
    mealId: string,
    updatedMeal: Partial<Meal>
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar autenticado");
        return false;
      }

      console.log('[updateMealInDatabase] Atualizando refeição:', mealId, updatedMeal);

      // Atualizar informações da refeição
      if (updatedMeal.name || updatedMeal.description || updatedMeal.type) {
        const updateData: any = {};
        if (updatedMeal.name) updateData.name = updatedMeal.name;
        if (updatedMeal.description) updateData.description = updatedMeal.description;
        if (updatedMeal.type) updateData.meal_type = updatedMeal.type;

        const { error: mealError } = await supabase
          .from("meals")
          .update(updateData)
          .eq("id", mealId)
          .eq("user_id", user.id);

        if (mealError) {
          console.error('[updateMealInDatabase] Erro ao atualizar meal:', mealError);
          throw mealError;
        }
      }

      // Se tem foods, deletar os antigos e inserir os novos
      if (updatedMeal.foods && updatedMeal.foods.length > 0) {
        // Deletar alimentos antigos
        const { error: deleteError } = await supabase
          .from("meal_foods")
          .delete()
          .eq("meal_id", mealId);

        if (deleteError) {
          console.error('[updateMealInDatabase] Erro ao deletar foods antigos:', deleteError);
          throw deleteError;
        }

        // Inserir novos alimentos
        const foodsToInsert = updatedMeal.foods.map((food) => ({
          meal_id: mealId,
          food_name: food.name,
          quantity: food.quantity || 0,
          unit: food.unit || 'g',
          calories: food.macros.calories || 0,
          protein: food.macros.protein || 0,
          carbs: food.macros.carbs || 0,
          fat: food.macros.fat || 0,
          notes: food.notes || ""
        }));

        const { error: insertError } = await supabase
          .from("meal_foods")
          .insert(foodsToInsert);

        if (insertError) {
          console.error('[updateMealInDatabase] Erro ao inserir novos foods:', insertError);
          throw insertError;
        }
      }

      toast.success(`✅ Refeição "${updatedMeal.name || 'atualizada'}" modificada com sucesso!`);
      return true;
    } catch (err) {
      console.error("Erro ao atualizar refeição:", err);
      toast.error("Erro ao atualizar refeição");
      return false;
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // 🛡️ VALIDAÇÃO 1: Tamanho da mensagem
    if (input.length > MAX_MESSAGE_LENGTH) {
      toast.error(`⚠️ Mensagem muito longa! Máximo: ${MAX_MESSAGE_LENGTH} caracteres.`);
      return;
    }

    // 🛡️ VALIDAÇÃO 2: Número de linhas
    const lineCount = input.split('\n').length;
    if (lineCount > MAX_MESSAGE_LINES) {
      toast.error(`⚠️ Muitas linhas! Máximo: ${MAX_MESSAGE_LINES} linhas.`);
      return;
    }

    // 🛡️ VALIDAÇÃO 3: Rate limiting (cooldown)
    const now = Date.now();
    const timeSinceLastMessage = now - lastMessageTime;

    if (timeSinceLastMessage < COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((COOLDOWN_MS - timeSinceLastMessage) / 1000);
      toast.warning(`🕒 Aguarde ${remainingSeconds}s antes de enviar outra mensagem.`);
      setCooldownRemaining(remainingSeconds);
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setError(null);
    setIsLoading(true);
    setLastMessageTime(now); // Atualiza timestamp
    setCooldownRemaining(0);

    try {
      // Adiciona mensagem do usuário ao banco
      await addMessage("user", userMessage);

      // Carrega refeições anteriores do usuário
      const previousMealsContext = await loadUserMeals();

      // Detecta intenção do usuário
      const intent = detectIntent(userMessage, previousMealsContext);
      console.log('[handleSend] Intent detectado:', intent);

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
        // Calcular distribuição de macros por refeição
        const mealTargets = calculateMealDistribution(
          profile.target_calories,
          profile.target_protein,
          profile.target_carbs,
          profile.target_fat,
          profile.meals_per_day || 3
        );

        enhancedPrompt += `

📊 PERFIL COMPLETO DO USUÁRIO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 DADOS: ${profile.weight}kg | ${profile.height}cm | ${profile.age}a | ${profile.gender === 'male' ? 'M' : 'F'}
🎯 OBJETIVO: ${profile.goal === 'lose_weight' ? 'EMAGRECER' : profile.goal === 'gain_muscle' ? 'GANHAR MASSA' : 'MANTER'}
📈 Atividade: ${profile.activity_level} | TDEE: ${profile.tdee}kcal

⭐ METAS DIÁRIAS TOTAIS:
${profile.target_calories}kcal | ${profile.target_protein}g prot | ${profile.target_carbs}g carb | ${profile.target_fat}g gord

🍽️ DISTRIBUIÇÃO POR REFEIÇÃO (${profile.meals_per_day || 3} refeições/dia):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
☀️ CAFÉ: ${formatMealTargets('breakfast', mealTargets)}
🍽️ ALMOÇO: ${formatMealTargets('lunch', mealTargets)}
🌙 JANTAR: ${formatMealTargets('dinner', mealTargets)}
${(profile.meals_per_day || 3) >= 4 ? `🥜 LANCHE: ${formatMealTargets('snack', mealTargets)}` : ''}

🚫 RESTRIÇÕES: ${profile.dietary_restrictions?.join(', ') || 'Nenhuma'}
❤️ PREFERÊNCIAS: ${profile.preferred_foods?.slice(0, 5).join(', ') || 'Nenhuma'}


⚠️ PROTOCOLO DE CRIAÇÃO OBRIGATÓRIO:
1. SIGA ESTRITAMENTE a distribuição de macros acima para cada refeição (tolerância máx 5%).
   - Se o usuário pedir "dieta para hoje", gere TODAS as refeições listadas acima.
   - NÃO altere a quantidade de refeições calculada a menos que explicitamente pedido.

2. SEJA INTERATIVO E EDUCADO:
   - Se o pedido for ambíguo (ex: "mude o almoço"), PERGUNTE preferências antes de agir ou ofereça 2 opções curtas.
   - Se for criar o dia todo, avise: "Vou planejar seu dia com base na meta de ${profile.target_calories}kcal. Prefere algo específico para o almoço?"

3. REGRAS DE MACROS:
   - Priorize alimentos naturais.
   - Use as preferências do usuário: ${profile.preferred_foods?.slice(0, 3).join(', ')}
   - Evite absolutamente: ${profile.dietary_restrictions?.join(', ')}

${previousMealsContext}`;

      }

      // Adicionar prompt específico da intenção
      const intentPrompt = generateIntentPrompt(intent);
      if (intentPrompt) {
        enhancedPrompt += intentPrompt;
      }

      // Chama Groq API
      const response = await sendMessageToGroq(groqMessages, enhancedPrompt);

      // DEBUG: Mostrar resposta bruta
      console.log("🤖 Groq Response (raw):", response.substring(0, 500));

      // Primeiro, analisar a mensagem para detectar JSON/metadata
      const processed = processAssistantMessage(response);
      const { displayContent, metadata } = processed;

      // Tenta extrair refeições via parser (caso a string contenha JSON arrays/objetos com refeições)
      let parsedMeals = parseNutritionPlan(response);

      // Se parser não encontrou nada, mas metadata indica JSON, tente parsear o json bruto
      if ((!parsedMeals || parsedMeals.length === 0) && metadata.hasJSON && metadata.jsonContent) {
        try {
          // O JSON pode representar uma única refeição ou um array
          const raw = metadata.jsonContent;
          if (Array.isArray(raw)) {
            parsedMeals = raw;
          } else if (raw && typeof raw === 'object') {
            parsedMeals = [raw];
          }
        } catch (err) {
          console.warn('Não foi possível converter metadata.jsonContent em refeições', err);
        }
      }

      // Se encontramos refeições no JSON, salvamos ou atualizamos
      if (parsedMeals && parsedMeals.length > 0) {
        let savedCount = 0;
        const savedMealsSummaries: string[] = [];

        for (const parsedMeal of parsedMeals) {
          if (!parsedMeal || !parsedMeal.foods || parsedMeal.foods.length === 0) {
            console.warn('Refeição ignorada (sem alimentos)', parsedMeal);
            continue;
          }

          // Auto-corrigir totals se necessário
          const correctedMeal = autoCorrectTotals(parsedMeal);

          // Validar refeição
          const validation = validateMeal(correctedMeal);
          if (!validation.valid) {
            console.error('❌ Refeição inválida:', validation.errors);
            toast.error(`Refeição inválida: ${validation.errors[0]}`);
            continue;
          }

          if (validation.warnings.length > 0) {
            console.warn('⚠️ Avisos de validação:', validation.warnings);
          }

          const meal: Meal = {
            name: correctedMeal.name || 'Refeição gerada',
            description: correctedMeal.description || '',
            type: correctedMeal.meal_type || correctedMeal.type || 'breakfast',
            foods: correctedMeal.foods.map((f: any) => ({
              name: f.name,
              quantity: f.quantity || 0,
              unit: f.unit || 'g',
              macros: {
                protein: f.protein || 0,
                carbs: f.carbs || 0,
                fat: f.fat || 0,
                calories: f.calories || 0,
              },
              notes: f.notes || '',
            })),
            totalMacros: {
              protein: correctedMeal.totals?.protein || 0,
              carbs: correctedMeal.totals?.carbs || 0,
              fat: correctedMeal.totals?.fat || 0,
              calories: correctedMeal.totals?.calories || 0,
            },
          };

          try {
            // Verificar se é edição ou criação
            const isEdit = correctedMeal.action === 'edit' && correctedMeal.meal_id;
            let ok = false;

            if (isEdit) {
              console.log('[handleSend] EDITANDO refeição:', correctedMeal.meal_id);
              ok = await updateMealInDatabase(correctedMeal.meal_id, meal);
              if (ok) {
                savedMealsSummaries.push(`✏️ ${meal.name} (editado)`);
              }
            } else {
              console.log('[handleSend] CRIANDO nova refeição');
              ok = await saveMealToDatabase(meal);
              if (ok) {
                savedMealsSummaries.push(`${meal.name} (${Math.round(meal.totalMacros.calories)} kcal)`);
              }
            }

            if (ok) {
              savedCount++;
              console.log(`✅ Refeição "${meal.name}" ${isEdit ? 'atualizada' : 'salva'} (${savedCount}/${parsedMeals.length})`);
            } else {
              console.warn(`Refeição "${meal.name}" não foi ${isEdit ? 'atualizada' : 'salva'}.`);
            }
          } catch (err) {
            console.error('Erro ao processar refeição:', err);
          }
        }

        // Gerar mensagem amigável para o chat
        let friendly = '';
        if (savedMealsSummaries.length === 1) {
          friendly = `✅ Pronto — criei sua refeição: ${savedMealsSummaries[0]}. Ela está disponível em "Minhas Refeições".`;
        } else if (savedMealsSummaries.length > 1) {
          friendly = `✅ Criei ${savedMealsSummaries.length} refeições:
${savedMealsSummaries.map(s => `- ${s}`).join('\n')}

Todas estão em "Minhas Refeições".`;
        } else {
          friendly = '✅ Refeição(s) processada(s), verifique Minhas Refeições.';
        }

        await addMessage('assistant', friendly);
      } else {
        // Nenhuma refeição encontrada: salvar apenas a versão limpa da mensagem
        // `displayContent` já remove JSON/códigos e deixa texto amigável
        const clean = displayContent && displayContent.length > 0 ? displayContent : 'Resposta recebida.';
        await addMessage('assistant', clean);
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";

      // Detectar erros de limite (P0001 = Basic, P0002 = Free)
      if (errorMsg.includes("Limite") || errorMsg.includes("P0001") || errorMsg.includes("P0002")) {
        toast.error("Limite de mensagens atingido!", {
          description: "Faça upgrade para continuar conversando.",
          action: {
            label: "Fazer Upgrade",
            onClick: () => navigate("/dashboard?tab=profile"),
          },
          duration: 8000
        });
        setError("Limite atingido. Faça upgrade para continuar.");
      } else {
        toast.error("Erro ao enviar mensagem. Tente novamente.");
        setError(errorMsg);
      }
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

  // Mensagem inicial dinâmica baseada no perfil
  const getInitialMessage = (): string => {
    if (!profile) {
      return "Olá! 👋 Sou a myNutrIA, sua assistente de nutrição com IA.\n\n🎯 Como funciono:\n1. Você me conta sobre seus objetivos (emagrecer, ganhar massa, manter)\n2. Peço informações sobre seu peso, altura, atividades, etc\n3. Calculo suas necessidades calóricas (TDEE)\n4. Crio refeições balanceadas automaticamente\n\n💪 Quando gero uma refeição:\n✨ Aparece automaticamente em \"Minhas Refeições\"\n✅ Você marca quando consumiu\n🔥 Seu streak aumenta (como no Duolingo)\n\n📊 Vamos começar? Me conte seu objetivo principal!";
    }

    // Se perfil existe, mensagem personalizada
    const goalText = profile.goal === 'lose_weight' ? 'emagrecimento' : profile.goal === 'gain_muscle' ? 'ganho de massa muscular' : 'manutenção de peso';

    return `Olá! 👋 Sou a myNutrIA, sua assistente de nutrição.\n\n📊 **Perfil carregado com sucesso!**\n👤 ${profile.weight}kg | ${profile.height}cm | ${profile.age} anos\n🎯 Objetivo: ${goalText}\n⚡ Meta diária: ${profile.target_calories}kcal\n🍽️ Macros: ${profile.target_protein}g prot | ${profile.target_carbs}g carb | ${profile.target_fat}g gord\n\n💡 **Como posso ajudar?**\n• "Cria 4 refeições para hoje"\n• "Faz um café da manhã com 400 calorias"\n• "Muda o almoço para incluir mais proteína"\n• "Preciso de opções vegetarianas"\n\nO que você gostaria? 😊`;
  };

  const displayMessages = showInitialMessage && messages.length === 0 ? [
    {
      role: "assistant" as const,
      content: getInitialMessage(),
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
              {displayMessages.map((message, idx) => {
                const displayContent = formatMessageForDisplay(message.role, message.content);
                const actionSummary = message.role === "assistant" ? generateActionSummary(processAssistantMessage(message.content).metadata) : "";

                return (
                  <div
                    key={idx}
                    className={`flex gap-3 animate-in fade-in ${message.role === "user" ? "justify-end" : ""
                      }`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl p-3 max-w-[85%] text-sm transition-all ${message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted rounded-tl-sm"
                        }`}
                    >
                      {actionSummary && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold mb-2 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="w-3 h-3" />
                          {actionSummary}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {displayContent}
                      </div>
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}

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
              onKeyPress={(e) => e.key === "Enter" && !isLoading && !error?.includes("Limite") && handleSend()}
              placeholder={error?.includes("Limite") ? "Limite atingido. Faça upgrade." : "Digite sua mensagem..."}
              disabled={isLoading || (error !== null && error.includes("Limite"))}
              className="flex-1 rounded-full border-primary/30"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim() || (error !== null && error.includes("Limite"))}
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
                {displayMessages.map((message, idx) => {
                  const displayContent = formatMessageForDisplay(message.role, message.content);
                  const actionSummary = message.role === "assistant" ? generateActionSummary(processAssistantMessage(message.content).metadata) : "";

                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 ${message.role === "user" ? "justify-end" : ""
                        }`}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-md">
                          <Sparkles className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                      <div
                        className={`rounded-2xl p-4 max-w-[80%] text-sm font-medium transition-all ${message.role === "user"
                          ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-tr-sm shadow-md hover:shadow-lg"
                          : "bg-white border border-muted-foreground/20 rounded-tl-sm shadow-sm hover:shadow-md dark:bg-muted"
                          }`}
                      >
                        {actionSummary && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold mb-2 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-3 h-3" />
                            {actionSummary}
                          </div>
                        )}
                        <div className="whitespace-pre-wrap font-medium leading-relaxed">
                          {displayContent}
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
                  );
                })}

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
