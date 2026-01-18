-- ATUALIZAÇÃO: Aumentar limite do Basic para 10 mensagens/dia

CREATE OR REPLACE FUNCTION public.check_message_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_plan public.subscription_plan;
  v_count integer;
  v_user_id uuid;
BEGIN
  v_user_id := NEW.user_id;

  SELECT subscription_plan INTO v_plan
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_plan IS NULL THEN v_plan := 'free'::public.subscription_plan; END IF;

  IF v_plan IN ('pro', 'premium') THEN RETURN NEW; END IF;

  -- Básico: 10 msg / dia (ATUALIZADO)
  IF v_plan = 'basic' THEN
    SELECT COUNT(*) INTO v_count FROM public.chat_messages
    WHERE user_id = v_user_id AND created_at > NOW() - INTERVAL '24 hours';
    
    IF v_count >= 10 THEN
       RAISE EXCEPTION 'Limite diário do plano Básico atingido (10 msg/dia). Faça upgrade para ilimitado!'
       USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
  END IF;

  -- Grátis: 10 msg / mês
  IF v_plan = 'free' THEN
    SELECT COUNT(*) INTO v_count FROM public.chat_messages
    WHERE user_id = v_user_id AND created_at > NOW() - INTERVAL '30 days';
    
    IF v_count >= 10 THEN
       RAISE EXCEPTION 'Limite mensal atingido (10 msg/mês). Assine para continuar!'
       USING ERRCODE = 'P0002';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- HELPER: Função para o Frontend pegar stats de uso facilmente
CREATE OR REPLACE FUNCTION public.get_user_usage()
RETURNS json AS $$
DECLARE
  v_plan public.subscription_plan;
  v_count integer;
  v_limit integer;
  v_period_end timestamptz;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  -- Pegar plano
  SELECT subscription_plan, current_period_end 
  INTO v_plan, v_period_end
  FROM public.profiles WHERE id = v_user_id;
  
  IF v_plan IS NULL THEN v_plan := 'free'; END IF;
  
  -- Calcular uso
  IF v_plan = 'basic' THEN
    SELECT COUNT(*) INTO v_count FROM public.chat_messages
    WHERE user_id = v_user_id AND created_at > NOW() - INTERVAL '24 hours';
    v_limit := 10;
  ELSIF v_plan = 'free' THEN
    SELECT COUNT(*) INTO v_count FROM public.chat_messages
    WHERE user_id = v_user_id AND created_at > NOW() - INTERVAL '30 days';
    v_limit := 10;
  ELSE
    v_count := 0; 
    v_limit := -1; -- Ilimitado
  END IF;
  
  RETURN json_build_object(
    'plan', v_plan,
    'usage_count', v_count,
    'usage_limit', v_limit,
    'current_period_end', v_period_end
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
