import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

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
export function useConsumptionTracking() {
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

      const { data } = await supabase
        .from('user_streak')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setStreak(data as UserStreak);
    } catch (err) {
      console.error('Erro ao carregar streak:', err);
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
        .gte('consumed_date', startDate.toISOString().split('T')[0])
        .order('consumed_date', { ascending: false });

      setConsumptions((data as DailyConsumption[]) || []);
    } catch (err) {
      console.error('Erro ao carregar consumos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Marca refeição como consumida
   */
  const markMealConsumed = useCallback(
    async (mealId: string, macrosMet: number = 100) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];

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

        // Atualizar streak
        await updateStreak();
        await loadConsumptions();
      } catch (err) {
        console.error('Erro ao marcar refeição consumida:', err);
      }
    },
    [loadConsumptions]
  );

  /**
   * Atualiza streak baseado em atividade recente
   */
  const updateStreak = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar última atividade
      const { data: lastConsumption } = await supabase
        .from('daily_consumption')
        .select('consumed_date')
        .eq('user_id', user.id)
        .order('consumed_date', { ascending: false })
        .limit(1)
        .single();

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const lastDate = lastConsumption
        ? new Date(lastConsumption.consumed_date)
        : null;

      let newStreak = streak?.current_streak || 0;
      let newBestStreak = streak?.best_streak || 0;

      // Se teve atividade hoje ou ontem, continua streak
      if (
        lastDate &&
        (lastDate.toDateString() === today.toDateString() ||
          lastDate.toDateString() === yesterday.toDateString())
      ) {
        newStreak = (streak?.current_streak || 0) + 1;
        newBestStreak = Math.max(newStreak, streak?.best_streak || 0);
      } else {
        newStreak = 0; // Reset streak se pulou dia
      }

      const { data } = await supabase
        .from('user_streak')
        .upsert({
          user_id: user.id,
          current_streak: newStreak,
          best_streak: newBestStreak,
          last_activity_date: today.toISOString().split('T')[0],
          start_date: streak?.start_date || today.toISOString().split('T')[0],
        })
        .select()
        .single();

      setStreak(data as UserStreak);
    } catch (err) {
      console.error('Erro ao atualizar streak:', err);
    }
  }, [streak]);

  /**
   * Obtém consumos de um dia específico
   */
  const getConsumptionsByDate = useCallback(
    (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      return consumptions.filter((c) => c.consumed_date === dateStr);
    },
    [consumptions]
  );

  /**
   * Verifica se um dia tem atividade (fogo 🔥)
   */
  const hasDayActivity = useCallback(
    (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
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
    updateStreak,
    getConsumptionsByDate,
    hasDayActivity,
  };
}

export default useConsumptionTracking;
