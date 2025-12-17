import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getLocalDateString, getTodayString } from '@/lib/dateUtils';

export interface DailyConsumption {
  id: string;
  user_id: string;
  meal_id: string;
  consumed_date: string;
  macros_met: number;
  streak_active: boolean;
  created_at: string;
}

export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  best_streak: number;
  last_activity_date: string | null;
  start_date: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook para gerenciar consumo diário e streak de aderência
 */
export function useConsumptionTrackingInternal() {
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [consumptions, setConsumptions] = useState<DailyConsumption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Carrega streak do usuário
   */
  const loadStreak = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_streak')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned (esperado para novo usuário)
        throw error;
      }

      setStreak(data as UserStreak | null);
    } catch (err) {
      console.error('Erro ao carregar streak:', err);
      setStreak(null);
    }
  }, []);

  /**
   * Carrega consumos do mês/período
   */
  const loadConsumptions = useCallback(async (days: number = 30) => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data } = await supabase
        .from('daily_consumption')
        .select('*')
        .eq('user_id', user.id)
        .gte('consumed_date', getLocalDateString(startDate))
        .order('consumed_date', { ascending: false });

      setConsumptions((data as DailyConsumption[]) || []);
    } catch (err) {
      console.error('Erro ao carregar consumos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Atualiza streak baseado em atividade recente
   * Calcula corretamente a sequência de dias consecutivos com atividade
   */
  const updateStreak = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar TODAS as datas de atividade dos últimos 90 dias (ordenadas)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);

      const { data: consumptionsData } = await supabase
        .from('daily_consumption')
        .select('consumed_date')
        .eq('user_id', user.id)
        .gte('consumed_date', getLocalDateString(startDate))
        .order('consumed_date', { ascending: true });

      // Obter datas únicas e ordenadas
      const activeDates = new Set(
        (consumptionsData || [])
          .map(c => c.consumed_date) // Já está em formato YYYY-MM-DD
      );

      const today = getTodayString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getLocalDateString(yesterday);

      let newStreak = 0;
      let newBestStreak = streak?.best_streak || 0;

      // Calcular streak atual: contar dias consecutivos até hoje/ontem
      if (activeDates.has(today) || activeDates.has(yesterdayStr)) {
        // Começar do hoje ou ontem e contar para trás
        const startFrom = activeDates.has(today) ? today : yesterdayStr;

        // Contar sequência de dias consecutivos
        let currentDate = new Date(startFrom);
        newStreak = 1;

        for (let i = 1; i < 365; i++) {
          currentDate.setDate(currentDate.getDate() - 1);
          const checkDate = getLocalDateString(currentDate);

          if (activeDates.has(checkDate)) {
            newStreak++;
          } else {
            break; // Para ao encontrar primeiro dia sem atividade
          }
        }
      }

      newBestStreak = Math.max(newStreak, newBestStreak);

      // Buscar registro existente
      const { data: existingStreak } = await supabase
        .from('user_streak')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const streakData = {
        user_id: user.id,
        current_streak: newStreak,
        best_streak: newBestStreak,
        last_activity_date: Array.from(activeDates).pop() || null, // Última data com atividade
        start_date: streak?.start_date || today,
        updated_at: new Date().toISOString(),
      };

      let updateData;

      if (existingStreak) {
        // Atualizar registro existente
        const { data } = await supabase
          .from('user_streak')
          .update(streakData)
          .eq('user_id', user.id)
          .select()
          .single();
        updateData = data;
      } else {
        // Criar novo registro
        const { data } = await supabase
          .from('user_streak')
          .insert({
            ...streakData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        updateData = data;
      }

      setStreak(updateData as UserStreak);
    } catch (err) {
      console.error('Erro ao atualizar streak:', err);
    }
  }, [streak]);


  /**
   * Marca refeição como consumida
   * Evita duplicação ao verificar se já existe registro
   */
  const markMealConsumed = useCallback(
    async (mealId: string, macrosMet: number = 100) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const today = getTodayString();

        // Verificar se já existe consumo deste prato hoje
        const { data: existingConsumption } = await supabase
          .from('daily_consumption')
          .select('id, macros_met')
          .eq('user_id', user.id)
          .eq('meal_id', mealId)
          .eq('consumed_date', today)
          .eq('consumed_date', today)
          .maybeSingle();

        if (existingConsumption) {
          // Já foi consumido hoje, apenas atualizar macros_met se necessário
          const { error } = await supabase
            .from('daily_consumption')
            .update({ macros_met: Math.max(macrosMet, existingConsumption.macros_met || 100) })
            .eq('id', existingConsumption.id);

          if (error) throw error;
        } else {
          // Novo consumo, inserir registro
          const { error } = await supabase
            .from('daily_consumption')
            .insert({
              user_id: user.id,
              meal_id: mealId,
              consumed_date: today,
              macros_met: macrosMet,
              streak_active: true,
            });

          if (error) throw error;
        }

        // Atualizar streak com base em TODAS as atividades
        await updateStreak();
        await loadConsumptions();
      } catch (err) {
        console.error('Erro ao marcar refeição consumida:', err);
      }
    },
    [loadConsumptions, updateStreak]
  );

  /**
   * Desmarca refeição como consumida
   * Remove o registro de consumo do dia de hoje
   */
  const unmarkMealConsumed = useCallback(
    async (mealId: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const today = getTodayString();

        // Deletar consumo da refeição de hoje
        const { error } = await supabase
          .from('daily_consumption')
          .delete()
          .eq('user_id', user.id)
          .eq('meal_id', mealId)
          .eq('consumed_date', today);

        if (error) throw error;

        // Atualizar streak e recarregar consumos
        await updateStreak();
        await loadConsumptions();
      } catch (err) {
        console.error('Erro ao desmarcar refeição:', err);
      }
    },
    [loadConsumptions, updateStreak]
  );

  /**
   * Obtém consumos de um dia específico
   */
  const getConsumptionsByDate = useCallback(
    (date: Date) => {
      const dateStr = getLocalDateString(date);
      return consumptions.filter((c) => c.consumed_date === dateStr);
    },
    [consumptions]
  );

  /**
   * Verifica se um dia tem atividade (fogo 🔥)
   */
  const hasDayActivity = useCallback(
    (date: Date) => {
      const dateStr = getLocalDateString(date);
      return consumptions.some((c) => c.consumed_date === dateStr && c.streak_active);
    },
    [consumptions]
  );

  return {
    streak,
    consumptions,
    isLoading,
    loadStreak,
    loadConsumptions,
    markMealConsumed,
    unmarkMealConsumed,
    updateStreak,
    getConsumptionsByDate,
    hasDayActivity,
  };
}

export default useConsumptionTrackingInternal;
