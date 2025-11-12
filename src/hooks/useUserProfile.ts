import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export interface UserProfile {
  id?: string;
  user_id?: string;
  weight?: number;
  height?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  goal?: 'lose_weight' | 'gain_muscle' | 'maintain';
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dietary_restrictions?: string[];
  preferred_foods?: string[];
  disliked_foods?: string[];
  tdee?: number;
  target_calories?: number;
  target_protein?: number;
  target_carbs?: number;
  target_fat?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Hook para gerenciar perfil do usuário
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calcula TDEE baseado nas informações do perfil
   * Fórmula de Harris-Benedict
   */
  const calculateTDEE = useCallback((profileData: UserProfile): number => {
    if (!profileData.weight || !profileData.height || !profileData.age || !profileData.gender) {
      return 0;
    }

    let bmr: number;

    // Calcular BMR
    if (profileData.gender === 'male') {
      bmr = 88.362 + (13.397 * profileData.weight) + (4.799 * profileData.height) - (5.677 * profileData.age);
    } else if (profileData.gender === 'female') {
      bmr = 447.593 + (9.247 * profileData.weight) + (3.098 * profileData.height) - (4.330 * profileData.age);
    } else {
      // Para 'other', usar média entre masculino e feminino
      const bmrMale = 88.362 + (13.397 * profileData.weight) + (4.799 * profileData.height) - (5.677 * profileData.age);
      const bmrFemale = 447.593 + (9.247 * profileData.weight) + (3.098 * profileData.height) - (4.330 * profileData.age);
      bmr = (bmrMale + bmrFemale) / 2;
    }

    // Multiplicadores de atividade
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const tdee = bmr * (activityMultipliers[profileData.activity_level || 'sedentary'] || 1.2);
    return Math.round(tdee);
  }, []);

  /**
   * Calcula macros baseado no objetivo
   */
  const calculateMacros = useCallback((profileData: UserProfile, tdee: number) => {
    if (!profileData.weight || !profileData.goal) return null;

    let targetCalories = tdee;
    let proteinGrams = 0;
    let fatGrams = 0;
    let carbsGrams = 0;

    // Ajustar calorias baseado no objetivo
    if (profileData.goal === 'lose_weight') {
      targetCalories = tdee - 400; // Déficit de 400 kcal
      proteinGrams = profileData.weight * 2.0; // 2.0g/kg para preservar músculos
    } else if (profileData.goal === 'gain_muscle') {
      targetCalories = tdee + 400; // Superávit de 400 kcal
      proteinGrams = profileData.weight * 1.8; // 1.8g/kg
    } else {
      proteinGrams = profileData.weight * 1.6; // 1.6g/kg para manutenção
    }

    // Calcular gordura (0.9g/kg)
    fatGrams = profileData.weight * 0.9;

    // Carboidratos = resto das calorias
    const proteinCalories = proteinGrams * 4;
    const fatCalories = fatGrams * 9;
    const carbsCalories = targetCalories - proteinCalories - fatCalories;
    carbsGrams = carbsCalories / 4;

    return {
      target_calories: Math.round(targetCalories),
      target_protein: Math.round(proteinGrams * 10) / 10,
      target_carbs: Math.round(carbsGrams * 10) / 10,
      target_fat: Math.round(fatGrams * 10) / 10,
    };
  }, []);

  /**
   * Carrega perfil do usuário
   */
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Usuário não autenticado');
        setProfile(null);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setProfile(data);
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      setError('Erro ao carregar perfil');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Salva ou atualiza perfil
   */
  const saveProfile = useCallback(async (profileData: Partial<UserProfile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Calcular TDEE e macros se tiver dados suficientes
      const fullProfile = { ...profile, ...profileData };
      const tdee = calculateTDEE(fullProfile as UserProfile);
      const macros = tdee > 0 ? calculateMacros(fullProfile as UserProfile, tdee) : null;

      const dataToSave = {
        id: user.id,
        ...profileData,
        ...(tdee > 0 && { tdee }),
        ...(macros && macros),
      };

      // Verificar se perfil já existe
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (existingProfile) {
        // Atualizar
        const { error: updateError } = await supabase
          .from('profiles')
          .update(dataToSave)
          .eq('id', user.id);

        if (updateError) throw updateError;
      } else {
        // Inserir
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(dataToSave);

        if (insertError) throw insertError;
      }

      toast.success('Perfil salvo com sucesso!');
      await loadProfile(); // Recarregar perfil
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      toast.error('Erro ao salvar perfil');
      throw err;
    }
  }, [profile, calculateTDEE, calculateMacros, loadProfile]);

  // Carregar perfil ao montar
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    isLoading,
    error,
    saveProfile,
    loadProfile,
  };
}

export default useUserProfile;
