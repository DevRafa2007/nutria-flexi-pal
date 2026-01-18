-- ==============================================================================
-- NUTRIA FLEXI PAL - SUBSCRIPTION & SECURITY MIGRATION
-- Data: 2026-01-18
-- Descrição: Configura esquema de assinaturas, RLS e triggers de limite de mensagens
-- Execute este script no SQL Editor do Supabase Dashboard
-- ==============================================================================

BEGIN;

-- 1. CRIAÇÃO DOS TIPOS (ENUMS)
-- Se der erro que já existem, pode ignorar
DO $$ BEGIN
    CREATE TYPE public.subscription_plan AS ENUM ('free', 'basic', 'pro', 'premium');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. ATUALIZAÇÃO DA TABELA PROFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_plan public.subscription_plan DEFAULT 'free'::public.subscription_plan,
ADD COLUMN IF NOT EXISTS subscription_status public.subscription_status,
ADD COLUMN IF NOT EXISTS current_period_end timestamp with time zone;

-- Índice para performance
CREATE INDEX IF NOT EXISTS profiles_subscription_plan_idx ON public.profiles(subscription_plan);

-- 3. SEGURANÇA: PROTEGER CAMPOS DE ASSINATURA (RLS/TRIGGER)
-- Impede que usuários normais façam UPDATE manual no seu plano via API

CREATE OR REPLACE FUNCTION public.protect_subscription_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o usuário NÃO for 'service_role' (ou seja, é um usuário normal ou anon)
  -- Nota: auth.jwt()->>'role' pode ser usado, mas checagem de permissão direta é mais segura.
  -- Aqui assumimos que apenas eventos de sistema (Webhooks) devem alterar isso.
  
  IF current_user NOT IN ('postgres', 'service_role') THEN
    IF (NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan) OR
       (NEW.subscription_status IS DISTINCT FROM OLD.subscription_status) OR
       (NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id) OR
       (NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id) OR
       (NEW.current_period_end IS DISTINCT FROM OLD.current_period_end) THEN
       
       RAISE EXCEPTION 'Você não tem permissão para alterar seu plano de assinatura manualmente.';
    END IF;
  END IF;
  return NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_subscription_fields_trigger ON public.profiles;
CREATE TRIGGER protect_subscription_fields_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_subscription_fields();

-- 4. SEGURANÇA: ENFORCE DE LIMITES DE MENSAGEM
-- Regras:
-- Free: 10 msg / 30 dias
-- Basic: 5 msg / dia
-- Pro/Premium: Ilimitado

CREATE OR REPLACE FUNCTION public.check_message_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_plan public.subscription_plan;
  v_count integer;
  v_user_id uuid;
BEGIN
  v_user_id := NEW.user_id;

  -- Buscar plano
  SELECT subscription_plan INTO v_plan
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_plan IS NULL THEN v_plan := 'free'::public.subscription_plan; END IF;

  -- Sem limites para Pro/Premium
  IF v_plan IN ('pro', 'premium') THEN RETURN NEW; END IF;

  -- Básico: 5/dia
  IF v_plan = 'basic' THEN
    SELECT COUNT(*) INTO v_count FROM public.chat_messages
    WHERE user_id = v_user_id AND created_at > NOW() - INTERVAL '24 hours';
    
    IF v_count >= 5 THEN
       RAISE EXCEPTION 'Limite diário atingido (5 msg/dia). Upgrade para Pro?';
    END IF;
    RETURN NEW;
  END IF;

  -- Grátis: 10/mês
  IF v_plan = 'free' THEN
    SELECT COUNT(*) INTO v_count FROM public.chat_messages
    WHERE user_id = v_user_id AND created_at > NOW() - INTERVAL '30 days';
    
    IF v_count >= 10 THEN
       RAISE EXCEPTION 'Limite mensal atingido (10 msg/mês). Assine para continuar!';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_message_limits_trigger ON public.chat_messages;
CREATE TRIGGER enforce_message_limits_trigger
BEFORE INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.check_message_limits();

COMMIT;
