-- Migration 0012: Add Rate Limiting and Message Size Constraints
-- Protects against spam attacks on AI endpoints
-- Data: 2025-12-27

-- =====================================================
-- 1. CREATE RATE LIMITING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.chat_rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  message_count integer DEFAULT 1,
  last_message_at timestamp with time zone DEFAULT NOW(),
  window_start timestamp with time zone DEFAULT NOW(),
  created_at timestamp with time zone DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.chat_rate_limit ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see/update their own rate limit data
DROP POLICY IF EXISTS "Users can manage their own rate limit" ON public.chat_rate_limit;
CREATE POLICY "Users can manage their own rate limit"
  ON public.chat_rate_limit FOR ALL
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS chat_rate_limit_user_id_idx ON public.chat_rate_limit(user_id);
CREATE INDEX IF NOT EXISTS chat_rate_limit_window_start_idx ON public.chat_rate_limit(window_start);

-- =====================================================
-- 2. ADD MESSAGE SIZE CONSTRAINTS
-- =====================================================

-- First, truncate existing messages that are too long
-- This prevents constraint violation error
UPDATE public.chat_messages 
SET content = LEFT(content, 2000) || '... [truncado]'
WHERE char_length(content) > 2000;

-- Log how many were truncated
DO $$ 
DECLARE
  truncated_count integer;
BEGIN
  SELECT COUNT(*) INTO truncated_count
  FROM public.chat_messages
  WHERE content LIKE '%... [truncado]';
  
  RAISE NOTICE 'Truncated % messages to 2000 characters', truncated_count;
END $$;

-- Now add the constraint (should work since all messages are <= 2000 chars)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chat_messages_content_length_check'
  ) THEN
    ALTER TABLE public.chat_messages 
    ADD CONSTRAINT chat_messages_content_length_check 
    CHECK (char_length(content) <= 2000);
    
    RAISE NOTICE 'Added content length constraint (max 2000 chars)';
  ELSE
    RAISE NOTICE 'Content length constraint already exists';
  END IF;
END $$;

-- =====================================================
-- 3. AUTO-CLEANUP OLD MESSAGES (>30 days)
-- =====================================================

-- Function to delete old messages
CREATE OR REPLACE FUNCTION cleanup_old_chat_messages()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.chat_messages
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_old_chat_messages() TO authenticated;

-- Note: In production, schedule this via Supabase cron or pg_cron
-- Example cron (uncomment if using pg_cron):
-- SELECT cron.schedule('cleanup-old-messages', '0 2 * * *', 
--   $$SELECT cleanup_old_chat_messages()$$
-- );

-- =====================================================
-- 4. HELPER FUNCTION: Check Rate Limit
-- =====================================================

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id uuid,
  p_max_per_minute integer DEFAULT 20,
  p_max_per_day integer DEFAULT 200
)
RETURNS boolean AS $$
DECLARE
  v_count_minute integer;
  v_count_day integer;
  v_record RECORD;
BEGIN
  -- Get or create rate limit record
  SELECT * INTO v_record 
  FROM public.chat_rate_limit 
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- First message, create record
    INSERT INTO public.chat_rate_limit (user_id, message_count, window_start)
    VALUES (p_user_id, 1, NOW());
    RETURN true;
  END IF;
  
  -- Count messages in last minute
  SELECT COUNT(*) INTO v_count_minute
  FROM public.chat_messages
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 minute';
  
  -- Count messages in last day
  SELECT COUNT(*) INTO v_count_day
  FROM public.chat_messages
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 day';
  
  -- Check limits
  IF v_count_minute >= p_max_per_minute THEN
    RAISE EXCEPTION 'Rate limit exceeded: % messages per minute', p_max_per_minute
      USING HINT = 'Please wait before sending more messages';
  END IF;
  
  IF v_count_day >= p_max_per_day THEN
    RAISE EXCEPTION 'Daily limit exceeded: % messages per day', p_max_per_day
      USING HINT = 'You have reached your daily message limit';
  END IF;
  
  -- Update rate limit record
  UPDATE public.chat_rate_limit
  SET message_count = message_count + 1,
      last_message_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_rate_limit(uuid, integer, integer) TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.chat_rate_limit IS 'Rate limiting tracker for chat messages to prevent spam';
COMMENT ON FUNCTION check_rate_limit IS 'Validates if user is within rate limits (20/min, 200/day)';
COMMENT ON FUNCTION cleanup_old_chat_messages IS 'Deletes chat messages older than 30 days to save storage';
