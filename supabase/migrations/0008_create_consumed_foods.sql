-- Criar tabela para rastrear alimentos individuais consumidos
-- Permite rastreamento granular ao nível de alimento, não de refeição completa

CREATE TABLE IF NOT EXISTS public.consumed_foods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_id uuid NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  food_index integer NOT NULL,
  consumed_date date NOT NULL DEFAULT CURRENT_DATE,
  calories numeric NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fat numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Garantir que não haja duplicatas (mesmo alimento marcado duas vezes no mesmo dia)
  CONSTRAINT unique_consumed_food UNIQUE(user_id, meal_id, food_index, consumed_date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_consumed_foods_user_date ON public.consumed_foods(user_id, consumed_date DESC);
CREATE INDEX IF NOT EXISTS idx_consumed_foods_meal ON public.consumed_foods(meal_id);

-- Comentários
COMMENT ON TABLE public.consumed_foods IS 'Rastreia alimentos individuais consumidos (não refeições completas)';
COMMENT ON COLUMN public.consumed_foods.food_index IS 'Índice do alimento dentro da refeição (0, 1, 2...)';
COMMENT ON COLUMN public.consumed_foods.consumed_date IS 'Data do consumo (formato local YYYY-MM-DD)';

-- Habilitar RLS
ALTER TABLE public.consumed_foods ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can view their own consumed foods"
  ON public.consumed_foods
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consumed foods"
  ON public.consumed_foods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own consumed foods"
  ON public.consumed_foods
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own consumed foods"
  ON public.consumed_foods
  FOR UPDATE
  USING (auth.uid() = user_id);
