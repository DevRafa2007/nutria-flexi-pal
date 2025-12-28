-- Migration 0011: Fix Profiles Table RLS Security Vulnerability
-- 
-- PROBLEMA: A política atual permite que QUALQUER PESSOA veja TODOS os perfis
-- SOLUÇÃO: Restringir acesso apenas ao próprio perfil do usuário
--
-- Data: 2025-12-27

-- Remover política pública perigosa
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- Remover políticas antigas para garantir limpeza
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Criar política SEGURA: usuários só veem o próprio perfil
CREATE POLICY "Users can view their own profile."
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Recriar políticas de insert e update (mantendo a mesma lógica)
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Comentário de segurança
COMMENT ON TABLE public.profiles IS 'User profiles - RLS enabled: users can only access their own data';
