-- Migration: Enforce Usage Limits
-- Description: Triggers to enforce messaging limits based on subscription plan
-- Date: 2026-01-18

CREATE OR REPLACE FUNCTION public.check_message_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_plan public.subscription_plan;
  v_count integer;
  v_user_id uuid;
BEGIN
  -- Get the user ID from the new record
  v_user_id := NEW.user_id;

  -- Fetch user's subscription plan
  SELECT subscription_plan INTO v_plan
  FROM public.profiles
  WHERE id = v_user_id;

  -- If no profile found, default to free (safety net)
  IF v_plan IS NULL THEN
    v_plan := 'free'::public.subscription_plan;
  END IF;

  -- 1. PREMIUM / PRO: No Limits (Skip checks)
  IF v_plan IN ('pro', 'premium') THEN
    RETURN NEW;
  END IF;

  -- 2. BASIC PLAN: 5 messages per day
  IF v_plan = 'basic' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.chat_messages
    WHERE user_id = v_user_id
      AND created_at > NOW() - INTERVAL '24 hours';
      
    IF v_count >= 5 THEN
       RAISE EXCEPTION 'Limite diário do plano Básico atingido (5 mensagens/24h). Faça upgrade para continuar.'
       USING ERRCODE = 'P0001'; -- Custom error code
    END IF;
    
    RETURN NEW;
  END IF;

  -- 3. FREE PLAN: 10 messages per month (30 days rolling window)
  -- Note: Requirement said "per month", interpreting as rolling 30 days for simplicity
  IF v_plan = 'free' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.chat_messages
    WHERE user_id = v_user_id
      AND created_at > NOW() - INTERVAL '30 days';
      
    IF v_count >= 10 THEN
       RAISE EXCEPTION 'Limite mensal do plano Grátis atingido (10 mensagens/mês). Faça upgrade para continuar.'
       USING ERRCODE = 'P0002';
    END IF;
    
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run BEFORE inserting a new message
DROP TRIGGER IF EXISTS enforce_message_limits_trigger ON public.chat_messages;

CREATE TRIGGER enforce_message_limits_trigger
BEFORE INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.check_message_limits();
