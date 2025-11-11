-- =====================================================
-- EXECUTE ESTE SQL NO SUPABASE SQL EDITOR
-- =====================================================
-- Para executar:
-- 1. Vá para Supabase Dashboard
-- 2. Clique em "SQL Editor"
-- 3. Cole e execute este código
-- =====================================================

-- Criar tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Informações básicas
  weight DECIMAL(5,2), -- peso em kg
  height DECIMAL(5,2), -- altura em cm
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  
  -- Objetivos e atividade
  goal TEXT CHECK (goal IN ('lose_weight', 'gain_muscle', 'maintain')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  
  -- Preferências alimentares
  dietary_restrictions TEXT[], -- array de restrições (ex: ['gluten', 'lactose'])
  preferred_foods TEXT[], -- alimentos preferidos
  disliked_foods TEXT[], -- alimentos que não gosta
  
  -- Metas calculadas (TDEE e macros)
  tdee INTEGER, -- calorias de manutenção
  target_calories INTEGER, -- meta de calorias diárias
  target_protein DECIMAL(6,2), -- meta de proteína em gramas
  target_carbs DECIMAL(6,2), -- meta de carboidratos em gramas
  target_fat DECIMAL(6,2), -- meta de gordura em gramas
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
